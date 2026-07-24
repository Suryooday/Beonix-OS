from sqlalchemy.orm import Session
from backend.models.document import Document, DocumentChunk
from backend.services.embedding_service import EmbeddingService
from backend.services.vector_service import VectorService

class RetrievalService:
    def _fallback_keyword_search(self, query: str, db: Session) -> list[dict]:
        """Ranks chunks by term matching in SQLite if ChromaDB is offline."""
        query_words = [word.lower() for word in query.split() if len(word) > 2]
        if not query_words:
            return []

        chunks = db.query(DocumentChunk).all()
        results = []
        for chunk in chunks:
            text = chunk.content.lower()
            matches = sum(1 for w in query_words if w in text)
            if matches > 0:
                doc = db.query(Document).filter(Document.id == chunk.document_id).first()
                score = min(0.95, 0.35 + (matches * 0.15))
                results.append({
                    "content": chunk.content,
                    "score": score,
                    "document": doc.filename if doc else "document.txt",
                    "chunk": chunk.chunk_index
                })
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:5]

    def search_documents(self, query: str, db: Session) -> list[dict]:
        """Searches ChromaDB for the top 5 chunks and filters low confidence returns (< 0.35 similarity)."""
        vector_service = VectorService()
        if vector_service.use_mock:
            return self._fallback_keyword_search(query, db)

        try:
            query_vector = EmbeddingService().generate_embedding(query)
            results = vector_service.collection.query(
                query_embeddings=[query_vector],
                n_results=5
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
                # 1/(1+dist) works for any distance ≥ 0, dist=0 → score=1.0, dist=∞ → score=0
                score = 1.0 / (1.0 + dist)

                # Filter low-confidence results (< 0.15 similarity)
                if score < 0.15:
                    continue

                meta = metadatas[idx]
                formatted.append({
                    "content": content,
                    "score": round(score, 3),
                    "document": meta.get("filename", "unknown.txt"),
                    "chunk": meta.get("chunk_index", 0)
                })
            return formatted
        except Exception as err:
            print(f"Retrieval error: {err}. falling back to keyword search.")
            return self._fallback_keyword_search(query, db)
