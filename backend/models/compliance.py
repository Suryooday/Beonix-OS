from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database.session import Base

class ComplianceRequirement(Base):
    __tablename__ = "compliance_requirements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)  # GST, MCA, Tax, Payroll, Internal Policy, Contract Renewal
    due_date = Column(DateTime, nullable=False)
    status = Column(String, default="pending")  # compliant, pending, overdue, at_risk
    owner = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    documents = relationship("ComplianceDocument", back_populates="requirement", cascade="all, delete-orphan")
    risks = relationship("ComplianceRisk", back_populates="requirement", cascade="all, delete-orphan")

class ComplianceDocument(Base):
    __tablename__ = "compliance_documents"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("compliance_requirements.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    upload_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    verification_status = Column(String, default="pending")  # pending, verified, rejected

    requirement = relationship("ComplianceRequirement", back_populates="documents")

class ComplianceRisk(Base):
    __tablename__ = "compliance_risks"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("compliance_requirements.id", ondelete="CASCADE"), nullable=False)
    severity = Column(String, nullable=False)  # low, medium, high, critical
    description = Column(String, nullable=False)
    recommendation = Column(String, nullable=False)

    requirement = relationship("ComplianceRequirement", back_populates="risks")
