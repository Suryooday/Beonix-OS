from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class ImportJobResponse(BaseModel):
    id: int
    filename: str
    total_rows: int
    imported_rows: int
    duplicate_rows: int
    failed_rows: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ImportPreviewResponse(BaseModel):
    job_id: int
    columns: List[str]
    suggested_mapping: Dict[str, str]
    sample_rows: List[Dict[str, Any]]

class ImportProcessRequest(BaseModel):
    job_id: int
    field_mapping: Dict[str, str]  # Matches raw headers -> CRM attributes (name, email, phone, company)
    dup_action: str  # skip, update, create

class ImportSummaryResponse(BaseModel):
    job_id: int
    total_rows: int
    imported_rows: int
    duplicate_rows: int
    failed_rows: int
    status: str
