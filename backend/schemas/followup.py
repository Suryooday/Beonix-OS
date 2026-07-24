from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class FollowUpBase(BaseModel):
    lead_id: int
    followup_type: str  # email, call, meeting, whatsapp, task
    title: str
    description: Optional[str] = None
    scheduled_at: datetime
    status: str = "pending"

class FollowUpCreate(BaseModel):
    lead_id: int
    followup_type: str  # email, call, meeting, whatsapp, task
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_at: Optional[datetime] = None

class FollowUpReschedule(BaseModel):
    scheduled_at: datetime

class FollowUpUpdate(BaseModel):
    status: str

class FollowUpResponse(BaseModel):
    id: int
    lead_id: int
    lead_name: str
    title: str
    description: Optional[str] = None
    followup_type: str
    scheduled_at: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FollowUpExecutionResponse(BaseModel):
    id: int
    followup_id: int
    execution_time: datetime
    execution_result: str
    created_at: datetime

    class Config:
        from_attributes = True

class FollowUpDashboardStats(BaseModel):
    pending_count: int
    overdue_count: int
    completed_count: int
    success_rate: float

class FollowUpDashboardResponse(BaseModel):
    today: List[FollowUpResponse]
    upcoming: List[FollowUpResponse]
    overdue: List[FollowUpResponse]
    completed: List[FollowUpResponse]
    stats: FollowUpDashboardStats
