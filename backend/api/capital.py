from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.database.session import get_db
from backend.services.invoice_service import InvoiceService
from backend.services.payment_service import PaymentService
from backend.services.approval_service import ApprovalService
from backend.services.dunning_service import DunningService
from backend.services.finance_dashboard_service import FinanceDashboardService
from backend.schemas.capital import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    PaymentCreate,
    PaymentResponse,
    ApprovalRequestCreate,
    ApprovalRequestUpdate,
    ApprovalRequestResponse,
    DunningActionResponse,
    FinanceDashboardResponse
)

router = APIRouter(prefix="/capital", tags=["Capital Operations Module"])

@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice_endpoint(request: InvoiceCreate, db: Session = Depends(get_db)):
    """Creates and records a new client invoice."""
    return InvoiceService.create_invoice(request, db)

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices_endpoint(query: Optional[str] = None, db: Session = Depends(get_db)):
    """Lists or searches active client invoices."""
    if query:
        return InvoiceService.search_invoices(query, db)
    return InvoiceService.list_invoices(db)

@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
def get_invoice_details_endpoint(invoice_id: int, db: Session = Depends(get_db)):
    """Retrieves detailed parameters for an invoice."""
    inv = InvoiceService.get_invoice(invoice_id, db)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv

@router.patch("/invoices/{invoice_id}", response_model=InvoiceResponse)
def update_invoice_status_endpoint(invoice_id: int, request: InvoiceUpdate, db: Session = Depends(get_db)):
    """Updates invoice status parameters."""
    try:
        return InvoiceService.update_invoice_status(invoice_id, request.status, db)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))

@router.get("/invoices/{invoice_id}/dunning", response_model=DunningActionResponse)
def get_invoice_dunning_endpoint(invoice_id: int, db: Session = Depends(get_db)):
    """Generates dunning notices and templates for overdue invoices."""
    inv = InvoiceService.get_invoice(invoice_id, db)
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    res = DunningService.get_dunning_level(inv)
    return DunningActionResponse(**res)

@router.post("/payments", response_model=PaymentResponse)
def record_payment_endpoint(request: PaymentCreate, db: Session = Depends(get_db)):
    """Records an incoming client invoice payment."""
    try:
        return PaymentService.record_payment(request, db)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))

@router.get("/payments", response_model=List[PaymentResponse])
def get_payments_endpoint(db: Session = Depends(get_db)):
    """Lists historical client invoice payments."""
    return PaymentService.list_payments(db)

@router.post("/approvals", response_model=ApprovalRequestResponse)
def create_approval_endpoint(request: ApprovalRequestCreate, db: Session = Depends(get_db)):
    """Creates a new payroll, expense, or purchase approval request."""
    return ApprovalService.create_approval(request, db)

@router.patch("/approvals/{approval_id}", response_model=ApprovalRequestResponse)
def update_approval_endpoint(approval_id: int, request: ApprovalRequestUpdate, db: Session = Depends(get_db)):
    """Resolves an approval request status (approved, rejected)."""
    try:
        return ApprovalService.update_approval_status(approval_id, request.status, db)
    except ValueError as err:
        raise HTTPException(status_code=404, detail=str(err))

@router.get("/approvals", response_model=List[ApprovalRequestResponse])
def get_approvals_endpoint(db: Session = Depends(get_db)):
    """Lists active/historical approval logs."""
    return ApprovalService.list_approvals(db)

@router.get("/dashboard", response_model=FinanceDashboardResponse)
def get_finance_dashboard_endpoint(db: Session = Depends(get_db)):
    """Retrieves stats, charts and aging data for the Finance Dashboard."""
    return FinanceDashboardService.get_dashboard_data(db)

@router.get("/risks", response_model=List[Dict[str, Any]])
def get_collection_risks_endpoint(db: Session = Depends(get_db)):
    """Performs live evaluation of overdue invoice aging risks."""
    return FinanceDashboardService.get_collection_risks(db)
