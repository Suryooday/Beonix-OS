from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import session and base elements
from backend.database.session import Base, engine
# Import models to register them with Base metadata before creating tables
from backend.models.lead import Lead
from backend.models.activity import Activity
from backend.models.transcript import Transcript
from backend.models.document import Document, DocumentChunk
from backend.models.chat import ChatSession, ChatMessage
from backend.models.draft_email import DraftEmail, GmailCredential, OutreachMessage, EmailAttachment
# Import API routers
from backend.api.leads import router as leads_router
from backend.api.ingest import router as ingest_router
from backend.api.scoring import router as scoring_router
from backend.api.audio import router as audio_router
from backend.api.documents import router as documents_router
from backend.api.chat import router as chat_router
from backend.api.lead_chat import router as lead_chat_router
from backend.api.recovery import router as recovery_router
from backend.api.followup import router as followup_router
from backend.api.workflow import router as workflow_router
from backend.api.capital import router as capital_router
from backend.api.compliance import router as compliance_router
from backend.api.imports import router as imports_router
from backend.api.emails import router as emails_router
from backend.services.scheduler_service import SchedulerService

# Create SQLite tables if they do not exist
# In production, migrations (like Alembic) are preferred, but this is simple and beginner-friendly
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Beonix Lead Management API",
    description="A clean architecture FastAPI backend with SQLAlchemy and SQLite.",
    version="1.0.0"
)

# Set up CORS middleware (useful if frontend needs to call it directly)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(leads_router)
app.include_router(ingest_router)
app.include_router(scoring_router)
app.include_router(audio_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(lead_chat_router)
app.include_router(recovery_router)
app.include_router(followup_router)
app.include_router(workflow_router)
app.include_router(capital_router)
app.include_router(compliance_router)
app.include_router(imports_router)
app.include_router(emails_router)

@app.on_event("startup")
def startup_event():
    SchedulerService.start_scheduler()

@app.on_event("shutdown")
def shutdown_event():
    SchedulerService.shutdown_scheduler()

@app.get("/", tags=["Health"])
def health_check() -> dict:
    """
    Simple API health-check endpoint.
    """
    return {"status": "ok", "message": "Beonix backend service is running."}
