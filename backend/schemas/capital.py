from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any

class InvoiceCreate(BaseModel):
    invoice_number: str
    customer_name: str
    amount: float
    due_date: datetime
    status: Optional[str] = "sent"

class InvoiceUpdate(BaseModel):
    status: str

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    customer_name: str
    amount: float
    due_date: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float
    payment_method: str

class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_date: datetime
    payment_method: str

    class Config:
        from_attributes = True

class ApprovalRequestCreate(BaseModel):
    title: str
    requester: str
    approver: str
    status: Optional[str] = "pending"

class ApprovalRequestUpdate(BaseModel):
    status: str

class ApprovalRequestResponse(BaseModel):
    id: int
    title: str
    requester: str
    approver: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class DunningActionResponse(BaseModel):
    level: str  # Level 1, Level 2, Escalation
    days_overdue: int
    email_subject: str
    email_body: str
    call_script: str
    collection_notes: str

class FinanceDashboardStats(BaseModel):
    outstanding_revenue: float
    paid_this_month: float
    overdue_revenue: float
    pending_approvals: int

class FinanceDashboardResponse(BaseModel):
    stats: FinanceDashboardStats
    aging_buckets: Dict[str, float]  # 0-30, 31-60, 61-90, 90+
    invoices: List[InvoiceResponse]
    payments: List[PaymentResponse]
    approvals: List[ApprovalRequestResponse]
