from sqlalchemy.orm import Session
from typing import Optional
from backend.models.lead import Lead

class DuplicateService:
    @staticmethod
    def detect_duplicate(email: str, phone: str, company: str, db: Session) -> Optional[Lead]:
        """Identifies pre-existing leads by checking email, phone, or email + company."""
        if email:
            lead = db.query(Lead).filter(Lead.email == email).first()
            if lead:
                return lead

        if phone:
            lead = db.query(Lead).filter(Lead.phone == phone).first()
            if lead:
                return lead

        if email and company:
            lead = db.query(Lead).filter(Lead.email == email, Lead.company == company).first()
            if lead:
                return lead

        return None
