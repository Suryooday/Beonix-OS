from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.database.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    document_type = Column(String, nullable=False)  # pdf, docx, txt
    file_size = Column(Integer, nullable=False)  # in bytes
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    chunk_count = Column(Integer, default=0, nullable=False)
    processing_status = Column(String, default="pending", nullable=False)  # pending, processing, completed, failed

    # One-to-many relationship with DocumentChunk
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship back to Document
    document = relationship("Document", back_populates="chunks")
