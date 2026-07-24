import json
import re
from sqlalchemy.orm import Session
from backend.models.lead import Lead
from backend.models.draft_email import DraftEmail
from backend.services.groq_client import query_groq

class EmailGeneratorService:
    @staticmethod
    def generate_personalized_email(db: Session, lead_id: int) -> dict:
        """
        Queries Groq to write a hyper-personalized email subject and body based on the Lead Preparation Planner details.
        """
        lead = db.query(Lead).filter(Lead.id == lead_id).first()
        if not lead:
            raise ValueError(f"Lead with ID {lead_id} not found.")

        # Read prep planner details
        prep_notes = lead.manual_review or "No notes provided in preparation planner."
        talking_points_raw = lead.talking_points or "[]"
        
        try:
            talking_points = json.loads(talking_points_raw)
        except Exception:
            talking_points = []

        talking_points_str = "\n".join([f"- {tp}" for tp in talking_points]) if talking_points else "- Introduce Beonix OS and custom services."

        system_prompt = """You are an elite, non-spammy sales copywriter at Beonix. You write highly engaging, custom, personalized cold outreach emails.
You MUST write the email based on the rep's manual notes and talking points.
Do NOT use generic greeting placeholders or robotic language. Keep it direct, human, and professional.

You MUST return ONLY a valid JSON object matching this structure exactly:
{
  "subject": "...",
  "body": "..."
}
Do not write markdown backticks or extra text outside the JSON. Ensure the JSON is valid and escape double quotes in string values properly."""

        user_prompt = f"""Lead Information:
Name: {lead.name}
Company: {lead.company or 'Their Organization'}
Email: {lead.email}

Sales Representative Notes (Lead Preparation Planner):
{prep_notes}

Talking Points / Topics to cover:
{talking_points_str}

Please generate the subject line and email body."""

        try:
            raw_output = query_groq(prompt=user_prompt, system=system_prompt, json_mode=True)
            cleaned = raw_output.strip()
            
            # Strip markdown code blocks if any
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE).strip()
            
            # Find JSON boundaries
            first_brace = cleaned.find("{")
            last_brace = cleaned.rfind("}")
            if first_brace != -1 and last_brace != -1:
                cleaned = cleaned[first_brace:last_brace + 1]

            data = json.loads(cleaned)
            subject = data.get("subject", "").strip()
            body = data.get("body", "").strip()
            
            if subject and body:
                return {"subject": subject, "body": body}
        except Exception as e:
            print(f"Failed to generate outreach email with Groq: {e}. Falling back to template.")

        # Fallback template
        company_name = lead.company or "your organization"
        subject = f"Beonix partnership / re-engaging {company_name}"
        body = f"""Hi {lead.name},

I noticed your team at {company_name} is scaling operations. Based on your profile, I wanted to reach out regarding Beonix OS.

Specifically, I understand your team might be facing custom data pipeline bottlenecks. We've built custom connectors that help scale ingest operations.

Would you be open to a quick 10-minute introduction call next Tuesday to see how we can assist?

Best regards,
Beonix Sales Team"""

        return {"subject": subject, "body": body}

    @staticmethod
    def analyze_response(reply_text: str, original_subject: str) -> dict:
        """
        Uses Groq to analyze a customer reply. Determines sentiment, score delta, next stage, and follow-up suggestion.
        """
        system_prompt = """You are an AI Sales Coordinator. Analyze this incoming email response from a prospect.
Categorize the reply into one of three sentiments:
1. 'positive' (interested, wants a meeting, wants a demo, asks for price/details)
2. 'neutral' (out of office, asked to follow up later, forwarded to someone else)
3. 'negative' (not interested, unsubscribe, rude refusal)

Map the sentiment to:
- next_stage:
  - If positive: 'Qualified' or 'Proposal'
  - If neutral: 'Contacted'
  - If negative: 'Closed' (meaning won't pursue)
- score_delta:
  - If positive: +20
  - If neutral: 0
  - If negative: -15
- followup_title: Suggest a brief follow-up task title (e.g., 'Schedule Demo Call' or 'Re-engage in 30 days' or 'Archive Lead').
- followup_desc: Suggest a brief task description.

You MUST return ONLY a valid JSON object matching this structure exactly:
{
  "sentiment": "positive/neutral/negative",
  "next_stage": "Qualified/Proposal/Contacted/Closed",
  "score_delta": 20,
  "followup_title": "...",
  "followup_desc": "..."
}
Do not write markdown backticks or extra text outside the JSON."""

        user_prompt = f"""Original Email Subject: {original_subject}
Prospect's Response:
"{reply_text}"

Please analyze and return the JSON evaluation."""

        try:
            raw_output = query_groq(prompt=user_prompt, system=system_prompt, json_mode=True)
            cleaned = raw_output.strip()
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE).strip()
            first_brace = cleaned.find("{")
            last_brace = cleaned.rfind("}")
            if first_brace != -1 and last_brace != -1:
                cleaned = cleaned[first_brace:last_brace + 1]

            data = json.loads(cleaned)
            return {
                "sentiment": data.get("sentiment", "neutral").lower(),
                "next_stage": data.get("next_stage", "Contacted"),
                "score_delta": int(data.get("score_delta", 0)),
                "followup_title": data.get("followup_title", "Follow up on email"),
                "followup_desc": data.get("followup_desc", "Re-evaluate prospect's reply.")
            }
        except Exception as e:
            print(f"Failed to analyze reply sentiment with Groq: {e}. Falling back to default values.")

        # Default fallback
        lower_reply = reply_text.lower()
        if "interested" in lower_reply or "call" in lower_reply or "meeting" in lower_reply or "demo" in lower_reply:
            return {
                "sentiment": "positive",
                "next_stage": "Qualified",
                "score_delta": 20,
                "followup_title": "Schedule Demo Call",
                "followup_desc": "Prospect responded positively. Set up a meeting link."
            }
        elif "no" in lower_reply or "remove" in lower_reply or "stop" in lower_reply or "not interested" in lower_reply:
            return {
                "sentiment": "negative",
                "next_stage": "Closed",
                "score_delta": -15,
                "followup_title": "Archive Lead",
                "followup_desc": "Prospect is not interested. Mark lead as lost."
            }
        else:
            return {
                "sentiment": "neutral",
                "next_stage": "Contacted",
                "score_delta": 0,
                "followup_title": "Re-check in 2 weeks",
                "followup_desc": "Prospect sent a neutral or out-of-office response."
            }

    @staticmethod
    def refine_email_draft(db: Session, email_id: int, prompt_instruction: str) -> dict:
        """
        Uses Groq to refine an email subject and body based on user instructions.
        """
        draft = db.query(DraftEmail).filter(DraftEmail.id == email_id).first()
        if not draft:
            raise ValueError("Draft email not found.")

        system_prompt = """You are an elite sales copywriter. You edit and refine email drafts based on specific directions.
You will be given the current Subject, current Body, and user revision instructions.
You MUST follow the instructions exactly, improving clarity and persuasive power.
Return ONLY a valid JSON object matching this structure:
{
  "subject": "...",
  "body": "..."
}
Do not write markdown backticks or extra text outside the JSON."""

        user_prompt = f"""Current Email Subject: {draft.subject}
Current Email Body:
{draft.body}

User Revision Instructions:
"{prompt_instruction}"

Please rewrite and refine the draft."""

        try:
            raw_output = query_groq(prompt=user_prompt, system=system_prompt, json_mode=True)
            cleaned = raw_output.strip()
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE).strip()
            first_brace = cleaned.find("{")
            last_brace = cleaned.rfind("}")
            if first_brace != -1 and last_brace != -1:
                cleaned = cleaned[first_brace:last_brace + 1]

            data = json.loads(cleaned)
            subject = data.get("subject", "").strip()
            body = data.get("body", "").strip()
            if subject and body:
                draft.subject = subject
                draft.body = body
                db.add(draft)
                db.commit()
                db.refresh(draft)
                return {"subject": subject, "body": body}
        except Exception as e:
            print(f"Failed to refine draft email with Groq: {e}")
            raise e
        return {"subject": draft.subject, "body": draft.body}
