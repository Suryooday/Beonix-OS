from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.session import get_db
from backend.services.recovery_service import RecoveryService
from backend.services.followup_service import FollowupService
from backend.schemas.recovery import (
    RecoveryCaseResponse,
    LeadRecoveryAnalyzeResponse,
    FollowupDraftResponse,
    RecoveryCaseUpdate
)

router = APIRouter(prefix="/recovery", tags=["Lead Recovery AI"])

@router.get("", response_model=List[RecoveryCaseResponse])
def get_recovery_queue_endpoint(db: Session = Depends(get_db)):
    """Retrieves all pending CRM recovery case records."""
    service = RecoveryService()
    return service.get_recovery_queue(db)

@router.post("/{lead_id}/analyze", response_model=LeadRecoveryAnalyzeResponse)
def analyze_lead_endpoint(lead_id: int, db: Session = Depends(get_db)):
    """Executes live AI risk scans and recovery next steps for a single lead."""
    service = RecoveryService()
    result = service.analyze_single_lead(lead_id, db)
    return LeadRecoveryAnalyzeResponse(
        risk_level=result["risk_level"],
        recovery_strategy=result["recovery_strategy"],
        recommended_actions=result["recommended_actions"]
    )

@router.post("/{case_id}/resolve", response_model=RecoveryCaseResponse)
def resolve_case_endpoint(case_id: int, request: RecoveryCaseUpdate, db: Session = Depends(get_db)):
    """Resolves a pending recovery case (reviewed, executed, dismissed)."""
    service = RecoveryService()
    try:
        case = service.resolve_case(case_id, request.status, db)
        from backend.models.lead import Lead
        lead = db.query(Lead).filter(Lead.id == case.lead_id).first()
        return RecoveryCaseResponse(
            id=case.id,
            lead_id=case.lead_id,
            lead_name=lead.name if lead else "Unknown Opportunity",
            risk_level=case.risk_level,
            reason=case.reason,
            recommended_action=case.recommended_action,
            status=case.status,
            created_at=case.created_at
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )

@router.get("/{lead_id}/followup", response_model=FollowupDraftResponse)
def get_followup_drafts_endpoint(lead_id: int, db: Session = Depends(get_db)):
    """Generates tailored re-engagement copy drafts (Email, WhatsApp, Call notes) for follow-ups."""
    service = FollowupService()
    result = service.generate_followup(lead_id, db)
    return FollowupDraftResponse(**result)
