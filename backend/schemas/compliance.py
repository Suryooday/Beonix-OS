from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class ComplianceRequirementCreate(BaseModel):
    title: str
    category: str
    due_date: datetime
    owner: str
    status: Optional[str] = "pending"

class ComplianceRequirementUpdate(BaseModel):
    status: str

class ComplianceRequirementResponse(BaseModel):
    id: int
    title: str
    category: str
    due_date: datetime
    status: str
    owner: str
    created_at: datetime

    class Config:
        from_attributes = True

class ComplianceDocumentCreate(BaseModel):
    requirement_id: int
    filename: str

class ComplianceDocumentResponse(BaseModel):
    id: int
    requirement_id: int
    filename: str
    upload_date: datetime
    verification_status: str

    class Config:
        from_attributes = True

class ComplianceRiskResponse(BaseModel):
    id: int
    requirement_id: int
    severity: str
    description: str
    recommendation: str

    class Config:
        from_attributes = True

class ComplianceCalendarItem(BaseModel):
    id: int
    title: str
    due_date: datetime
    category: str
    status: str

class ComplianceDashboardStats(BaseModel):
    upcoming_deadlines: int
    overdue_items: int
    risk_alerts: int
    compliance_score: int

class ComplianceDashboardResponse(BaseModel):
    stats: ComplianceDashboardStats
    requirements: List[ComplianceRequirementResponse]
    risks: List[ComplianceRiskResponse]
    documents: List[ComplianceDocumentResponse]
