from sqlalchemy.orm import Session
from typing import List, Optional
from backend.models.capital import ApprovalRequest
from backend.schemas.capital import ApprovalRequestCreate

class ApprovalService:
    @staticmethod
    def create_approval(data: ApprovalRequestCreate, db: Session) -> ApprovalRequest:
        """Saves a new approval request (payroll, expenses, purchases)."""
        db_approval = ApprovalRequest(
            title=data.title,
            requester=data.requester,
            approver=data.approver,
            status=data.status or "pending"
        )
        db.add(db_approval)
        db.commit()
        db.refresh(db_approval)
        return db_approval

    @staticmethod
    def update_approval_status(approval_id: int, status: str, db: Session) -> ApprovalRequest:
        """Updates the status of an approval request (approved, rejected)."""
        req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_id).first()
        if not req:
            raise ValueError(f"Approval Request {approval_id} not found.")
        req.status = status
        db.commit()
        db.refresh(req)
        return req

    @staticmethod
    def list_approvals(db: Session) -> List[ApprovalRequest]:
        """Lists all approval requests."""
        return db.query(ApprovalRequest).order_by(ApprovalRequest.created_at.desc()).all()
