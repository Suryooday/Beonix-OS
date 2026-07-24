from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Dict, Any, Optional

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatSessionDetailResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    messages: List[ChatMessageResponse]

    model_config = ConfigDict(from_attributes=True)

class AskRequest(BaseModel):
    question: str

class SourceCitation(BaseModel):
    document: str
    chunk: int
    score: float

class AskResponse(BaseModel):
    answer: str
    sources: List[SourceCitation]
