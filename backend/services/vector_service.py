import os
import json
from typing import List

CHROMA_PATH = "beonix_data/chroma"
MOCK_DB_PATH = "beonix_data/chroma_mock.json"

class VectorService:
    def __init__(self, chroma_path: str = CHROMA_PATH):
        self.path = chroma_path
        self.use_mock = False
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        try:
            import chromadb
            # Initialize persistent local directory database client
            self.client = chromadb.PersistentClient(path=self.path)
            self.collection = self.client.get_or_create_collection("company_docs")
        except Exception as err:
            print(f"ChromaDB uninitialized ({err}). falling back to mock JSON database.")
            self.use_mock = True

    def store_chunks(self, document_id: int, filename: str, chunks: List[str], embeddings: List[List[float]]) -> None:
        """Stores chunk texts, embeddings, and metadata in the vector database."""
        ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {"document_id": document_id, "filename": filename, "chunk_index": i}
            for i in range(len(chunks))
        ]

        if self.use_mock:
            self._store_chunks_mock(ids, chunks, embeddings, metadatas)
            return

        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=chunks
        )

    def _store_chunks_mock(self, ids: List[str], chunks: List[str], embeddings: List[List[float]], metadatas: List[dict]) -> None:
        """Saves vectors to a local JSON mock database."""
        mock_db = {}
        if os.path.exists(MOCK_DB_PATH):
            with open(MOCK_DB_PATH, "r") as f:
                try:
                    mock_db = json.load(f)
                except Exception:
                    pass
        for i, text in enumerate(chunks):
            mock_db[ids[i]] = {
                "metadata": metadatas[i],
                "content": text,
                "embedding": embeddings[i]
            }
        with open(MOCK_DB_PATH, "w") as f:
            json.dump(mock_db, f)

    def delete_document_vectors(self, document_id: int) -> None:
        """Deletes all indexed vectors belonging to a specific document ID."""
        if self.use_mock:
            if not os.path.exists(MOCK_DB_PATH):
                return
            with open(MOCK_DB_PATH, "r") as f:
                try:
                    mock_db = json.load(f)
                except Exception:
                    return
            # Delete keys belonging to document_id
            filtered = {k: v for k, v in mock_db.items() if v.get("metadata", {}).get("document_id") != document_id}
            with open(MOCK_DB_PATH, "w") as f:
                json.dump(filtered, f)
            return

        self.collection.delete(where={"document_id": document_id})
