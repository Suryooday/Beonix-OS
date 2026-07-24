from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class RecoveryCaseBase(BaseModel):
    lead_id: int
    risk_level: str
    reason: str
    recommended_action: Optional[str] = None
    status: str = "pending"

class RecoveryCaseCreate(RecoveryCaseBase):
    pass

class RecoveryCaseUpdate(BaseModel):
    status: str

class RecoveryCaseResponse(BaseModel):
    id: int
    lead_id: int
    lead_name: str
    risk_level: str
    reason: str
    recommended_action: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FollowupDraftResponse(BaseModel):
    email_subject: str
    email_body: str
    whatsapp_body: str
    call_talking_points: List[str]

class LeadRecoveryAnalyzeResponse(BaseModel):
    risk_level: str
    recovery_strategy: str
    recommended_actions: List[str]
