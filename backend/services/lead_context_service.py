from sqlalchemy.orm import Session
from backend.models.lead import Lead

class LeadContextService:
    @staticmethod
    def compile_lead_profile(lead_id: int, db: Session) -> str:
        """Compiles lead profile attributes into a structured string context for prompt models."""
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return "Lead Profile: Data unavailable."

        profile_text = (
            f"Lead Attributes:\n"
            f"- Name: {lead.name}\n"
            f"- Email: {lead.email}\n"
            f"- Company: {lead.company or 'Not provided'}\n"
            f"- Current Pipeline Stage: {lead.stage}\n"
            f"- Scoring Metric: {lead.score}/100\n"
            f"- Priority Designation: {lead.priority or 'Low'}\n"
            f"- Scoring Rationale: {lead.score_reasoning or 'Uncalculated'}\n"
        )
        return profile_text
