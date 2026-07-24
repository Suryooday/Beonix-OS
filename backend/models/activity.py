from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.session import Base

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=True)
    type = Column(String, nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Many-to-one relationship with Lead
    lead = relationship("Lead", back_populates="activities")

from sqlalchemy import event
from backend.services.lead_memory_service import LeadMemoryService

@event.listens_for(Activity, 'after_insert')
def auto_index_activity(mapper, connection, target):
    """SQLAlchemy hook that automatically embeds and indexes new lead activities."""
    if not target.lead_id:
        return
    try:
        from datetime import datetime, timezone
        service = LeadMemoryService()
        timestamp = target.timestamp.isoformat() if target.timestamp else datetime.now(timezone.utc).isoformat()
        
        # Deduce type
        source_type = "activity"
        type_lower = target.type.lower() if target.type else ""
        if "call" in type_lower:
            source_type = "call"
        elif "email" in type_lower:
            source_type = "email"
        elif "chat" in type_lower:
            source_type = "chat"
        elif "summary" in type_lower:
            source_type = "summary"

        service.store_activity_memory(
            lead_id=target.lead_id,
            activity_id=target.id,
            content=target.content,
            source_type=source_type,
            timestamp=timestamp
        )
    except Exception as err:
        print(f"Automatic activity vector indexing failed for ID {target.id}: {err}")

from backend.models.transcript import Transcript

@event.listens_for(Transcript, 'after_insert')
def auto_index_transcript(mapper, connection, target):
    """SQLAlchemy hook that automatically embeds and indexes new transcripts."""
    if not target.lead_id:
        return
    try:
        from datetime import datetime, timezone
        service = LeadMemoryService()
        timestamp = target.created_at.isoformat() if target.created_at else datetime.now(timezone.utc).isoformat()
        
        service.store_call_memory(
            lead_id=target.lead_id,
            filename=target.filename,
            transcript=target.transcript_text,
            timestamp=timestamp
        )
    except Exception as err:
        print(f"Automatic transcript vector indexing failed for ID {target.id}: {err}")
