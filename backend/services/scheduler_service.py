from apscheduler.schedulers.background import BackgroundScheduler
from backend.database.session import SessionLocal
from backend.services.recovery_service import RecoveryService
from backend.models.followup import FollowUp
from backend.models.activity import Activity
from datetime import datetime, timezone
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SchedulerService")

class SchedulerService:
    _scheduler = None

    @classmethod
    def start_scheduler(cls):
        """Starts background interval worker threads for lead scans and task audits."""
        if cls._scheduler and cls._scheduler.running:
            return

        cls._scheduler = BackgroundScheduler()
        
        # Job 1: Daily scan to detect stalled leads (24 hours)
        cls._scheduler.add_job(
            cls._trigger_recovery_scan,
            "interval",
            days=1,
            id="daily_recovery_scan",
            replace_existing=True
        )
        
        # Job 2: Hourly check to mark past-due followups as overdue
        cls._scheduler.add_job(
            cls._check_overdue_tasks,
            "interval",
            hours=1,
            id="check_overdue_tasks",
            replace_existing=True
        )
        
        cls._scheduler.start()
        logger.info("Background CRM Scheduler started successfully (Recovery and Overdue checks active).")

    @classmethod
    def shutdown_scheduler(cls):
        """Stops all background job workers during uvicorn application shutdown."""
        if cls._scheduler and cls._scheduler.running:
            cls._scheduler.shutdown()
            logger.info("Background CRM Scheduler thread terminated.")

    @staticmethod
    def _trigger_recovery_scan():
        """Worker executing automated lead risk checks."""
        db = SessionLocal()
        try:
            logger.info("Running automated Lead Recovery AI scan job...")
            service = RecoveryService()
            cases = service.run_recovery_scan(db)
            logger.info(f"Automated Lead Recovery scan complete. Processed {len(cases)} cases.")
        except Exception as err:
            logger.error(f"Automated Lead Recovery scan failed: {err}")
        finally:
            db.close()

    @staticmethod
    def _check_overdue_tasks():
        """Worker executing task deadlines audits and marking overdue follow-ups."""
        db = SessionLocal()
        try:
            logger.info("Auditing follow-up task deadlines...")
            now = datetime.now(timezone.utc)
            overdue_tasks = db.query(FollowUp).filter(
                FollowUp.status.in_(["pending", "scheduled"]),
                FollowUp.scheduled_at < now
            ).all()

            for task in overdue_tasks:
                task.status = "overdue"
                # Log timeline note
                act = Activity(
                    lead_id=task.lead_id,
                    type="System",
                    content=f"Task overdue: {task.title} (Scheduled: {task.scheduled_at.strftime('%Y-%m-%d')})"
                )
                db.add(act)
                logger.info(f"Marked task ID {task.id} as overdue.")
                
            if overdue_tasks:
                db.commit()
                logger.info(f"Successfully marked {len(overdue_tasks)} tasks as overdue.")
        except Exception as err:
            logger.error(f"Failed to audit task deadlines: {err}")
        finally:
            db.close()
