from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.schemas.ingest import IngestRequest, IngestResponse
from backend.services.extraction_service import ExtractionService
from backend.services.activity_service import create_ingestion_activity
from backend.services import lead_service

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

@router.post("/text", response_model=IngestResponse)
def ingest_text_endpoint(
    request: IngestRequest,
    db: Session = Depends(get_db)
) -> IngestResponse:
    """
    Ingest raw text communication, extract structured lead info using AI,
    and automatically create or update the lead with timeline events.
    """
    try:
        extractor = ExtractionService()
        extracted_data = extractor.extract_lead_data(request.content)
        
        # We need a valid email to uniquely identify and upsert the lead
        if not extracted_data.email:
            raise ValueError("Structured extraction succeeded but could not identify a valid email address.")
            
        lead, created = lead_service.upsert_lead_from_extraction(db, data=extracted_data)
        
        # Automatically log timeline activity for this lead
        create_ingestion_activity(db, lead_id=lead.id, summary=extracted_data.summary or "")
        
        return IngestResponse(
            success=True,
            lead_id=lead.id,
            created=created,
            extracted_data=extracted_data
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err)
        )
