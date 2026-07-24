from sqlalchemy.orm import Session
from backend.models.lead import Lead
from backend.models.activity import Activity

class TaskGeneratorService:
    def generate_suggested_followup(self, lead_id: int, db: Session) -> dict:
        """Evaluates pipeline rules to generate optimal follow-up titles, channels, and day offsets."""
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return {"title": "Follow up task", "type": "task", "scheduled_in_days": 3}

        # 1. Missed meetings trigger
        activities = db.query(Activity).filter(Activity.lead_id == lead_id).all()
        has_missed_meeting = any(
            "missed" in act.content.lower() and ("meeting" in act.content.lower() or "call" in act.content.lower())
            for act in activities
        )

        # 2. High-risk recovery trigger
        from backend.models.recovery import RecoveryCase
        has_high_risk = db.query(RecoveryCase).filter(
            RecoveryCase.lead_id == lead_id,
            RecoveryCase.risk_level == "high",
            RecoveryCase.status == "pending"
        ).first()

        if has_missed_meeting:
            return {
                "title": "Schedule reschedule request for missed call",
                "type": "email",
                "scheduled_in_days": 1
            }
        if has_high_risk:
            return {
                "title": "Urgent recovery call to address pricing concerns",
                "type": "call",
                "scheduled_in_days": 2
            }
        if lead.stage == "New":
            return {
                "title": "Schedule introductory discovery call",
                "type": "call",
                "scheduled_in_days": 1
            }
        if lead.stage == "Proposal":
            return {
                "title": "Follow up on proposal review status",
                "type": "email",
                "scheduled_in_days": 5
            }
            
        return {
            "title": f"Follow up touchpoint check",
            "type": "whatsapp",
            "scheduled_in_days": 3
        }
