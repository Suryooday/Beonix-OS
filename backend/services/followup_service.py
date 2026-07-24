import os
import json
import httpx
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from backend.models.lead import Lead
from backend.models.activity import Activity
from backend.models.followup import FollowUp, FollowUpExecution
from backend.services.lead_chat_service import OLLAMA_HOST, OLLAMA_MODEL
from backend.services.task_generator_service import TaskGeneratorService

class FollowupService:
    def _call_ollama_draft(self, prompt: str) -> dict:
        """Prompts Groq to output structured JSON follow-ups."""
        from backend.services.groq_client import query_groq
        system_content = (
            "You are Beonix Followup Generator.\n"
            "Generate copy tailored to this cold lead.\n"
            "Return ONLY a valid JSON object matching this structure:\n"
            "{\n"
            '  "email_subject": "...",\n'
            '  "email_body": "...",\n'
            '  "whatsapp_body": "...",\n'
            '  "call_talking_points": ["point 1", "point 2"]\n'
            "}\n"
            "No intro/outro markdown content."
        )
        content = query_groq(
            prompt=prompt,
            system=system_content,
            json_mode=True
        )
        return json.loads(content.strip())

    def _fallback_followup(self, lead: Lead) -> dict:
        """Builds custom re-engagement drafts using local context templates."""
        company_name = lead.company or "your organization"
        
        email_subject = f"Next steps: address timeline and pricing concern points for {company_name}"
        email_body = (
            f"Hi {lead.name},\n\n"
            f"I hope you are doing well.\n\n"
            f"I'm reaching out to check in on our last conversation regarding Beonix OS. "
            f"I know your team raised questions about custom onboarding sync times. We have "
            f"formulated a fast-track implementation plan to deploy in under 2 weeks.\n\n"
            f"Would you be open to a brief 10-minute review call this week?\n\n"
            f"Best regards,\nBeonix Account Team"
        )
        whatsapp_body = (
            f"Hi {lead.name}! Checking in on the Beonix OS integration proposal. "
            f"We can schedule a technical onboarding walkthrough whenever your team is free. Let me know!"
        )
        call_talking_points = [
            f"Address deployment timelines raised for {company_name}",
            "Clarify onboarding sandbox details and technical dependencies",
            "Follow up on pending proposal review status"
        ]

        return {
            "email_subject": email_subject,
            "email_body": email_body,
            "whatsapp_body": whatsapp_body,
            "call_talking_points": call_talking_points
        }

    def generate_followup(self, lead_id: int, db: Session) -> dict:
        """Generates re-engagement drafts. Falls back if Ollama is offline."""
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return {
                "email_subject": "Reconnecting from Beonix",
                "email_body": "Hello,",
                "whatsapp_body": "Hello!",
                "call_talking_points": []
            }

        prompt = (
            f"Contact: {lead.name}\n"
            f"Company: {lead.company or 'Not provided'}\n"
            f"Objections/Scoring context: {lead.score_reasoning or 'None'}\n"
            f"Pipeline Stage: {lead.stage}\n"
            f"Generate re-engagement script drafts."
        )

        try:
            return self._call_ollama_draft(prompt)
        except Exception as err:
            print(f"Ollama re-engagement draft generation failed: {err}. Using local backup templates.")
            return self._fallback_followup(lead)

    # --- PHASE 12: DATABASE CRUD & SCHEDULING OPERATIONS ---

    def create_followup(self, lead_id: int, followup_type: str, title: str = None, description: str = None, scheduled_at: datetime = None, db: Session = None) -> FollowUp:
        """Saves a new follow-up task. Uses the Rules Engine if details are missing."""
        # Query rules fallback
        if not title or not scheduled_at:
            rule_info = TaskGeneratorService().generate_suggested_followup(lead_id, db)
            title = title or rule_info["title"]
            followup_type = followup_type or rule_info["type"]
            scheduled_at = scheduled_at or (datetime.now(timezone.utc) + timedelta(days=rule_info["scheduled_in_days"]))

        # Force timezone compliance
        if scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=timezone.utc)

        db_followup = FollowUp(
            lead_id=lead_id,
            title=title,
            description=description,
            followup_type=followup_type,
            scheduled_at=scheduled_at,
            status="scheduled"
        )
        db.add(db_followup)
        
        # Log Timeline Note
        act = Activity(
            lead_id=lead_id,
            type="System",
            content=f"Scheduled follow-up task: {title} ({followup_type.capitalize()})"
        )
        db.add(act)

        db.commit()
        db.refresh(db_followup)
        return db_followup

    def get_lead_followups(self, lead_id: int, db: Session) -> list[FollowUp]:
        """Retrieves all follow-up records scoped to a single lead."""
        return db.query(FollowUp).filter(FollowUp.lead_id == lead_id).order_by(FollowUp.scheduled_at.asc()).all()

    def get_dashboard_tasks(self, db: Session) -> dict:
        """Retrieves and groups all active follow-up tasks by calendar buckets."""
        followups = db.query(FollowUp).all()
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)

        today_list = []
        upcoming_list = []
        overdue_list = []
        completed_list = []

        for f in followups:
            # Force timezone compliance
            sched = f.scheduled_at.replace(tzinfo=timezone.utc) if f.scheduled_at.tzinfo is None else f.scheduled_at
            
            if f.status == "completed":
                completed_list.append(f)
            elif f.status == "cancelled":
                continue
            elif sched < today_start:
                overdue_list.append(f)
            elif today_start <= sched < today_end:
                today_list.append(f)
            else:
                upcoming_list.append(f)

        # Stats calculations
        pending_count = len(today_list) + len(upcoming_list)
        overdue_count = len(overdue_list)
        completed_count = len(completed_list)
        total_finished = completed_count + overdue_count
        success_rate = round((completed_count / total_finished * 100), 1) if total_finished > 0 else 100.0

        return {
            "today": today_list,
            "upcoming": upcoming_list,
            "overdue": overdue_list,
            "completed": completed_list,
            "stats": {
                "pending_count": pending_count,
                "overdue_count": overdue_count,
                "completed_count": completed_count,
                "success_rate": success_rate
            }
        }

    def reschedule_followup(self, followup_id: int, new_time: datetime, db: Session) -> FollowUp:
        """Reschedules a follow-up date and resets status attributes."""
        followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
        if not followup:
            raise ValueError(f"Follow-up ID {followup_id} not found.")

        # Force timezone compliance
        if new_time.tzinfo is None:
            new_time = new_time.replace(tzinfo=timezone.utc)

        old_time_str = followup.scheduled_at.strftime("%Y-%m-%d")
        followup.scheduled_at = new_time
        followup.status = "scheduled"

        # Log Activity Timeline
        act = Activity(
            lead_id=followup.lead_id,
            type="System",
            content=f"Rescheduled task: {followup.title} from {old_time_str} to {new_time.strftime('%Y-%m-%d')}."
        )
        db.add(act)

        db.commit()
        db.refresh(followup)
        return followup

    def cancel_followup(self, followup_id: int, db: Session) -> FollowUp:
        """Cancels a follow-up task and writes timeline log notes."""
        followup = db.query(FollowUp).filter(FollowUp.id == followup_id).first()
        if not followup:
            raise ValueError(f"Follow-up ID {followup_id} not found.")

        followup.status = "cancelled"

        # Log Activity Timeline
        act = Activity(
            lead_id=followup.lead_id,
            type="System",
            content=f"Cancelled follow-up task: {followup.title}."
        )
        db.add(act)

        db.commit()
        db.refresh(followup)
        return followup
