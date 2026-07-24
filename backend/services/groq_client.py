import os
import httpx
from typing import List, Dict, Any, Optional

from backend.core.config import GROQ_API_KEY

GROQ_URL = os.getenv("GROQ_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

def query_groq(prompt: Optional[str] = None, system: Optional[str] = None, json_mode: bool = False, messages: Optional[List[Dict[str, Any]]] = None) -> str:
    """Queries Groq Cloud API instead of Ollama."""
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    if messages is None:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        if prompt:
            messages.append({"role": "user", "content": prompt})
    else:
        # If user passed messages, we want to make sure we inject system prompt if provided
        if system:
            messages = [{"role": "system", "content": system}] + messages

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "temperature": 0.1
    }

    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    with httpx.Client(timeout=45.0) as client:
        response = client.post(GROQ_URL, headers=headers, json=payload)
        response.raise_for_status()
        res_data = response.json()
        return res_data["choices"][0]["message"]["content"].strip()
