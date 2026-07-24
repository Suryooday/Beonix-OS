from sqlalchemy.orm import Session
from backend.models.activity import Activity

def create_ingestion_activity(db: Session, lead_id: int, summary: str) -> Activity:
    """
    Automatically creates a timeline activity entry for AI Ingestion.
    Logs 'source type = text' and appends the extracted summary.
    """
    content_text = f"AI ingestion completed. Summary: {summary}"
    db_activity = Activity(
        lead_id=lead_id,
        type="text",  # Source type = text
        content=content_text
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity
