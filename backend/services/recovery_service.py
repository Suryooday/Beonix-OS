import os
import json
import httpx
from sqlalchemy.orm import Session
from backend.models.recovery import RecoveryCase
from backend.models.lead import Lead
from backend.services.risk_service import RiskService
from backend.services.lead_chat_service import OLLAMA_HOST, OLLAMA_MODEL

class RecoveryService:
    def __init__(self):
        self.risk_service = RiskService()

    def _generate_strategy(self, lead: Lead, reason: str) -> dict:
        """Helper to invoke Groq LLM analysis for risk status."""
        from backend.services.groq_client import query_groq
        system_content = (
            "You are a sales recovery assistant. Analyze this stalled lead.\n"
            "Return ONLY a JSON matching this schema:\n"
            "{\n"
            '  "strategy": "...",\n'
            '  "actions": ["step 1", "step 2"]\n'
            "}\n"
            "Keep strategy short (1-2 sentences) and list 2 actions."
        )
        try:
            raw_output = query_groq(
                prompt=f"Customer: {lead.name}, Inactivity Trigger: {reason}",
                system=system_content,
                json_mode=True
            )
            data = json.loads(raw_output.strip())
            return {
                "strategy": data.get("strategy", f"Re-engage {lead.name} with technical overview options."),
                "actions": data.get("actions", ["Schedule timeline walkthrough", "Share integration API parameters"])
            }
        except Exception:
            return {
                "strategy": f"Schedule follow-up to address objections and review the outstanding proposal.",
                "actions": ["Schedule proposal review call", "Share fast-track implementation timelines"]
            }

    def run_recovery_scan(self, db: Session) -> list[RecoveryCase]:
        """Scans active leads, calculates risk levels, and populates the recovery queue."""
        stale_leads = self.risk_service.detect_stale_leads(db, threshold_days=14)
        cases = []
        for lead in stale_leads:
            risk_info = self.risk_service.calculate_risk(lead, db)
            
            # Prevent double-inserting cases that are already pending
            existing = db.query(RecoveryCase).filter(
                RecoveryCase.lead_id == lead.id,
                RecoveryCase.status == "pending"
            ).first()
            
            if existing:
                existing.risk_level = risk_info["risk_level"]
                existing.reason = risk_info["reason"]
                db.commit()
                cases.append(existing)
                continue

            strategy_info = self._generate_strategy(lead, risk_info["reason"])
            db_case = RecoveryCase(
                lead_id=lead.id,
                risk_level=risk_info["risk_level"],
                reason=risk_info["reason"],
                recommended_action=strategy_info["strategy"],
                status="pending"
            )
            db.add(db_case)
            db.commit()
            db.refresh(db_case)
            cases.append(db_case)
            
        return cases

    def get_recovery_queue(self, db: Session) -> list[dict]:
        """Pulls all active pending recovery cases with associated lead metadata."""
        cases = db.query(RecoveryCase).filter(RecoveryCase.status == "pending").all()
        results = []
        for case in cases:
            lead = db.query(Lead).filter(Lead.id == case.lead_id).first()
            days = self.risk_service.get_days_inactive(lead, db) if lead else 0
            results.append({
                "id": case.id,
                "lead_id": case.lead_id,
                "lead_name": lead.name if lead else "Unknown Lead",
                "risk_level": case.risk_level,
                "days_inactive": days,
                "reason": case.reason,
                "recommended_action": case.recommended_action or "Schedule re-engagement touchpoint.",
                "status": case.status,
                "created_at": case.created_at.isoformat()
            })
        return results

    def analyze_single_lead(self, lead_id: int, db: Session) -> dict:
        """Triggers live RAG risk calculations and suggests re-engagement steps."""
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            return {"risk_level": "low", "recovery_strategy": "Opportunity data not found.", "recommended_actions": []}
            
        risk_info = self.risk_service.calculate_risk(lead, db)
        strategy_info = self._generate_strategy(lead, risk_info["reason"])
        return {
            "risk_level": risk_info["risk_level"],
            "recovery_strategy": strategy_info["strategy"],
            "recommended_actions": strategy_info["actions"]
        }

    def resolve_case(self, case_id: int, status: str, db: Session) -> RecoveryCase:
        """Resolves a pending recovery case status."""
        case = db.query(RecoveryCase).filter(RecoveryCase.id == case_id).first()
        if not case:
            raise ValueError(f"Recovery case ID {case_id} not found.")
        case.status = status
        db.commit()
        db.refresh(case)
        return case
