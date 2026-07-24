import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from backend.database.session import get_db
from backend.services.transcription_service import TranscriptionService
from backend.services.extraction_service import ExtractionService
from backend.services.scoring_service import ScoringService
from backend.services import lead_service
from backend.services.lead_service import create_activity

router = APIRouter(prefix="/ingest", tags=["Audio Ingestion"])
UPLOAD_DIR = "beonix_data/uploads"

@router.post("/call")
async def ingest_call_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Asynchronously uploads an audio recording, runs transcription,
    saves logs, extracts lead metrics, upserts the lead, and scores it.
    """
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    trans_service = TranscriptionService()
    try:
        trans_service.validate_audio_file(file.filename or "", file_size)
        file_path = os.path.join(UPLOAD_DIR, file.filename or "call.mp3")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        trans_result = trans_service.transcribe_audio(file_path)
        text, duration = trans_result["transcript"], trans_result["duration"]
        db_trans = trans_service.save_transcript(db, file.filename or "", text, duration)
        
        extractor = ExtractionService()
        ext_data = extractor.extract_lead_data(text)
        if not ext_data.email:
            raise ValueError("Could not extract email address from transcript text.")
            
        lead, created = lead_service.upsert_lead_from_extraction(db, ext_data)
        db_trans.lead_id = lead.id
        db.add(db_trans)
        
        # Log timeline activities sequentially
        create_activity(db, lead.id, "System", f"Audio uploaded: {file.filename}")
        create_activity(db, lead.id, "System", f"Transcript generated ({duration}s duration)")
        create_activity(db, lead.id, "System", f"Lead extracted: {ext_data.name} ({ext_data.company})")
        create_activity(db, lead.id, "System", f"Lead {'created' if created else 'updated'} via Audio Pipeline")
        
        scorer = ScoringService()
        scorer.score_lead(db, lead.id)
        return {
            "success": True,
            "lead_id": lead.id,
            "transcript_id": db_trans.id,
            "lead_score": lead.score
        }
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(err))
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Audio ingestion failed: {err}")
