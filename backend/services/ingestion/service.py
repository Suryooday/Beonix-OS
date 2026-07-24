import json
import re
import os
from typing import Any, Dict, List
import httpx

from backend.schemas.ingestion import IngestedLeadInfo

# Configurable Ollama API settings
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

SYSTEM_PROMPT = """You are an expert sales lead intelligence parser.
Analyze the provided communication text (which could be an email or a chat transcript) and extract lead metadata into a strict JSON format.

You must return a single JSON object containing these keys:
- "name": The full name of the person (or null if not found/identifiable).
- "company": The company name (or null if not found/identifiable).
- "summary": A concise 2-3 sentence summary of their message.
- "intent": Inferred goal (e.g., "Purchase Inquiry", "Feature request", "Pricing question", "Objection", "Spam", "Greeting").
- "objections": An array of strings representing explicit objections or hesitations they raised (e.g., pricing, timelines, integrations). Empty array if none.
- "next_steps": An array of strings describing the logical next actions to move this lead forward.

Do not include any conversational filler, introductory text, or markdown code blocks (like ```json). Return ONLY the raw JSON string.
"""

class IngestionService:
    def __init__(self, ollama_host: str = OLLAMA_HOST, model_name: str = OLLAMA_MODEL):
        self.host = ollama_host.rstrip("/")
        self.model = model_name

    def clean_llm_response(self, raw_text: str) -> str:
        """
        Sanitize raw LLM response by stripping whitespace, removing markdown code blocks,
        and extracting the JSON portion.
        """
        cleaned = raw_text.strip()
        
        # Remove markdown code fences (e.g. ```json ... ```)
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.strip()

        # Find the first occurrences of '{' and last occurrence of '}' to extract JSON block
        first_brace = cleaned.find("{")
        last_brace = cleaned.rfind("}")
        if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
            cleaned = cleaned[first_brace:last_brace + 1]

        return cleaned

    def get_fallback_info(self, text: str, error_msg: str) -> IngestedLeadInfo:
        """
        Generate a safe, structured fallback schema if LLM fails or outputs unparseable text.
        """
        # Crude regex heuristic to find email addresses in input text
        emails = re.findall(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        email_str = emails[0] if emails else "Unknown Email"

        # Heuristic to suggest a name from the email prefix
        suggested_name = email_str.split("@")[0].replace(".", " ").title() if emails else None
        
        # Create fallback lead details containing the error message and basic summaries
        return IngestedLeadInfo(
            name=suggested_name,
            company=None,
            summary=f"Raw Message [Fallback ingestion due to parsing error: {error_msg}]. Content snippet: {text[:150]}...",
            intent="Manual Review Required",
            objections=["Incomplete parsing"],
            next_steps=["Verify message contents manually", f"Reach out to {email_str} if valid"]
        )

    def ingest_text(self, text: str, source_type: str = "email") -> IngestedLeadInfo:
        """
        Call Groq Cloud API to parse email/chat text and validate the returned JSON using Pydantic.
        """
        if not text or not text.strip():
            return IngestedLeadInfo(
                name=None,
                company=None,
                summary="Empty message ingested.",
                intent="Spam",
                objections=[],
                next_steps=[]
            )

        prompt = f"Source Type: {source_type}\n\nCommunication Content:\n---\n{text}\n---\n"
        
        try:
            from backend.services.groq_client import query_groq
            raw_output = query_groq(
                prompt=prompt,
                system=SYSTEM_PROMPT,
                json_mode=True
            )
            json_string = self.clean_llm_response(raw_output)
            parsed_data = json.loads(json_string)
            return IngestedLeadInfo(**parsed_data)

        except httpx.HTTPError as e:
            error_reason = f"Groq API request failed: {str(e)}"
            print(f"Error in IngestionService: {error_reason}")
            return self.get_fallback_info(text, error_reason)
            
        except json.JSONDecodeError as e:
            error_reason = f"JSON decode failed on LLM output: {str(e)}"
            print(f"Error in IngestionService: {error_reason}. Raw text: {raw_output if 'raw_output' in locals() else 'None'}")
            return self.get_fallback_info(text, error_reason)
            
        except Exception as e:
            error_reason = f"Validation or unexpected error: {str(e)}"
            print(f"Error in IngestionService: {error_reason}")
            return self.get_fallback_info(text, error_reason)
