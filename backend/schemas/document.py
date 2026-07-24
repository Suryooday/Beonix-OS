from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Dict, Any

class DocumentResponse(BaseModel):
    id: int
    filename: str
    document_type: str
    file_size: int
    uploaded_at: datetime
    chunk_count: int
    processing_status: str

    model_config = ConfigDict(from_attributes=True)

class DocumentDetailResponse(BaseModel):
    document: DocumentResponse
    chunk_count: int

class DocumentUploadResponse(BaseModel):
    success: bool
    document_id: int
    chunks_created: int
    status: str
