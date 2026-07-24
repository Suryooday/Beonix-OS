import json
import os
import re
import httpx
from typing import Any, Dict, Optional
from pydantic import ValidationError

from backend.schemas.ingest import ExtractedLeadData

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

SYSTEM_PROMPT = """You are an AI lead extractor. You analyze business communication text and extract lead details.
You must output a single JSON object. 
Never return markdown code blocks (like ```json). Never explain your output.
If a field is unavailable or not present, return null. Keep the 'summary' under 100 words.

Return ONLY this JSON schema:
{
  "name": "full name or null",
  "email": "email address or null",
  "company": "company name or null",
  "intent": "main goal of lead or null",
  "summary": "concise overview under 100 words or null",
  "objections": ["array of objection strings, empty if none"],
  "next_steps": ["array of next step action items, empty if none"]
}
"""

class ExtractionService:
    def __init__(self, ollama_host: str = OLLAMA_HOST, model: str = OLLAMA_MODEL):
        self.host = ollama_host.rstrip("/")
        self.model = model

    def _call_ollama(self, content: str) -> str:
        """Sends HTTP request to Groq API completions endpoint."""
        from backend.services.groq_client import query_groq
        return query_groq(
            prompt=f"Text to analyze:\n{content}",
            system=SYSTEM_PROMPT,
            json_mode=True
        )

    def _parse_and_validate(self, raw_text: str) -> ExtractedLeadData:
        """Cleans markdown wrappers, parses JSON, and validates with Pydantic."""
        cleaned = raw_text.strip()
        # Clean potential markdown wrappers
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.IGNORECASE)
        
        # Find JSON boundaries
        first_brace = cleaned.find("{")
        last_brace = cleaned.rfind("}")
        if first_brace != -1 and last_brace != -1:
            cleaned = cleaned[first_brace:last_brace + 1]

        data = json.loads(cleaned)
        return ExtractedLeadData(**data)

    def extract_lead_data(self, content: str) -> ExtractedLeadData:
        """Main method that extracts lead data, retrying once on failure."""
        try:
            raw_output = self._call_ollama(content)
            return self._parse_and_validate(raw_output)
        except (httpx.HTTPError, json.JSONDecodeError, ValidationError) as err:
            print(f"Extraction failed: {err}. Retrying once...")
            # Try once more
            try:
                raw_output = self._call_ollama(content)
                return self._parse_and_validate(raw_output)
            except Exception as retry_err:
                raise ValueError(f"Ollama extraction failed after retry: {retry_err}")
