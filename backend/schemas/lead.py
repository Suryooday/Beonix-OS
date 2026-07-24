from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import List, Optional

# --- Activity Schemas ---

class ActivityResponse(BaseModel):
    id: int
    lead_id: int
    type: str
    content: str
    timestamp: datetime

    # Pydantic v2 configuration to allow loading from SQLAlchemy model attributes
    model_config = ConfigDict(from_attributes=True)


class TranscriptResponse(BaseModel):
    id: int
    lead_id: Optional[int]
    filename: str
    transcript_text: str
    duration_seconds: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Lead Schemas ---

class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="The name of the lead")
    email: EmailStr = Field(..., description="Lead email address")
    company: Optional[str] = Field(None, max_length=100, description="Company name associated with the lead")
    phone: Optional[str] = Field(None, description="Phone number of the lead")
    source: Optional[str] = Field("Manual", description="Source channel")
    source_platform: Optional[str] = Field(None, description="Platform source detail")
    source_campaign: Optional[str] = Field(None, description="Campaign source detail")
    score: Optional[int] = Field(0, description="Initial qualification score")


class LeadUpdateStage(BaseModel):
    stage: str = Field(..., min_length=1, description="New lifecycle stage for the lead")


class LeadResponse(BaseModel):
    id: int
    name: str
    email: str
    company: Optional[str] = None
    phone: Optional[str] = None
    source: str = "Manual"
    source_platform: Optional[str] = None
    source_campaign: Optional[str] = None
    imported_at: Optional[datetime] = None
    stage: str
    score: int
    priority: str = "Low"
    score_reasoning: Optional[str] = None
    manual_review: Optional[str] = None
    talking_points: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadDetailResponse(LeadResponse):
    # Includes all fields from LeadResponse plus the associated activities and transcripts
    activities: List[ActivityResponse] = []
    transcripts: List[TranscriptResponse] = []

    model_config = ConfigDict(from_attributes=True)


class LeadPrepRequest(BaseModel):
    manual_review: str
