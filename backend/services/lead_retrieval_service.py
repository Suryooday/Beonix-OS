from sqlalchemy.orm import Session
from backend.models.activity import Activity
from backend.services.lead_memory_service import LeadMemoryService
from backend.services.embedding_service import EmbeddingService

class LeadRetrievalService:
    def _fallback_lead_keyword_search(self, lead_id: int, query: str, db: Session) -> list[dict]:
        """Filters SQLite activities and transcripts by lead_id and ranks by term matching."""
        query_words = [word.lower() for word in query.split() if len(word) > 2]
        
        # Pull activities
        activities = db.query(Activity).filter(Activity.lead_id == lead_id).all()
        # Pull transcripts
        from backend.models.transcript import Transcript
        transcripts = db.query(Transcript).filter(Transcript.lead_id == lead_id).all()
        
        results = []
        for act in activities:
            text = act.content.lower()
            matches = sum(1 for w in query_words if w in text) if query_words else 1
            if matches > 0 or not query_words:
                score = min(0.95, 0.40 + (matches * 0.10))
                results.append({
                    "content": act.content,
                    "score": score,
                    "type": act.type or "activity",
                    "date": act.timestamp.strftime("%Y-%m-%d") if act.timestamp else ""
                })
        for t in transcripts:
            text = t.transcript_text.lower()
            matches = sum(1 for w in query_words if w in text) if query_words else 1
            if matches > 0 or not query_words:
                score = min(0.95, 0.45 + (matches * 0.10))
                results.append({
                    "content": f"Transcript ({t.filename}): {t.transcript_text}",
                    "score": score,
                    "type": "call",
                    "date": t.created_at.strftime("%Y-%m-%d") if t.created_at else ""
                })
                
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:5]

    def retrieve_lead_context(self, lead_id: int, query: str, db: Session) -> list[dict]:
        """Queries the lead_memory collection with a metadata filter scoping results strictly to lead_id."""
        memory_service = LeadMemoryService()
        if memory_service.use_mock:
            return self._fallback_lead_keyword_search(lead_id, query, db)

        try:
            query_vector = EmbeddingService().generate_embedding(query)
            results = memory_service.collection.query(
                query_embeddings=[query_vector],
                n_results=5,
                where={"lead_id": lead_id}  # STRICT tenant scoping
            )

            if not results or not results["documents"] or not results["documents"][0]:
                return []

            formatted = []
            docs = results["documents"][0]
            metadatas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.5] * len(docs)

            for idx, content in enumerate(docs):
                dist = distances[idx]
                # Convert L2 distance to similarity score in [0, 1]
                score = 1.0 / (1.0 + dist)
                if score < 0.15:
                    continue
                meta = metadatas[idx]
                formatted.append({
                    "content": content,
                    "score": round(score, 3),
                    "type": meta.get("source_type", "activity"),
                    "date": meta.get("timestamp", "")[:10]
                })
            return formatted
        except Exception as err:
            print(f"Lead Retrieval query failed: {err}. falling back to SQL search.")
            return self._fallback_lead_keyword_search(lead_id, query, db)
