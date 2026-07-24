from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.database.session import Base

class RecoveryCase(Base):
    __tablename__ = "recovery_cases"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    risk_level = Column(String, default="medium")  # low, medium, high
    reason = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, reviewed, executed, dismissed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship back to the Lead
    lead = relationship("Lead")
