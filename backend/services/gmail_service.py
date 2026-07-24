import json
import base64
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

from backend.models.draft_email import GmailCredential, DraftEmail, EmailAttachment

# Define OAuth scopes needed for Gmail integration
SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify"
]

class GmailService:
    @staticmethod
    def get_oauth_flow(db: Session, redirect_uri: Optional[str] = None) -> Optional[Flow]:
        """
        Creates and returns a google_auth_oauthlib Flow object based on stored config in database.
        """
        cred = db.query(GmailCredential).first()
        if not cred or not cred.client_id or not cred.client_secret:
            # Fallback to env variables if available
            client_id = os.getenv("GMAIL_CLIENT_ID")
            client_secret = os.getenv("GMAIL_CLIENT_SECRET")
            if not client_id or not client_secret:
                return None
        else:
            client_id = cred.client_id
            client_secret = cred.client_secret

        client_config = {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": [redirect_uri or os.getenv("GMAIL_REDIRECT_URI", "http://localhost:8000/emails/gmail/callback")]
            }
        }

        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=redirect_uri or os.getenv("GMAIL_REDIRECT_URI", "http://localhost:8000/emails/gmail/callback")
        )
        return flow

    @staticmethod
    def get_authorization_url(db: Session, redirect_uri: Optional[str] = None) -> tuple[str, str]:
        """
        Generates the Google OAuth authorization URL.
        Returns (auth_url, state).
        """
        flow = GmailService.get_oauth_flow(db, redirect_uri)
        if not flow:
            raise ValueError("Gmail client credentials are not configured in settings.")
        
        # authorization_url returns a tuple of (url, state)
        auth_url, state = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent"
        )
        return auth_url, state

    @staticmethod
    def save_tokens_from_code(db: Session, code: str, redirect_uri: Optional[str] = None) -> dict:
        """
        Exchanges code for access/refresh tokens and stores them in the database.
        """
        flow = GmailService.get_oauth_flow(db, redirect_uri)
        if not flow:
            raise ValueError("Gmail client credentials are not configured.")
        
        flow.fetch_token(code=code)
        credentials = flow.credentials

        # Serialize credentials to JSON string
        creds_data = {
            "token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "token_uri": credentials.token_uri,
            "client_id": credentials.client_id,
            "client_secret": credentials.client_secret,
            "scopes": credentials.scopes
        }

        cred = db.query(GmailCredential).first()
        if not cred:
            cred = GmailCredential()
            db.add(cred)
        
        cred.auth_token = json.dumps(creds_data)
        db.commit()
        db.refresh(cred)
        
        return creds_data

    @staticmethod
    def get_credentials(db: Session) -> Optional[Credentials]:
        """
        Loads and refreshes stored Google OAuth credentials.
        """
        cred = db.query(GmailCredential).first()
        if not cred or not cred.auth_token:
            return None

        try:
            creds_data = json.loads(cred.auth_token)
            credentials = Credentials(
                token=creds_data.get("token"),
                refresh_token=creds_data.get("refresh_token"),
                token_uri=creds_data.get("token_uri"),
                client_id=creds_data.get("client_id"),
                client_secret=creds_data.get("client_secret"),
                scopes=creds_data.get("scopes")
            )

            # Refresh token if expired
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                # Save refreshed tokens back to DB
                new_creds_data = {
                    "token": credentials.token,
                    "refresh_token": credentials.refresh_token,
                    "token_uri": credentials.token_uri,
                    "client_id": credentials.client_id,
                    "client_secret": credentials.client_secret,
                    "scopes": credentials.scopes
                }
                cred.auth_token = json.dumps(new_creds_data)
                db.commit()
                db.refresh(cred)
            
            return credentials
        except Exception as e:
            print(f"Failed to load or refresh Gmail credentials: {e}")
            return None

    @staticmethod
    def get_gmail_profile(db: Session) -> Optional[Dict[str, Any]]:
        """
        Retrieves the connected Gmail user's email address and profile info.
        """
        credentials = GmailService.get_credentials(db)
        if not credentials:
            return None
        
        try:
            service = build("gmail", "v1", credentials=credentials)
            profile = service.users().getProfile(userId="me").execute()
            return profile
        except Exception as e:
            print(f"Failed to fetch Gmail profile: {e}")
            return None

    @staticmethod
    def send_gmail_message(db: Session, to_email: str, subject: str, body: str, attachments: Optional[List[EmailAttachment]] = None) -> Optional[dict]:
        """
        Sends an email using the real Gmail API. Encodes body and attachments inside a MIME message.
        """
        credentials = GmailService.get_credentials(db)
        if not credentials:
            return None
        
        try:
            service = build("gmail", "v1", credentials=credentials)
            
            # Create a multipart MIME message
            message = MIMEMultipart()
            message["to"] = to_email
            message["subject"] = subject
            
            # Attach body text
            message.attach(MIMEText(body, "plain"))
            
            # Attach files if any
            if attachments:
                for att in attachments:
                    if os.path.exists(att.file_path):
                        part = MIMEBase("application", "octet-stream")
                        with open(att.file_path, "rb") as file:
                            part.set_payload(file.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            "Content-Disposition",
                            f"attachment; filename={att.filename}"
                        )
                        message.attach(part)
            
            # Base64url encode the message
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
            
            send_payload = {"raw": raw_message}
            result = service.users().messages().send(userId="me", body=send_payload).execute()
            return result
        except Exception as e:
            print(f"Failed to send real Gmail outreach message: {e}")
            raise e
