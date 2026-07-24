import json
import os
import re
import httpx
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.models.lead import Lead
from backend.models.activity import Activity
from backend.schemas.scoring import ScoringBreakdown

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

# Configurable weights for scoring factors
WEIGHTS = {
    "urgency": 0.30,
    "budget_signal": 0.25,
    "decision_maker": 0.20,
    "engagement": 0.15,
    "sentiment": 0.10
}

SYSTEM_PROMPT = """You are an expert sales operations analyst. Analyze the provided lead communication history.
Evaluate the following factors and assign a score from 0 to 10 for each, along with a short 1-sentence reason:
1. "urgency": How quickly they want to implement/start (0 = none, 10 = immediate).
2. "budget_signal": Indications of budget availability or pricing discussion (0 = none/complaining about price, 10 = budget approved).
3. "decision_maker": Inferred role and authority to purchase (0 = junior/no authority, 10 = executive/purchaser).
4. "engagement": Interaction length, depth of questions, or follow-ups (0 = cold/unresponsive, 10 = highly interactive).
5. "sentiment": Overall tone and positivity of the communications (0 = negative/angry, 10 = highly enthusiastic).

You must return a single JSON object matching this schema. Never return markdown code blocks, never explain the output:
{
  "urgency": {"score": 9, "reason": "Requested implementation this month"},
  "budget_signal": {"score": 8, "reason": "Discussed pricing"},
  "decision_maker": {"score": 7, "reason": "VP of Operations"},
  "engagement": {"score": 9, "reason": "Requested customized proposal"},
  "sentiment": {"score": 8, "reason": "Very positive discovery call"}
}
"""

class ScoringService:
    def __init__(self, ollama_host: str = OLLAMA_HOST, model: str = OLLAMA_MODEL):
        self.host = ollama_host.rstrip("/")
        self.model = model

    def analyze_lead_signals(self, history_text: str) -> Dict[str, Any]:
        """Calls Groq to score and generate reasoning for lead factors."""
        from backend.services.groq_client import query_groq
        raw_text = query_groq(
            prompt=f"Lead History:\n{history_text}",
            system=SYSTEM_PROMPT,
            json_mode=True
        )

        # Sanitize and parse JSON
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE).strip()
        first_brace, last_brace = cleaned.find("{"), cleaned.rfind("}")
        return json.loads(cleaned[first_brace:last_brace + 1])

    def calculate_score(self, breakdown: Dict[str, Any]) -> int:
        """Calculates final score 0-100 based on factor scores and weights."""
        weighted_sum = 0.0
        for factor, weight in WEIGHTS.items():
            factor_data = breakdown.get(factor, {})
            score = float(factor_data.get("score", 0))
            weighted_sum += score * weight
        # Multiply by 10 to scale from 0-10 to 0-100
        return min(max(round(weighted_sum * 10), 0), 100)

    def determine_priority(self, score: int) -> str:
        """Determines lead priority label based on the 0-100 score."""
        if score >= 70:
            return "High"
        if score >= 40:
            return "Medium"
        return "Low"

    def score_lead(self, db: Session, lead_id: int) -> Lead:
        """Analyzes communications history, updates lead database columns, and logs activity."""
        db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not db_lead:
            raise ValueError(f"Lead with ID {lead_id} not found.")

        # Aggregate communications history text from activities
        history_elements = [f"[{a.type}]: {a.content}" for a in db_lead.activities]
        history_text = "\n".join(history_elements) or f"Lead created: {db_lead.name}."

        # Fetch signals and score
        breakdown_data = self.analyze_lead_signals(history_text)
        # Validate structure via Pydantic schema
        ScoringBreakdown(**breakdown_data)

        db_lead.score = self.calculate_score(breakdown_data)
        db_lead.priority = self.determine_priority(db_lead.score)
        db_lead.score_reasoning = json.dumps(breakdown_data)

        # Log timeline activity
        db_activity = Activity(
            lead_id=lead_id,
            type="System",
            content=f"Lead scored: {db_lead.score}/100 ({db_lead.priority} Priority)"
        )
        db.add(db_activity)
        db.commit()
        db.refresh(db_lead)
        return db_lead
