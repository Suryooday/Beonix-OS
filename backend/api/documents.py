import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.session import get_db
from backend.models.document import Document
from backend.schemas.document import DocumentResponse, DocumentDetailResponse, DocumentUploadResponse
from backend.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["Documents Ingestion"])
UPLOAD_DIR = "beonix_data/uploads"

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads a document file, parses it, chunks it, and indexes the chunks in ChromaDB."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename or "doc.txt")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        service = DocumentService()
        doc = service.ingest_document(db, file_path, file.filename or "")
        return DocumentUploadResponse(
            success=True,
            document_id=doc.id,
            chunks_created=doc.chunk_count,
            status=doc.processing_status
        )
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Document upload and indexing failed: {err}"
        )

@router.get("", response_model=List[DocumentResponse])
def list_documents_endpoint(db: Session = Depends(get_db)):
    """Lists all processed documents with metadata and status."""
    return db.query(Document).all()

@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_details_endpoint(document_id: int, db: Session = Depends(get_db)):
    """Fetches details of a single document including chunk counts."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return DocumentDetailResponse(document=doc, chunk_count=doc.chunk_count)
