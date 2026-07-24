class PromptService:
    @staticmethod
    def get_system_prompt() -> str:
        """Returns the system prompt enforcing context-only answers."""
        return (
            "You are Beonix Memory, an intelligent company assistant. "
            "Your task is to answer the user's questions utilizing ONLY the provided context "
            "extracted from uploaded company documents.\n\n"
            "Strict Constraints:\n"
            "1. Answer ONLY using the provided context. Never use external or prior training knowledge.\n"
            "2. If the context does not contain enough information to answer, respond exactly: "
            "\"I could not find this information in the uploaded documents.\"\n"
            "3. Do not invent, speculate, or fabricate any facts or answers.\n"
            "4. Maintain a clean, professional, and helpful tone."
        )

    @staticmethod
    def get_user_prompt(question: str, context_chunks: list[str]) -> str:
        """Assembles context chunks and the user's question into a template."""
        context_str = ""
        for idx, text in enumerate(context_chunks):
            context_str += f"[Context Segment {idx+1}]\n{text}\n\n"

        return (
            f"Here is the context extracted from company documents:\n\n"
            f"{context_str}"
            f"User Question: {question}\n\n"
            f"Provide your answer below, strictly following Beonix Memory constraints:"
        )
