import os
import shutil
import json
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from backend.database.session import get_db
from backend.models.lead import Lead
from backend.models.activity import Activity
from backend.models.draft_email import DraftEmail, GmailCredential, OutreachMessage, EmailAttachment
from backend.schemas.email import (
    EmailGenerateRequest, 
    EmailSimulateReplyRequest, 
    EmailResponse, 
    EmailUpdateRequest,
    EmailRefineRequest,
    GmailStatusResponse,
    GmailConfigRequest,
    GmailConfigResponse,
    OutreachMessageResponse,
    AttachmentResponse
)
from backend.services.email_generator_service import EmailGeneratorService
from backend.services.followup_service import FollowupService
from backend.services.gmail_service import GmailService

router = APIRouter(prefix="/emails", tags=["AI Outreach Engine"])

ATTACHMENT_DIR = "backend/storage/attachments"
os.makedirs(ATTACHMENT_DIR, exist_ok=True)

# ── GMAIL AUTH & OAUTH ENDPOINTS ──

@router.get("/gmail/status", response_model=GmailStatusResponse)
def get_gmail_status(db: Session = Depends(get_db)):
    """Checks the authentication status of Gmail."""
    cred = db.query(GmailCredential).first()
    has_config = False
    if cred and cred.client_id and cred.client_secret:
        has_config = True
    elif os.getenv("GMAIL_CLIENT_ID") and os.getenv("GMAIL_CLIENT_SECRET"):
        has_config = True

    connected = False
    email_address = None
    if has_config:
        profile = GmailService.get_gmail_profile(db)
        if profile:
            connected = True
            email_address = profile.get("emailAddress")

    return GmailStatusResponse(
        connected=connected,
        email=email_address,
        client_id_configured=has_config
    )

@router.post("/gmail/config", response_model=GmailConfigResponse)
def save_gmail_config(req: GmailConfigRequest, db: Session = Depends(get_db)):
    """Saves Gmail client secrets configuration."""
    cred = db.query(GmailCredential).first()
    if not cred:
        cred = GmailCredential()
        db.add(cred)
    cred.client_id = req.client_id
    cred.client_secret = req.client_secret
    db.commit()
    return GmailConfigResponse(success=True)

