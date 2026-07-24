from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime, timezone
from backend.database.session import Base

class ImportJob(Base):
    __tablename__ = "import_jobs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    total_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    duplicate_rows = Column(Integer, default=0)
    failed_rows = Column(Integer, default=0)
    status = Column(String, default="processing")  # processing, completed, failed
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
