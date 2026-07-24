from sqlalchemy.orm import Session
from backend.models.compliance import ComplianceDocument

class DocumentVerificationService:
    @staticmethod
    def upload_document(requirement_id: int, filename: str, db: Session) -> ComplianceDocument:
        """Logs a new compliance document upload request."""
        db_doc = ComplianceDocument(
            requirement_id=requirement_id,
            filename=filename,
            verification_status="pending"
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    @staticmethod
    def verify_document(document_id: int, status: str, db: Session) -> ComplianceDocument:
        """Verifies or rejects a compliance document submission."""
        doc = db.query(ComplianceDocument).filter(ComplianceDocument.id == document_id).first()
        if not doc:
            raise ValueError(f"Document ID {document_id} not found.")
        doc.verification_status = status
        db.commit()
        db.refresh(doc)
        return doc
