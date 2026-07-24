from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from backend.models.compliance import ComplianceRequirement, ComplianceDocument, ComplianceRisk
from backend.schemas.compliance import ComplianceRequirementCreate

class ComplianceService:
    @staticmethod
    def create_requirement(data: ComplianceRequirementCreate, db: Session) -> ComplianceRequirement:
        """Saves a new compliance requirement deadline details."""
        db_req = ComplianceRequirement(
            title=data.title,
            category=data.category,
            due_date=data.due_date,
            owner=data.owner,
            status=data.status or "pending"
        )
        db.add(db_req)
        db.commit()
        db.refresh(db_req)
        return db_req

    @staticmethod
    def list_requirements(db: Session) -> List[ComplianceRequirement]:
        """Lists all compliance requirements."""
        return db.query(ComplianceRequirement).order_by(ComplianceRequirement.due_date.asc()).all()

    @staticmethod
    def update_status(req_id: int, status: str, db: Session) -> ComplianceRequirement:
        """Updates status of a requirement (compliant, overdue, pending)."""
        req = db.query(ComplianceRequirement).filter(ComplianceRequirement.id == req_id).first()
        if not req:
            raise ValueError(f"Requirement ID {req_id} not found.")
        req.status = status
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def get_dashboard_data(db: Session) -> dict:
        """Compiles stats and trends for the compliance dashboard."""
        reqs = db.query(ComplianceRequirement).all()
        docs = db.query(ComplianceDocument).all()
        risks = db.query(ComplianceRisk).all()

        now = datetime.now(timezone.utc)
        upcoming = 0
        overdue = 0
        at_risk = 0

        for r in reqs:
            due = r.due_date.replace(tzinfo=timezone.utc) if r.due_date.tzinfo is None else r.due_date
            if r.status == "overdue" or (r.status == "pending" and due < now):
                overdue += 1
            elif r.status == "at_risk":
                at_risk += 1
            elif r.status == "pending" and due > now and due <= now + timedelta(days=7):
                upcoming += 1

        total = len(reqs)
        compliant_count = sum(1 for r in reqs if r.status == "compliant")
        score = int(round((compliant_count / total) * 100)) if total > 0 else 100

        return {
            "stats": {
                "upcoming_deadlines": upcoming,
                "overdue_items": overdue,
                "risk_alerts": len(risks) + at_risk,
                "compliance_score": score
            },
            "requirements": reqs,
            "risks": risks,
            "documents": docs
        }
