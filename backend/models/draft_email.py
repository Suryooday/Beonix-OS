from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.database.session import Base

class GmailCredential(Base):
    __tablename__ = "gmail_credentials"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(String, nullable=True)
    client_secret = Column(String, nullable=True)
    auth_token = Column(Text, nullable=True) # stores JSON credentials payload
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

class DraftEmail(Base):
    __tablename__ = "draft_emails"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String, default="draft", nullable=False) # 'draft', 'approved', 'sent', 'replied'
    response_received = Column(Text, nullable=True)
    response_sentiment = Column(String, nullable=True) # 'positive', 'neutral', 'negative'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    sent_at = Column(DateTime, nullable=True)
    replied_at = Column(DateTime, nullable=True)

    # Relationship with Lead
    lead = relationship("Lead", backref="draft_emails")

    # Threaded messages and attachments
    messages = relationship("OutreachMessage", back_populates="draft_email", cascade="all, delete-orphan", order_by="OutreachMessage.created_at")
    attachments = relationship("EmailAttachment", back_populates="draft_email", cascade="all, delete-orphan")

class OutreachMessage(Base):
    __tablename__ = "outreach_messages"

    id = Column(Integer, primary_key=True, index=True)
    draft_email_id = Column(Integer, ForeignKey("draft_emails.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String, nullable=False) # 'user' or 'prospect'
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship with parent draft email
    draft_email = relationship("DraftEmail", back_populates="messages")

class EmailAttachment(Base):
    __tablename__ = "email_attachments"

    id = Column(Integer, primary_key=True, index=True)
    draft_email_id = Column(Integer, ForeignKey("draft_emails.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    content_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship with parent draft email
    draft_email = relationship("DraftEmail", back_populates="attachments")
