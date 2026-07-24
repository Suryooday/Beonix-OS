import re

class ChunkingService:
    def clean_text(self, text: str) -> str:
        """Sanitizes text by stripping whitespace and removing null bytes."""
        if not text:
            return ""
        return text.replace("\x00", "").strip()

    def validate_chunk(self, chunk: str) -> bool:
        """Ensures chunk is valid and non-empty."""
        return len(chunk.strip()) > 0

    def split_into_chunks(self, text: str) -> list[str]:
        """
        Splits text into chunks of max 1000 characters with 200 character overlap,
        attempting to preserve sentence boundaries.
        """
        cleaned = self.clean_text(text)
        if not cleaned:
            return []

        sentences = re.split(r'(?<=[.!?])\s+', cleaned)
        chunks = []
        current_chunk = []
        current_length = 0

        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue

            # If a single sentence exceeds the chunk limit, slice it directly
            if len(sentence) > 1000:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))
                    current_chunk, current_length = [], 0
                for i in range(0, len(sentence), 800):
                    chunks.append(sentence[i:i+1000])
                continue

            # If adding this sentence exceeds the limit, package current chunk and slide overlap
            if current_length + len(sentence) + 1 > 1000:
                chunk_str = " ".join(current_chunk)
                if self.validate_chunk(chunk_str):
                    chunks.append(chunk_str)

                # Assemble overlap sentences (backtrack up to ~200 chars)
                overlap_chunk = []
                overlap_len = 0
                for sent in reversed(current_chunk):
                    if overlap_len + len(sent) + 1 <= 200:
                        overlap_chunk.insert(0, sent)
                        overlap_len += len(sent) + 1
                    else:
                        break
                current_chunk = overlap_chunk
                current_length = overlap_len

            current_chunk.append(sentence)
            current_length += len(sentence) + 1

        if current_chunk:
            chunk_str = " ".join(current_chunk)
            if self.validate_chunk(chunk_str):
                chunks.append(chunk_str)

        return chunks
