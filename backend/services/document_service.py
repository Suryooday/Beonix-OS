import os
from sqlalchemy.orm import Session

from backend.models.document import Document, DocumentChunk
from backend.models.activity import Activity
from backend.services.parser_service import ParserService
from backend.services.chunking_service import ChunkingService
from backend.services.embedding_service import EmbeddingService
from backend.services.vector_service import VectorService

class DocumentService:
    def _create_initial_record(self, db: Session, filename: str, file_path: str) -> Document:
        """Saves a pending Document record in the database."""
        doc_type = os.path.splitext(filename.lower())[1].lstrip(".")
        db_doc = Document(
            filename=filename,
            document_type=doc_type,
            file_size=os.path.getsize(file_path),
            processing_status="pending"
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        return db_doc

    def _log_mem_activity(self, db: Session, content: str) -> None:
        """Logs a timeline event activity under type 'Memory'."""
        act = Activity(type="Memory", content=content)
        db.add(act)
        db.commit()

    def _save_chunks_to_db(self, db: Session, doc_id: int, chunks: list[str]) -> None:
        """Saves text chunk segments to the SQLite DocumentChunk table."""
        for idx, text in enumerate(chunks):
            db.add(DocumentChunk(document_id=doc_id, chunk_index=idx, content=text))
        db.commit()

    def ingest_document(self, db: Session, file_path: str, filename: str) -> Document:
        """Coordinates the end-to-end document parsing, embedding, and vector indexing pipeline."""
        db_doc = self._create_initial_record(db, filename, file_path)
        self._log_mem_activity(db, f"Document Uploaded: {filename}")

        try:
            db_doc.processing_status = "processing"
            db.commit()

            # 1. Parse document text
            text = ParserService().extract_text(file_path)
            
            # 2. Segment text into chunks
            chunks = ChunkingService().split_into_chunks(text)
            self._log_mem_activity(db, f"Document Processed: {filename}")

            # 3. Calculate embeddings
            embeddings = EmbeddingService().generate_embeddings(chunks)
            self._log_mem_activity(db, f"Embeddings Created for: {filename}")

            # 4. Save to ChromaDB
            VectorService().store_chunks(db_doc.id, filename, chunks, embeddings)
            self._log_mem_activity(db, f"Stored In Vector Database: {filename}")

            # 5. Commit chunks & finalize status
            self._save_chunks_to_db(db, db_doc.id, chunks)
            db_doc.chunk_count = len(chunks)
            db_doc.processing_status = "completed"
            db.commit()
        except Exception as err:
            db_doc.processing_status = "failed"
            db.commit()
            self._log_mem_activity(db, f"Ingestion failed for {filename}: {err}")
            raise err
        return db_doc
