from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from backend.database.session import get_db
from backend.services.lead_chat_service import LeadChatService
from backend.schemas.chat import AskRequest

router = APIRouter(prefix="/leads", tags=["Lead Memory Assistant"])

class SourceItem(BaseModel):
    type: str
    date: str

class LeadAskResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    recommended_actions: List[str]

class LeadInsightsResponse(BaseModel):
    decision_maker: str
    key_objections: List[str]
    sentiment: str
    last_contact: str
    next_steps: List[str]
    risk_level: str
    confidence_score: int

@router.post("/{lead_id}/ask", response_model=LeadAskResponse)
def ask_lead_endpoint(lead_id: int, request: AskRequest, db: Session = Depends(get_db)):
    """Queries memory logs and call recordings specific to a single customer lead."""
    service = LeadChatService()
    result = service.ask_lead_question(lead_id, request.question, db)
    return LeadAskResponse(
        answer=result["answer"],
        sources=[SourceItem(type=s["type"], date=s["date"]) for s in result["sources"]],
        recommended_actions=result["recommended_actions"]
    )

@router.get("/{lead_id}/insights", response_model=LeadInsightsResponse)
def get_lead_insights_endpoint(lead_id: int, db: Session = Depends(get_db)):
    """Retrieves computed profile summaries, objections, and sentiment insights for a lead."""
    service = LeadChatService()
    result = service.get_lead_insights(lead_id, db)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with ID {lead_id} not found."
        )
    return LeadInsightsResponse(**result)
