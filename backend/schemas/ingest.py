from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional

class IngestRequest(BaseModel):
    content: str = Field(..., min_length=1, description="Raw communication text (email, chat, notes) to ingest.")

class ExtractedLeadData(BaseModel):
    name: Optional[str] = Field(None, description="Extracted lead's full name.")
    email: Optional[EmailStr] = Field(None, description="Extracted email address.")
    company: Optional[str] = Field(None, description="Extracted company name.")
    intent: Optional[str] = Field(None, description="Inferred purpose of the contact.")
    summary: Optional[str] = Field(None, description="Brief summary of text context under 100 words.")
    objections: List[str] = Field(default_factory=list, description="Array of objections raised by the lead.")
    next_steps: List[str] = Field(default_factory=list, description="Array of recommended follow-up actions.")

class IngestResponse(BaseModel):
    success: bool = Field(..., description="Indicates if lead extraction was successful.")
    lead_id: Optional[int] = Field(None, description="Database ID of the created or updated lead.")
    created: bool = Field(..., description="True if a new lead was created, False if an existing lead was updated.")
    extracted_data: ExtractedLeadData = Field(..., description="The structured metrics parsed by the LLM.")