@router.get("/gmail/auth-url")
def get_gmail_auth_url(redirect_uri: Optional[str] = None, db: Session = Depends(get_db)):
    """Generates the authorization redirect URL for Google login."""
    try:
        auth_url, _ = GmailService.get_authorization_url(db, redirect_uri)
        return {"auth_url": auth_url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/gmail/callback")
def gmail_callback(code: str, state: Optional[str] = None, error: Optional[str] = None, db: Session = Depends(get_db)):
    """Handles OAuth redirect callback from Google, exchanges auth code for refresh tokens."""
    if error:
        return RedirectResponse(url=f"http://localhost:3000/mail?error={error}")
    
    try:
        GmailService.save_tokens_from_code(db, code)
        return RedirectResponse(url="http://localhost:3000/mail?authenticated=success")
    except Exception as e:
        print(f"OAuth Callback Error: {e}")
        return RedirectResponse(url=f"http://localhost:3000/mail?error=failed_to_exchange_token")

@router.post("/gmail/disconnect", response_model=dict)
def disconnect_gmail(db: Session = Depends(get_db)):
    """Disconnects the connected Gmail account."""
    cred = db.query(GmailCredential).first()
    if cred:
        cred.auth_token = None
        db.commit()
    return {"success": True}


# ── EMAIL GENERATION & DRAFTS LIFECYCLE ──

@router.put("/{email_id}", response_model=EmailResponse)
def update_email_endpoint(email_id: int, req: EmailUpdateRequest, db: Session = Depends(get_db)):
    """Updates a draft email's subject and body."""
    draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot edit an email that has already been approved or sent")

    draft.subject = req.subject
    draft.body = req.body
    db.add(draft)
    db.commit()
    db.refresh(draft)

    lead = db.query(Lead).filter(Lead.id == draft.lead_id).first()
    return EmailResponse(
        id=draft.id,
        lead_id=draft.lead_id,
        lead_name=lead.name if lead else "Unknown Lead",
        lead_email=lead.email if lead else "Unknown Email",
        subject=draft.subject,
        body=draft.body,
        status=draft.status,
        response_received=draft.response_received,
        response_sentiment=draft.response_sentiment,
        created_at=draft.created_at,
        sent_at=draft.sent_at,
        replied_at=draft.replied_at,
        messages=draft.messages,
        attachments=draft.attachments
    )

@router.post("/generate", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
def generate_email_endpoint(req: EmailGenerateRequest, db: Session = Depends(get_db)):
    """
    Generates a personalized draft outreach email using Groq.
    Automatically moves the Lead stage to 'Contacted'.
    """
    # Fetch lead details
    lead = db.query(Lead).filter(Lead.id == req.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    # Call generator service
    email_data = EmailGeneratorService.generate_personalized_email(db, req.lead_id)

    # Check if there is an existing email for this lead
    draft = db.query(DraftEmail).filter(DraftEmail.lead_id == lead.id).first()
    if not draft:
        draft = DraftEmail(
            lead_id=lead.id,
            subject=email_data["subject"],
            body=email_data["body"],
            status="draft"
        )
        db.add(draft)
    else:
        # Overwrite if exists to generate fresh draft
        draft.subject = email_data["subject"]
        draft.body = email_data["body"]
        draft.status = "draft"
        db.add(draft)

    # Move Lead stage to Contacted
    old_stage = lead.stage
    lead.stage = "Contacted"
    db.add(lead)

    # Add logs
    act_stage = Activity(
        lead_id=lead.id,
        type="Stage Change",
        content=f"Stage transitioned from '{old_stage}' to 'Contacted' via outreach email auto-generation."
    )
    act_draft = Activity(
        lead_id=lead.id,
        type="System",
        content=f"AI Outreach email draft generated: '{draft.subject}'."
    )
    db.add(act_stage)
    db.add(act_draft)

    db.commit()
    db.refresh(draft)

    # Map to schema response
    return EmailResponse(
        id=draft.id,
        lead_id=draft.lead_id,
        lead_name=lead.name,
        lead_email=lead.email,
        subject=draft.subject,
        body=draft.body,
        status=draft.status,
        created_at=draft.created_at,
        messages=draft.messages,
        attachments=draft.attachments
    )

@router.get("/drafts", response_model=List[EmailResponse])
def get_drafts_endpoint(db: Session = Depends(get_db)):
    """Retrieves all generated outreach emails and drafts logs."""
    drafts = db.query(DraftEmail).order_by(DraftEmail.created_at.desc()).all()
    res = []
    for d in drafts:
        lead = db.query(Lead).filter(Lead.id == d.lead_id).first()
        res.append(EmailResponse(
            id=d.id,
            lead_id=d.lead_id,
            lead_name=lead.name if lead else "Unknown Lead",
            lead_email=lead.email if lead else "Unknown Email",
            subject=d.subject,
            body=d.body,
            status=d.status,
            response_received=d.response_received,
            response_sentiment=d.response_sentiment,
            created_at=d.created_at,
            sent_at=d.sent_at,
            replied_at=d.replied_at,
            messages=d.messages,
            attachments=d.attachments
        ))
    return res

@router.post("/{email_id}/ai-refine", response_model=EmailResponse)
def ai_refine_email_endpoint(email_id: int, req: EmailRefineRequest, db: Session = Depends(get_db)):
    """Refines a draft outreach email using Groq and custom instructions."""
    try:
        EmailGeneratorService.refine_email_draft(db, email_id, req.prompt)
        draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
        lead = db.query(Lead).filter(Lead.id == draft.lead_id).first()
        return EmailResponse(
            id=draft.id,
            lead_id=draft.lead_id,
            lead_name=lead.name if lead else "Unknown Lead",
            lead_email=lead.email if lead else "Unknown Email",
            subject=draft.subject,
            body=draft.body,
            status=draft.status,
            created_at=draft.created_at,
            messages=draft.messages,
            attachments=draft.attachments
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{email_id}/approve", response_model=dict)
def approve_email_endpoint(email_id: int, db: Session = Depends(get_db)):
    """Approves an outreach draft, setting status to 'approved'."""
    draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.status = "approved"
    
    lead = db.query(Lead).filter(Lead.id == draft.lead_id).first()
    if lead:
        act = Activity(
            lead_id=lead.id,
            type="System",
            content=f"Outreach email approved for dispatch: '{draft.subject}'."
        )
        db.add(act)

    db.commit()
    return {"success": True, "status": "approved"}

@router.post("/{email_id}/send", response_model=dict)
def send_email_endpoint(email_id: int, db: Session = Depends(get_db)):
    """
    Sends outreach email. Attempts to use real Gmail API if authenticated;
    otherwise falls back to simulated dispatch.
    """
    draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    lead = db.query(Lead).filter(Lead.id == draft.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Associated lead not found")

    # Check if Gmail API is authenticated
    credentials = GmailService.get_credentials(db)
    real_gmail_sent = False
    
    if credentials:
        try:
            GmailService.send_gmail_message(
                db=db,
                to_email=lead.email,
                subject=draft.subject,
                body=draft.body,
                attachments=draft.attachments
            )
            real_gmail_sent = True
        except Exception as e:
            print(f"Real Gmail API send failed, falling back to simulation. Error: {e}")

    draft.status = "sent"
    draft.sent_at = datetime.now(timezone.utc)

    # Append to outreach thread messages log
    outbound_msg = OutreachMessage(
        draft_email_id=draft.id,
        sender="user",
        subject=draft.subject,
        body=draft.body
    )
    db.add(outbound_msg)

    # Log timeline activity
    sent_mode = "Real Gmail API" if real_gmail_sent else "Sandbox Simulator"
    act = Activity(
        lead_id=lead.id,
        type="System",
        content=f"Sent Outreach email via {sent_mode} to {lead.email}: '{draft.subject}'."
    )
    db.add(act)

    db.commit()
    return {"success": True, "status": "sent", "sent_at": draft.sent_at, "real_gmail": real_gmail_sent}

@router.post("/{email_id}/simulate-reply", response_model=dict)
def simulate_reply_endpoint(email_id: int, req: EmailSimulateReplyRequest, db: Session = Depends(get_db)):
    """
    Simulates a reply received via the Gmail API, parses the response sentiment,
    automatically transitions the Lead column stage, adjusts the score, and schedules tasks.
    Also appends the prospect's reply message to the outreach conversation thread.
    """
    draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft email record not found.")

    lead = db.query(Lead).filter(Lead.id == draft.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found.")

    # Determine simulated reply text
    reply_text = req.reply_text
    if not reply_text:
        if req.sentiment == "positive":
            reply_text = "Thanks for your outreach email! The Beonix OS custom pipeline specs sound exactly like what we need. Let's schedule a brief demo meeting next Tuesday afternoon."
        elif req.sentiment == "negative":
            reply_text = "Please remove us from your mailing list. We are not interested in custom OS or dashboard tools."
        else:
            reply_text = "Hello, I am currently out of office on business travel with delayed response times. I will review and get back to you next week."

    # Call AI Reply Analysis
    analysis = EmailGeneratorService.analyze_response(reply_text, draft.subject)

    # Update draft email record
    draft.status = "replied"
    draft.response_received = reply_text
    draft.response_sentiment = analysis["sentiment"]
    draft.replied_at = datetime.now(timezone.utc)
    db.add(draft)

    # Append to threaded messages
    inbound_msg = OutreachMessage(
        draft_email_id=draft.id,
        sender="prospect",
        subject=f"Re: {draft.subject}",
        body=reply_text
    )
    db.add(inbound_msg)

    # Update Lead stage and score
    old_stage = lead.stage
    old_score = lead.score
    lead.stage = analysis["next_stage"]
    
    # Adjust score (clamped between 0 and 100)
    lead.score = max(0, min(100, lead.score + analysis["score_delta"]))
    db.add(lead)

    # Log activities
    act_reply_content = Activity(
        lead_id=lead.id,
        type="Email Response",
        content=f"Prospect replied: \"{reply_text}\""
    )
    act_stage_change = Activity(
        lead_id=lead.id,
        type="Stage Change",
        content=f"Stage transitioned from '{old_stage}' to '{lead.stage}' based on reply sentiment analysis ({analysis['sentiment'].upper()})."
    )
    score_delta = analysis["score_delta"]
    act_score_change = Activity(
        lead_id=lead.id,
        type="System",
        content=f"Lead score adjusted from {old_score} to {lead.score} (delta {'+' if score_delta > 0 else ''}{score_delta})."
    )
    db.add(act_reply_content)
    db.add(act_stage_change)
    db.add(act_score_change)

    # Create Follow-Up Task
    followup_service = FollowupService()
    scheduled_days = 1 if analysis["sentiment"] == "positive" else 7
    followup_type = "call" if analysis["sentiment"] == "positive" else "email"
    
    followup_service.create_followup(
        lead_id=lead.id,
        followup_type=followup_type,
        title=analysis["followup_title"],
        description=analysis["followup_desc"],
        scheduled_at=datetime.now(timezone.utc) + timedelta(days=scheduled_days),
        db=db
    )

    db.commit()
    db.refresh(lead)
    db.refresh(draft)

    return {
        "success": True,
        "sentiment": analysis["sentiment"],
        "next_stage": lead.stage,
        "new_score": lead.score,
        "reply_text": reply_text
    }


# ── THREADED CONVERSATION MESSAGES ──

@router.get("/{email_id}/thread", response_model=List[OutreachMessageResponse])
def get_email_thread(email_id: int, db: Session = Depends(get_db)):
    """Retrieves all conversation messages in the thread."""
    draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Email thread not found")

    messages = db.query(OutreachMessage).filter(OutreachMessage.draft_email_id == email_id).order_by(OutreachMessage.created_at.asc()).all()
    
    # If no messages in the database outreach_messages table yet, construct them from draft status
    if len(messages) == 0:
        constructed = []
        # If email was sent/replied, original draft is the first message
        if draft.status in ["sent", "replied"]:
            constructed.append(OutreachMessageResponse(
                id=10000 + draft.id,
                sender="user",
                subject=draft.subject,
                body=draft.body,
                created_at=draft.sent_at or draft.created_at
            ))
        if draft.status == "replied" and draft.response_received:
            constructed.append(OutreachMessageResponse(
                id=20000 + draft.id,
                sender="prospect",
                subject=f"Re: {draft.subject}",
                body=draft.response_received,
                created_at=draft.replied_at or draft.created_at
            ))
        return constructed

    return messages

@router.post("/{email_id}/reply", response_model=OutreachMessageResponse)
def reply_to_thread(email_id: int, body: str = Form(...), db: Session = Depends(get_db)):
    """Sends a new reply back to the prospect in the thread."""
    draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Email thread not found")

    lead = db.query(Lead).filter(Lead.id == draft.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Associated lead not found")

    subject = f"Re: {draft.subject}"

    # Try to send via real Gmail API if connected
    credentials = GmailService.get_credentials(db)
    real_gmail_sent = False
    if credentials:
        try:
            GmailService.send_gmail_message(db, lead.email, subject, body)
            real_gmail_sent = True
        except Exception as e:
            print(f"Failed to send follow-up via real Gmail API: {e}")

    # Save outreach message
    new_message = OutreachMessage(
        draft_email_id=draft.id,
        sender="user",
        subject=subject,
        body=body
    )
    db.add(new_message)

    # Log to activities timeline
    sent_mode = "Real Gmail API" if real_gmail_sent else "Sandbox Simulator"
    act = Activity(
        lead_id=lead.id,
        type="System",
        content=f"Sent follow-up reply via {sent_mode} to {lead.email}: '{subject}'."
    )
    db.add(act)
    
    db.commit()
    db.refresh(new_message)

    return new_message


# ── EMAIL ATTACHMENTS ──

@router.post("/{email_id}/attachments", response_model=AttachmentResponse)
def upload_attachment(email_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Uploads a file and attaches it to the draft email."""
    draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    # Save file locally
    safe_filename = "".join([c for c in file.filename if c.isalpha() or c.isdigit() or c in "._- "]).strip()
    storage_path = os.path.join(ATTACHMENT_DIR, f"{email_id}_{safe_filename}")
    
    with open(storage_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save record
    attachment = EmailAttachment(
        draft_email_id=email_id,
        filename=file.filename,
        file_path=storage_path,
        content_type=file.content_type or "application/octet-stream"
    )
    db.add(attachment)
    db.commit()
    db.refresh(attachment)

    return attachment

@router.delete("/attachments/{attachment_id}", response_model=dict)
def delete_attachment(attachment_id: int, db: Session = Depends(get_db)):
    """Removes an attachment database record and deletes the local file."""
    attachment = db.query(EmailAttachment).filter(EmailAttachment.id == attachment_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    # Delete local file if it exists
    if os.path.exists(attachment.file_path):
        try:
            os.remove(attachment.file_path)
        except Exception as e:
            print(f"Failed to delete local attachment file: {e}")

    db.delete(attachment)
    db.commit()
    return {"success": True}
