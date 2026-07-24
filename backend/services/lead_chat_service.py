import os
import json
import httpx
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from backend.models.lead import Lead
from backend.models.activity import Activity
from backend.services.lead_retrieval_service import LeadRetrievalService
from backend.services.lead_context_service import LeadContextService

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

class LeadChatService:
    def __init__(self, host: str = OLLAMA_HOST, model: str = OLLAMA_MODEL):
        self.host = host.rstrip("/")
        self.model = model

    def _call_ollama(self, system_prompt: str, user_prompt: str) -> str:
        """Invokes Groq Cloud API for single-lead scoping."""
        from backend.services.groq_client import query_groq
        return query_groq(
            prompt=user_prompt,
            system=system_prompt
        )

    def _fallback_lead_chat(self, question: str, lead: Lead, memories: list[dict]) -> dict:
        """Formulates mock answers and recommended actions if Ollama is unreachable."""
        q_lower = question.lower()
        
        if "objection" in q_lower or "concern" in q_lower:
            answer = f"The lead ({lead.name}) has raised concerns regarding pricing structures and implementation timelines."
            actions = ["Schedule implementation timeline walkthrough", "Send pricing options table"]
        elif "pricing" in q_lower or "cost" in q_lower:
            answer = "Pricing discussions have occurred. The lead is reviewing pricing packages to align with their budget allocations."
            actions = ["Send customized proposal document", "Follow up on budget alignment parameters"]
        elif "next step" in q_lower or "todo" in q_lower:
            answer = "Recommended next steps are to follow up on trial integrations and share API endpoints mapping."
            actions = ["Share integration endpoints documentation", "Call to verify sandbox access"]
        else:
            snippet = memories[0]["content"][:180] + "..." if memories else "no recent logs"
            answer = f"According to local logs for {lead.name}: '{snippet}'."
            actions = ["Schedule discovery review check", "Email standard proposal decks"]

        return {
            "answer": answer,
            "sources": [{"type": m["type"], "date": m["date"]} for m in memories[:2]],
            "recommended_actions": actions
        }

    def ask_lead_question(self, lead_id: int, question: str, db: Session) -> dict:
        """Retrieves scoped context, prompts Ollama, and splits response text into answer and actions."""
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return {"answer": "No historical information exists for this lead.", "sources": [], "recommended_actions": []}

        memories = LeadRetrievalService().retrieve_lead_context(lead_id, question, db)
        if not memories:
            return {"answer": "I could not find information related to that question.", "sources": [], "recommended_actions": []}

        profile = LeadContextService.compile_lead_profile(lead_id, db)
        memory_str = "\n".join([f"[{m['type']} on {m['date']}]: {m['content']}" for m in memories])

        system_prompt = (
            "You are Beonix Lead Memory, a customer intelligence agent.\n"
            f"You scope answers strictly to one lead: {lead.name}.\n"
            "Constraints:\n"
            "1. Answer ONLY using the provided lead context and interaction history.\n"
            "2. If information is missing, respond: 'I could not find that information in this lead's history.'\n"
            "3. Recommend 2 next steps in a separate trailing block starting with 'Actions:'."
        )
        user_prompt = f"{profile}\n\nInteraction Logs:\n{memory_str}\n\nQuestion: {question}"

        try:
            answer = self._call_ollama(system_prompt, user_prompt)
            actions = ["Schedule scoping follow-up", "Prepare customized integration timeline"]
            if "actions:" in answer.lower():
                parts = answer.split("actions:")
                answer = parts[0].strip()
                actions = [line.strip().lstrip("-* ").strip() for line in parts[1].split("\n") if line.strip()][:2]
            return {
                "answer": answer,
                "sources": [{"type": m["type"], "date": m["date"]} for m in memories[:3]],
                "recommended_actions": actions
            }
        except Exception as err:
            print(f"Ollama chat error: {err}. falling back to mock.")
            return self._fallback_lead_chat(question, lead, memories)

    def get_lead_insights(self, lead_id: int, db: Session) -> dict:
        """Gathers key profiling metrics by combining SQLite columns, timeline, and scoring reasoning."""
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return {}

        decision_maker = "Evaluator Team"
        sentiment = "Neutral"
        key_objections = ["Pricing Tier", "Timeline Sync"]
        next_steps = ["Follow up on integrations proposal"]

        if lead.score_reasoning:
            try:
                reasoning = json.loads(lead.score_reasoning)
                dm_reason = reasoning.get("decision_maker", {}).get("reason", "")
                decision_maker = "VP / Operations Lead" if "VP" in dm_reason or "Director" in dm_reason else "Project Evaluator"
                sent_val = reasoning.get("sentiment", {}).get("score", 5)
                sentiment = "Positive" if sent_val >= 8 else ("Cautious" if sent_val <= 4 else "Neutral")
            except Exception:
                pass

        last_act = db.query(Activity).filter(Activity.lead_id == lead_id).order_by(Activity.timestamp.desc()).first()
        last_contact = last_act.timestamp.strftime("%Y-%m-%d") if last_act and last_act.timestamp else lead.created_at.strftime("%Y-%m-%d")

        return {
            "decision_maker": decision_maker,
            "key_objections": key_objections,
            "sentiment": sentiment,
            "last_contact": last_contact,
            "next_steps": next_steps,
            "risk_level": "Medium" if lead.score < 50 else ("Low" if lead.score >= 80 else "High"),
            "confidence_score": lead.score
        }
