from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.models.lead import Lead
from backend.models.activity import Activity
from backend.schemas.lead import LeadCreate
from backend.schemas.ingest import ExtractedLeadData

def get_leads(db: Session, skip: int = 0, limit: int = 100) -> List[Lead]:
    """
    Retrieve a list of leads from the database with pagination.
    """
    return db.query(Lead).offset(skip).limit(limit).all()

def get_lead_by_id(db: Session, lead_id: int) -> Optional[Lead]:
    """
    Retrieve a single lead by its ID.
    """
    return db.query(Lead).filter(Lead.id == lead_id).first()

def create_lead(db: Session, lead_schema: LeadCreate) -> Lead:
    """
    Create a new lead and automatically record a system activity for lead creation.
    """
    # Create the Lead model instance from schema data
    db_lead = Lead(
        name=lead_schema.name,
        email=str(lead_schema.email),
        company=lead_schema.company,
        score=lead_schema.score if lead_schema.score is not None else 0,
        stage="New"  # Default initial stage
    )
    
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)

    # Automatically log a system activity recording the creation of this lead
    create_activity(
        db=db,
        lead_id=db_lead.id,
        activity_type="System",
        content=f"Lead created with status 'New' and score {db_lead.score}."
    )

    return db_lead

def update_lead_stage(db: Session, lead_id: int, new_stage: str) -> Optional[Lead]:
    """
    Update a lead's stage and record a stage change activity.
    """
    db_lead = get_lead_by_id(db, lead_id)
    if not db_lead:
        return None

    old_stage = db_lead.stage
    db_lead.stage = new_stage
    db.add(db_lead)
    
    # Log the activity tracking this stage transition
    create_activity(
        db=db,
        lead_id=lead_id,
        activity_type="Stage Change",
        content=f"Lead stage transitioned from '{old_stage}' to '{new_stage}'."
    )
    
    db.commit()
    db.refresh(db_lead)
    
    return db_lead

def create_activity(db: Session, lead_id: int, activity_type: str, content: str) -> Activity:
    """
    Create an activity record linked to a specific lead.
    """
    db_activity = Activity(
        lead_id=lead_id,
        type=activity_type,
        content=content
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def get_lead_by_email(db: Session, email: str) -> Optional[Lead]:
    """
    Retrieve a single lead by their email address.
    """
    return db.query(Lead).filter(Lead.email == email).first()

def _update_lead_fields(lead: Lead, data: ExtractedLeadData) -> None:
    """
    Updates lead fields with extracted values if they are not null.
    """
    if data.name:
        lead.name = data.name
    if data.company:
        lead.company = data.company

def upsert_lead_from_extraction(db: Session, data: ExtractedLeadData) -> Tuple[Lead, bool]:
    """
    Look up lead by email. If exists, update name and company.
    If not, create a new lead with stage 'New' and score 0.
    Returns a tuple: (Lead, created: bool)
    """
    if not data.email:
        raise ValueError("Cannot upsert lead: extracted email is null.")
        
    db_lead = get_lead_by_email(db, data.email)
    if db_lead:
        _update_lead_fields(db_lead, data)
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        return db_lead, False

    # Create new lead
    new_lead = Lead(
        name=data.name or "Unknown Lead",
        email=data.email,
        company=data.company,
        stage="New",
        score=0
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead, True
