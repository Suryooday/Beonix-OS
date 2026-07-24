from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    company = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    source = Column(String, default="CSV Import", nullable=False)
    source_platform = Column(String, nullable=True)
    source_campaign = Column(String, nullable=True)
    imported_at = Column(DateTime, nullable=True)
    stage = Column(String, default="New", nullable=False)
    score = Column(Integer, default=0, nullable=False)
    priority = Column(String, default="Low", nullable=False)
    score_reasoning = Column(Text, nullable=True)
    manual_review = Column(Text, nullable=True)
    talking_points = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # One-to-many relationships
    activities = relationship("Activity", back_populates="lead", cascade="all, delete-orphan")
    transcripts = relationship("Transcript", back_populates="lead", cascade="all, delete-orphan")
