from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json

from backend.database.session import get_db
from backend.schemas.scoring import ScoreResponse
from backend.services.scoring_service import ScoringService

router = APIRouter(prefix="/leads", tags=["Scoring"])

@router.post("/{lead_id}/score", response_model=ScoreResponse)
def score_lead_endpoint(
    lead_id: int,
    db: Session = Depends(get_db)
) -> ScoreResponse:
    """
    Triggers explainable lead scoring calculations based on conversation history,
    updates the database record, and logs a timeline event.
    """
    try:
        service = ScoringService()
        lead = service.score_lead(db, lead_id)
        
        # Parse stored reasoning JSON string back to dict
        reasoning_data = json.loads(lead.score_reasoning) if lead.score_reasoning else {}
        
        return ScoreResponse(
            lead_id=lead.id,
            score=lead.score,
            priority=lead.priority,
            reasoning=reasoning_data
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scoring failed: {str(err)}"
        )
