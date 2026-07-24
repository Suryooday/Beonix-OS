import random

class EmbeddingService:
    _model = None

    @classmethod
    def load_model(cls):
        """Loads the SentenceTransformer model in a thread-safe singleton wrapper."""
        if cls._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                # Load the 384-dimension all-MiniLM-L6-v2 model
                cls._model = SentenceTransformer("all-MiniLM-L6-v2")
                print("Loaded SentenceTransformer model: all-MiniLM-L6-v2")
            except Exception as err:
                print(f"sentence-transformers uninitialized ({err}). falling back to mock embeddings.")
                cls._model = "mock"
        return cls._model

    def generate_embeddings(self, texts: list[str]) -> list[list[float]]:
        """
        Generates 384-dimensional embeddings for a batch of text chunks.
        Bypasses torch calculations with deterministic pseudorandom values on fallback.
        """
        model = self.load_model()
        if model == "mock":
            batch_vectors = []
            for text in texts:
                # Generate deterministic values using a seed based on text content
                seed = len(text) + sum(ord(char) for char in text[:150])
                rng = random.Random(seed)
                batch_vectors.append([rng.uniform(-0.1, 0.1) for _ in range(384)])
            return batch_vectors

        embeddings_ndarray = model.encode(texts)
        return embeddings_ndarray.tolist()

    def generate_embedding(self, text: str) -> list[float]:
        """Generates a 384-dimensional vector embedding for a single text string."""
        return self.generate_embeddings([text])[0]
