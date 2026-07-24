from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.services.followup_service import FollowupService
from backend.models.lead import Lead
from backend.models.recovery import RecoveryCase
from backend.models.activity import Activity

class ActionService:
    @staticmethod
    def execute_action(action_type: str, context: Dict[str, Any], config: Dict[str, Any], db: Session) -> dict:
        """Executes a workflow action node against the database."""
        lead_id = context.get("lead_id")
        if not lead_id:
            return {"success": False, "error": "Missing lead_id in execution context."}

        if action_type == "Create Follow-Up":
            service = FollowupService()
            ftype = config.get("type", "email")
            title = config.get("title", "Workflow Automated Task")
            service.create_followup(
                lead_id=lead_id,
                followup_type=ftype,
                title=title,
                db=db
            )
            return {"success": True, "info": f"Created followup: {title}"}

        if action_type == "Create Recovery Case":
            risk = context.get("lead_risk", "medium")
            reason = config.get("reason", "Automated recovery trigger.")
            db_case = RecoveryCase(
                lead_id=lead_id,
                risk_level=risk,
                reason=reason,
                recommended_action="Execute re-engagement sequence.",
                status="pending"
            )
            db.add(db_case)
            db.commit()
            return {"success": True, "info": "Created recovery case."}

        if action_type == "Send Notification":
            msg = config.get("message", "Workflow alert notification.")
            act = Activity(
                lead_id=lead_id,
                type="System",
                content=f"Notification: {msg}"
            )
            db.add(act)
            db.commit()
            return {"success": True, "info": f"Notified sales: {msg}"}

        if action_type == "Update Stage":
            stage = config.get("stage", "Contacted")
            lead = db.query(Lead).filter(Lead.id == lead_id).first()
            if lead:
                old_stage = lead.stage
                lead.stage = stage
                act = Activity(
                    lead_id=lead_id,
                    type="Stage Change",
                    content=f"Automated workflow stage transition from {old_stage} to {stage}."
                )
                db.add(act)
                db.commit()
                return {"success": True, "info": f"Moved lead to stage: {stage}"}

        return {"success": True, "info": "Executed default no-op action."}
