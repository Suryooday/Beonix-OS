import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from backend.database.session import get_db
from backend.models.chat import ChatSession, ChatMessage
from backend.schemas.chat import (
    AskRequest, AskResponse, SourceCitation,
    ChatSessionResponse, ChatSessionDetailResponse, ChatMessageResponse
)
from backend.services.rag_service import RAGService

router = APIRouter(tags=["Memory Chat Assistant"])

@router.post("/documents/ask", response_model=AskResponse)
def ask_document_endpoint(request: AskRequest, db: Session = Depends(get_db)):
    """One-off Q&A endpoint querying uploaded documents using context retrievers."""
    result = RAGService().generate_answer(request.question, db)
    return AskResponse(
        answer=result["answer"],
        sources=[
            SourceCitation(document=s["document"], chunk=s["chunk"], score=s["score"])
            for s in result["sources"]
        ]
    )

@router.post("/memory/session", response_model=ChatSessionResponse)
def create_session_endpoint(db: Session = Depends(get_db)):
    """Creates a new persistent conversation chat session."""
    session = ChatSession(title="New Conversation")
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/memory/session/{session_id}", response_model=ChatSessionDetailResponse)
def get_session_endpoint(session_id: int, db: Session = Depends(get_db)):
    """Retrieves a chat session with its full message history."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )
    return session

@router.post("/memory/session/{session_id}/message", response_model=ChatMessageResponse)
def post_message_endpoint(session_id: int, request: AskRequest, db: Session = Depends(get_db)):
    """Processes user query via RAG and logs user/assistant messages in SQLite history."""
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found."
        )

    # 1. Log User Message
    db.add(ChatMessage(session_id=session_id, role="user", content=request.question))

    # 2. Run RAG Ingest query
    result = RAGService().generate_answer(request.question, db)

    # 3. Dynamic Title Update
    if session.title == "New Conversation":
        session.title = request.question[:32] + ("..." if len(request.question) > 32 else "")

    # 4. Log Assistant message with serialized citations
    assistant_msg = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=json.dumps({
            "answer": result["answer"],
            "sources": result["sources"]
        })
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)
    return assistant_msg
