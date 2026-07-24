from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.database.session import get_db
from backend.services.compliance_service import ComplianceService
from backend.services.risk_service import RiskService
from backend.services.document_verification_service import DocumentVerificationService
from backend.models.compliance import ComplianceRisk, ComplianceDocument
from backend.schemas.compliance import (
    ComplianceRequirementCreate,
    ComplianceRequirementUpdate,
    ComplianceRequirementResponse,
    ComplianceDocumentCreate,
    ComplianceDocumentResponse,
    ComplianceRiskResponse,
    ComplianceDashboardResponse
)

router = APIRouter(prefix="/compliance", tags=["Compliance Operations"])

@router.post("", response_model=ComplianceRequirementResponse)
def create_requirement_endpoint(request: ComplianceRequirementCreate, db: Session = Depends(get_db)):
    """Saves a new regulatory requirement or deadline."""
    return ComplianceService.create_requirement(request, db)

@router.get("", response_model=List[ComplianceRequirementResponse])
def get_requirements_endpoint(db: Session = Depends(get_db)):
    """Lists all regulatory requirements."""
    return ComplianceService.list_requirements(db)

@router.patch("/{req_id}", response_model=ComplianceRequirementResponse)
def update_requirement_status_endpoint(req_id: int, request: ComplianceRequirementUpdate, db: Session = Depends(get_db)):
    """Updates requirement status."""
    try:
        return ComplianceService.update_status(req_id, request.status, db)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))

@router.get("/calendar", response_model=List[ComplianceRequirementResponse])
def get_calendar_endpoint(db: Session = Depends(get_db)):
    """Lists requirements sorted by calendar order."""
    return ComplianceService.list_requirements(db)

@router.get("/risks", response_model=List[ComplianceRiskResponse])
def get_risks_endpoint(db: Session = Depends(get_db)):
    """Lists all detected compliance risks."""
    return db.query(ComplianceRisk).all()

@router.post("/analyze", response_model=List[ComplianceRiskResponse])
def analyze_compliance_risks_endpoint(db: Session = Depends(get_db)):
    """Triggers risk analysis rules evaluation."""
    return RiskService.analyze_requirements(db)

@router.post("/documents", response_model=ComplianceDocumentResponse)
def upload_document_endpoint(request: ComplianceDocumentCreate, db: Session = Depends(get_db)):
    """Logs a document submission for a requirement."""
    return DocumentVerificationService.upload_document(request.requirement_id, request.filename, db)

@router.get("/documents", response_model=List[ComplianceDocumentResponse])
def get_documents_endpoint(db: Session = Depends(get_db)):
    """Lists uploaded compliance documents."""
    return db.query(ComplianceDocument).all()

@router.get("/dashboard", response_model=ComplianceDashboardResponse)
def get_compliance_dashboard_endpoint(db: Session = Depends(get_db)):
    """Retrieves statistics and breakdowns for the Compliance Dashboard."""
    # Ensure risks are analyzed before loading dashboard stats
    RiskService.analyze_requirements(db)
    return ComplianceService.get_dashboard_data(db)
