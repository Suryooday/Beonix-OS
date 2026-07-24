from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.database.session import get_db
from backend.services import lead_service
from backend.schemas.lead import LeadCreate, LeadDetailResponse, LeadResponse, LeadUpdateStage, LeadPrepRequest
from backend.models.lead import Lead
from backend.models.activity import Activity
from backend.services.groq_client import query_groq
import json
import re

router = APIRouter(prefix="/leads", tags=["Leads"])

@router.get("", response_model=List[LeadResponse])
def read_leads(
    skip: int = Query(0, ge=0, description="Number of leads to skip"),
    limit: int = Query(100, ge=1, le=100, description="Max number of leads to return"),
    db: Session = Depends(get_db)
) -> List[LeadResponse]:
    """
    Retrieve a paginated list of leads.
    """
    return lead_service.get_leads(db, skip=skip, limit=limit)

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
def create_new_lead(
    lead_in: LeadCreate,
    db: Session = Depends(get_db)
) -> LeadResponse:
    """
    Create a new lead and log its initial creation activity.
    """
    return lead_service.create_lead(db, lead_schema=lead_in)

@router.get("/{lead_id}", response_model=LeadDetailResponse)
def read_lead(
    lead_id: int,
    db: Session = Depends(get_db)
) -> LeadDetailResponse:
    """
    Retrieve a detailed view of a lead, including all logged activities.
    """
    db_lead = lead_service.get_lead_by_id(db, lead_id=lead_id)
    if not db_lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with ID {lead_id} not found."
        )
    return db_lead

@router.patch("/{lead_id}/stage", response_model=LeadResponse)
def update_lead_stage_endpoint(
    lead_id: int,
    stage_in: LeadUpdateStage,
    db: Session = Depends(get_db)
) -> LeadResponse:
    """
    Update the stage of a lead and log the transition activity.
    """
    updated_lead = lead_service.update_lead_stage(
        db, lead_id=lead_id, new_stage=stage_in.stage
    )
    if not updated_lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lead with ID {lead_id} not found."
        )
    return updated_lead

@router.post("/{lead_id}/prep", response_model=LeadResponse)
def generate_lead_prep_endpoint(
    lead_id: int,
    prep_in: LeadPrepRequest,
    db: Session = Depends(get_db)
) -> LeadResponse:
    """
    Submits a manual review and calls Groq to formulate talking topics checklist for this lead.
    """
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    db_lead.manual_review = prep_in.manual_review

    # Query Groq to formulate 3 clear topics/talking points
    history_elements = [f"[{a.type}]: {a.content}" for a in db_lead.activities]
    history_text = "\n".join(history_elements) or f"Lead created: {db_lead.name}."

    system_prompt = """You are an expert sales strategist. Based on the lead's history and the sales representative's manual review notes, formulate exactly 3 clear, highly-actionable, specific talking points/topics to address during the next conversation.
Return a raw JSON array of strings containing exactly 3 elements. Example:
[
  "Discuss pricing concerns: address the 15% budget gap by suggesting modular package choices",
  "Demo timeline details: walkthrough the 3-week fast-track onboarding phase",
  "Validate custom API specifications: offer helper dev documents"
]
Do not include markdown blocks or conversational fillers."""

    user_prompt = f"Lead Name: {db_lead.name}\nCompany: {db_lead.company}\nLead History:\n{history_text}\n\nSales Rep Notes/Review:\n{prep_in.manual_review}"

    try:
        raw_output = query_groq(prompt=user_prompt, system=system_prompt, json_mode=True)
        cleaned = raw_output.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE).strip()
        first_bracket = cleaned.find("[")
        last_bracket = cleaned.rfind("]")
        if first_bracket != -1 and last_bracket != -1:
            cleaned = cleaned[first_bracket:last_bracket + 1]
            
        topics = json.loads(cleaned)
        if isinstance(topics, list):
            db_lead.talking_points = json.dumps(topics[:3])
        else:
            db_lead.talking_points = json.dumps([
                f"Address primary objections listed in notes: {prep_in.manual_review[:60]}",
                "Walkthrough proposal terms and implementation schedules",
                "Answer technical custom integration questions"
            ])
    except Exception as e:
        print(f"Failed to generate talking points via Groq: {e}")
        db_lead.talking_points = json.dumps([
            f"Discuss notes details: {prep_in.manual_review[:60]}",
            "Present fast-track onboarding timelines",
            "Verify pricing structures and budget parameters"
        ])

    act = Activity(
        lead_id=lead_id,
        type="System",
        content="Lead manual review and talking topics prep updated."
    )
    db.add(act)
    db.commit()
    db.refresh(db_lead)
    return db_lead
