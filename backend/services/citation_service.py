class CitationService:
    @staticmethod
    def get_confidence_label(score: float) -> str:
        """Determines the confidence label based on the similarity score."""
        if score >= 0.80:
            return "High"
        elif score >= 0.50:
            return "Medium"
        else:
            return "Low"

    @staticmethod
    def aggregate_sources(retrieved_chunks: list[dict]) -> list[dict]:
        """Cleans and extracts sources and chunk indices from search results."""
        seen = set()
        citations = []
        for chunk in retrieved_chunks:
            key = (chunk["document"], chunk["chunk"])
            if key not in seen:
                seen.add(key)
                citations.append({
                    "document": chunk["document"],
                    "chunk": chunk["chunk"],
                    "score": chunk["score"]
                })
        return citations
