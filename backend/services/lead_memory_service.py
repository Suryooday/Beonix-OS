import os
import json
from datetime import datetime, timezone
from backend.services.embedding_service import EmbeddingService
from backend.services.vector_service import CHROMA_PATH

LEAD_MOCK_DB_PATH = "beonix_data/lead_memory_mock.json"

class LeadMemoryService:
    def __init__(self, chroma_path: str = CHROMA_PATH):
        self.path = chroma_path
        self.use_mock = False
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        try:
            import chromadb
            # Initialize persistent local Chroma client
            self.client = chromadb.PersistentClient(path=self.path)
            self.collection = self.client.get_or_create_collection("lead_memory")
        except Exception as err:
            print(f"ChromaDB uninitialized for LeadMemory ({err}). falling back to mock JSON.")
            self.use_mock = True

    def _store_in_chroma(self, lead_id: int, content: str, metadata: dict) -> None:
        """Helper to compute embeddings and index in Chroma or mock JSON DB."""
        timestamp_float = datetime.now(timezone.utc).timestamp()
        record_id = f"lead_{lead_id}_{metadata['source_type']}_{timestamp_float}"
        
        try:
            vector = EmbeddingService().generate_embedding(content)
        except Exception as err:
            print(f"Embedding generation failed: {err}. Using default vector.")
            vector = [0.1] * 384

        # Filter out None values from metadata dictionary
        clean_meta = {k: v for k, v in metadata.items() if v is not None}

        if self.use_mock:
            self._store_mock(record_id, content, vector, clean_meta)
            return

        try:
            self.collection.add(
                ids=[record_id],
                embeddings=[vector],
                metadatas=[clean_meta],
                documents=[content]
            )
        except Exception as err:
            print(f"ChromaDB add failed: {err}. Falling back to local JSON mock.")
            self._store_mock(record_id, content, vector, clean_meta)

    def _store_mock(self, record_id: str, content: str, vector: list[float], metadata: dict) -> None:
        """Saves a memory record to a local JSON file."""
        mock_db = {}
        if os.path.exists(LEAD_MOCK_DB_PATH):
            with open(LEAD_MOCK_DB_PATH, "r") as f:
                try:
                    mock_db = json.load(f)
                except Exception:
                    pass
        mock_db[record_id] = {
            "metadata": metadata,
            "content": content,
            "embedding": vector
        }
        with open(LEAD_MOCK_DB_PATH, "w") as f:
            json.dump(mock_db, f)

    def store_activity_memory(self, lead_id: int, activity_id: int, content: str, source_type: str, timestamp: str) -> None:
        """Indexes an activity interaction memory."""
        metadata = {
            "lead_id": lead_id,
            "activity_id": activity_id,
            "source_type": source_type,
            "timestamp": timestamp
        }
        self._store_in_chroma(lead_id, content, metadata)

    def store_call_memory(self, lead_id: int, filename: str, transcript: str, timestamp: str) -> None:
        """Indexes a transcript voice call memory."""
        metadata = {
            "lead_id": lead_id,
            "activity_id": None,
            "source_type": "call",
            "timestamp": timestamp,
            "filename": filename
        }
        self._store_in_chroma(lead_id, f"Call Recording ({filename}): {transcript}", metadata)

    def store_email_memory(self, lead_id: int, body: str, timestamp: str) -> None:
        """Indexes an email interaction memory."""
        metadata = {
            "lead_id": lead_id,
            "activity_id": None,
            "source_type": "email",
            "timestamp": timestamp
        }
        self._store_in_chroma(lead_id, f"Email Interaction: {body}", metadata)

    def store_summary_memory(self, lead_id: int, summary: str, timestamp: str) -> None:
        """Indexes a lead context profile summary memory."""
        metadata = {
            "lead_id": lead_id,
            "activity_id": None,
            "source_type": "summary",
            "timestamp": timestamp
        }
        self._store_in_chroma(lead_id, f"Lead profile summary: {summary}", metadata)
