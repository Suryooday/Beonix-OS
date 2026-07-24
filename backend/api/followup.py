from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.session import get_db
from backend.services.followup_service import FollowupService
from backend.services.execution_service import ExecutionService
from backend.schemas.followup import (
    FollowUpCreate,
    FollowUpReschedule,
    FollowUpResponse,
    FollowUpDashboardResponse
)

router = APIRouter(prefix="/followups", tags=["Lead Follow-Up Engine"])

@router.post("/create", response_model=dict)
def create_followup_endpoint(request: FollowUpCreate, db: Session = Depends(get_db)):
    """Saves and schedules a new follow-up re-engagement task."""
    service = FollowupService()
    followup = service.create_followup(
        lead_id=request.lead_id,
        followup_type=request.followup_type,
        title=request.title,
        description=request.description,
        scheduled_at=request.scheduled_at,
        db=db
    )
    return {"followup_id": followup.id, "status": followup.status}

@router.get("/dashboard", response_model=FollowUpDashboardResponse)
def get_dashboard_followups_endpoint(db: Session = Depends(get_db)):
    """Retrieves and groups all active follow-up tasks by calendar buckets."""
    service = FollowupService()
    result = service.get_dashboard_tasks(db)
    
    def map_resp(lst):
        from backend.models.lead import Lead
        res = []
        for item in lst:
            lead = db.query(Lead).filter(Lead.id == item.lead_id).first()
            res.append(FollowUpResponse(
                id=item.id,
                lead_id=item.lead_id,
                lead_name=lead.name if lead else "Unknown Opportunity",
                title=item.title,
                description=item.description,
                followup_type=item.followup_type,
                scheduled_at=item.scheduled_at,
                status=item.status,
                created_at=item.created_at
            ))
        return res

    return FollowUpDashboardResponse(
        today=map_resp(result["today"]),
        upcoming=map_resp(result["upcoming"]),
        overdue=map_resp(result["overdue"]),
        completed=map_resp(result["completed"]),
        stats=result["stats"]
    )

@router.get("/lead/{lead_id}", response_model=List[FollowUpResponse])
def get_lead_followups_endpoint(lead_id: int, db: Session = Depends(get_db)):
    """Retrieves all follow-up records scheduled for a single lead."""
    service = FollowupService()
    items = service.get_lead_followups(lead_id, db)
    from backend.models.lead import Lead
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    lead_name = lead.name if lead else "Unknown"
    return [
        FollowUpResponse(
            id=i.id,
            lead_id=i.lead_id,
            lead_name=lead_name,
            title=i.title,
            description=i.description,
            followup_type=i.followup_type,
            scheduled_at=i.scheduled_at,
            status=i.status,
            created_at=i.created_at
        ) for i in items
    ]

@router.post("/{followup_id}/execute", response_model=dict)
def execute_followup_endpoint(followup_id: int, db: Session = Depends(get_db)):
    """Executes a follow-up task and logs execution outcome."""
    try:
        ExecutionService.execute_followup(followup_id, db)
        return {"success": True, "message": f"Follow-up task {followup_id} executed."}
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )

@router.post("/{followup_id}/reschedule", response_model=dict)
def reschedule_followup_endpoint(followup_id: int, request: FollowUpReschedule, db: Session = Depends(get_db)):
    """Reschedules a follow-up task to a new due date."""
    service = FollowupService()
    try:
        service.reschedule_followup(followup_id, request.scheduled_at, db)
        return {"success": True, "message": f"Follow-up task {followup_id} rescheduled."}
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )

@router.post("/{followup_id}/cancel", response_model=dict)
def cancel_followup_endpoint(followup_id: int, db: Session = Depends(get_db)):
    """Cancels a scheduled follow-up task."""
    service = FollowupService()
    try:
        service.cancel_followup(followup_id, db)
        return {"success": True, "message": f"Follow-up task {followup_id} cancelled."}
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
