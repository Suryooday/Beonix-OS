from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid
from typing import List, Dict, Any

from backend.database.session import get_db
from backend.models.import_job import ImportJob
from backend.services.file_import_service import FileImportService
from backend.services.mapping_service import MappingService
from backend.services.lead_import_service import LeadImportService
from backend.schemas.import_job import (
    ImportJobResponse,
    ImportPreviewResponse,
    ImportProcessRequest,
    ImportSummaryResponse
)

router = APIRouter(prefix="/imports", tags=["Bulk Lead Import"])

# Ensure temp directory exists inside workspace
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", response_model=ImportPreviewResponse)
def upload_import_file_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Uploads a spreadsheet, parses columns, and returns a suggested field mapping preview."""
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".csv", ".xlsx", ".xls"]:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload .csv, .xlsx, or .xls files.")

    # Save to unique temp file
    temp_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, temp_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # Create job tracker record
    job = ImportJob(filename=temp_filename, status="processing")
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        columns, rows = FileImportService.parse_spreadsheet(file_path)
    except Exception as err:
        job.status = "failed"
        db.commit()
        # Clean up corrupted file
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Failed to parse spreadsheet: {str(err)}")

    suggested = MappingService.suggest_mapping(columns)
    preview_rows = rows[:5]

    return ImportPreviewResponse(
        job_id=job.id,
        columns=columns,
        suggested_mapping=suggested,
        sample_rows=preview_rows
    )

@router.post("/process", response_model=ImportSummaryResponse)
def execute_import_endpoint(request: ImportProcessRequest, db: Session = Depends(get_db)):
    """Runs the lead import pipeline mapping columns and auditing duplicates."""
    job = db.query(ImportJob).filter(ImportJob.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")

    file_path = os.path.join(UPLOAD_DIR, job.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Uploaded file has expired or is missing.")

    try:
        columns, rows = FileImportService.parse_spreadsheet(file_path)
        summary_job = LeadImportService.import_rows(
            job_id=job.id,
            rows=rows,
            field_mapping=request.field_mapping,
            dup_action=request.dup_action,
            db=db
        )
        
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)

        # Retain name prefix for reports history rather than raw UUID
        job.filename = f"Import #{job.id} (Completed)"
        db.commit()

        return ImportSummaryResponse(
            job_id=summary_job.id,
            total_rows=summary_job.total_rows,
            imported_rows=summary_job.imported_rows,
            duplicate_rows=summary_job.duplicate_rows,
            failed_rows=summary_job.failed_rows,
            status=summary_job.status
        )
    except Exception as err:
        job.status = "failed"
        db.commit()
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=400, detail=str(err))

@router.get("", response_model=List[ImportJobResponse])
def get_import_history_endpoint(db: Session = Depends(get_db)):
    """Lists historical lead import jobs."""
    return db.query(ImportJob).order_by(ImportJob.created_at.desc()).all()

@router.get("/{job_id}", response_model=ImportJobResponse)
def get_import_details_endpoint(job_id: int, db: Session = Depends(get_db)):
    """Retrieves progress stats for a specific import job."""
    job = db.query(ImportJob).filter(ImportJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Import job not found")
    return job
