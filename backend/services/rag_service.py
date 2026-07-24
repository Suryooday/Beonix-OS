import os
import httpx
from sqlalchemy.orm import Session

from backend.services.retrieval_service import RetrievalService
from backend.services.prompt_service import PromptService
from backend.services.citation_service import CitationService

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1")

class RAGService:
    def __init__(self, host: str = OLLAMA_HOST, model: str = OLLAMA_MODEL):
        self.host = host.rstrip("/")
        self.model = model

    def _call_ollama(self, system_prompt: str, user_prompt: str) -> str:
        """Calls Groq Cloud API to generate answers."""
        from backend.services.groq_client import query_groq
        return query_groq(
            prompt=user_prompt,
            system=system_prompt
        )

    def _fallback_generate(self, question: str, chunks: list[dict]) -> str:
        """Generates a text summary from matching chunks if Ollama is unreachable."""
        if not chunks:
            return "I could not find this information in the uploaded documents."

        q_lower = question.lower()
        topic = "the requested topic"
        if "onboarding" in q_lower:
            topic = "the employee onboarding process"
        elif "refund" in q_lower:
            topic = "the refund policy"
        elif "sales" in q_lower:
            topic = "the sales SOP and pipeline steps"
        elif "compliance" in q_lower:
            topic = "compliance guidelines and deadlines"

        main_content = chunks[0]["content"]
        cleaned = " ".join([line.strip() for line in main_content.split("\n") if line.strip()])
        if len(cleaned) > 280:
            cleaned = cleaned[:280] + "..."

        return (
            f"Based on the company document ({chunks[0]['document']}), regarding {topic}: "
            f"\"{cleaned}\" "
            f"Please refer to the referenced document chunk details for full guidelines."
        )

    def generate_answer(self, question: str, db: Session) -> dict:
        """Retrieves relevant chunks, formats prompts, queries LLM, and formats citations."""
        chunks = RetrievalService().search_documents(question, db)
        if not chunks:
            return {
                "answer": "I could not find this information in the company knowledge base.",
                "sources": []
            }

        sys_prompt = PromptService.get_system_prompt()
        user_prompt = PromptService.get_user_prompt(question, [c["content"] for c in chunks])
        sources = CitationService.aggregate_sources(chunks)

        try:
            answer = self._call_ollama(sys_prompt, user_prompt)
            if not answer.strip():
                raise ValueError("Empty response received from LLM")
        except Exception as err:
            print(f"Ollama connection error: {err}. falling back to synthesis.")
            answer = self._fallback_generate(question, chunks)

        return {
            "answer": answer,
            "sources": sources
        }
