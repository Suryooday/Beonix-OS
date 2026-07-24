from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database.session import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True, nullable=False)
    customer_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="sent")  # draft, sent, paid, overdue, cancelled
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    payment_method = Column(String, nullable=False)

    invoice = relationship("Invoice", back_populates="payments")

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    requester = Column(String, nullable=False)
    approver = Column(String, nullable=False)
    status = Column(String, default="pending")  # pending, approved, rejected
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
