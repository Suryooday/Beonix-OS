from datetime import datetime
from pydantic import BaseModel, ConfigDict
from typing import Optional, List

class EmailGenerateRequest(BaseModel):
    lead_id: int

class EmailSimulateReplyRequest(BaseModel):
    sentiment: str  # 'positive', 'neutral', 'negative'
    reply_text: Optional[str] = None

class AttachmentResponse(BaseModel):
    id: int
    filename: str
    content_type: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OutreachMessageResponse(BaseModel):
    id: int
    sender: str
    subject: str
    body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class EmailResponse(BaseModel):
    id: int
    lead_id: int
    lead_name: Optional[str] = None
    lead_email: Optional[str] = None
    subject: str
    body: str
    status: str
    response_received: Optional[str] = None
    response_sentiment: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    messages: List[OutreachMessageResponse] = []
    attachments: List[AttachmentResponse] = []

    model_config = ConfigDict(from_attributes=True)

class EmailUpdateRequest(BaseModel):
    subject: str
    body: str

class EmailRefineRequest(BaseModel):
    prompt: str

class GmailStatusResponse(BaseModel):
    connected: bool
    email: Optional[str] = None
    client_id_configured: bool

class GmailConfigRequest(BaseModel):
    client_id: str
    client_secret: str

class GmailConfigResponse(BaseModel):
    success: bool
