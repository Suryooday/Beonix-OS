from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database.session import Base

class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    followup_type = Column(String, nullable=False)  # email, call, meeting, whatsapp, task
    scheduled_at = Column(DateTime, nullable=False)
    status = Column(String, default="pending")  # pending, scheduled, completed, cancelled, overdue
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship back to Lead
    lead = relationship("Lead")
    # One-to-many relationship with execution logs
    executions = relationship("FollowUpExecution", back_populates="followup", cascade="all, delete-orphan")

class FollowUpExecution(Base):
    __tablename__ = "followup_executions"

    id = Column(Integer, primary_key=True, index=True)
    followup_id = Column(Integer, ForeignKey("followups.id", ondelete="CASCADE"), nullable=False)
    execution_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    execution_result = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Back-populates relation
    followup = relationship("FollowUp", back_populates="executions")
