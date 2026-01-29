from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np

class EmbeddingService:
    """
    Handles text embeddings using SentenceTransformers.
    This is the foundation of our RAG system.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding model.
        
        Model: all-MiniLM-L6-v2
        - Fast and efficient (384 dimensions)
        - Good for semantic search
        - Works well on CPU
        """
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"Model loaded. Embedding dimension: {self.dimension}")
    
    def embed_text(self, text: str) -> np.ndarray:
        """
        Convert single text to embedding vector.
        
        Args:
            text: Input text string
            
        Returns:
            numpy array of embeddings
        """
        return self.model.encode(text, convert_to_numpy=True)
    
    def embed_batch(self, texts: List[str]) -> np.ndarray:
        """
        Convert multiple texts to embeddings (more efficient).
        
        Args:
            texts: List of text strings
            
        Returns:
            numpy array of embeddings (batch_size x embedding_dim)
        """
        return self.model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
    
    def get_dimension(self) -> int:
        """Return the embedding dimension."""
        return self.dimension

# Global instance (singleton pattern)
_embedding_service = None

def get_embedding_service(model_name: str = "all-MiniLM-L6-v2") -> EmbeddingService:
    """
    Get or create the global embedding service instance.
    This ensures we only load the model once.
    """
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService(model_name)
    return _embedding_service
