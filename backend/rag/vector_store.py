import faiss
import numpy as np
import pickle
import os
from typing import List, Tuple
from pathlib import Path

class VectorStore:
    """
    FAISS-based vector store for efficient similarity search.
    
    Key Concepts:
    - Uses FAISS IndexFlatL2 (exact L2 distance search)
    - Stores document chunks with their embeddings
    - Enables fast retrieval of relevant context
    """
    
    def __init__(self, dimension: int):
        """
        Initialize FAISS index.
        
        Args:
            dimension: Embedding vector dimension (e.g., 384 for MiniLM)
        """
        self.dimension = dimension
        # IndexFlatL2: Exact search using L2 distance (Euclidean)
        # Good for up to 1M vectors on CPU
        self.index = faiss.IndexFlatL2(dimension)
        self.documents = []  # Store original text chunks
        print(f"Initialized FAISS index with dimension {dimension}")
    
    def add_documents(self, embeddings: np.ndarray, documents: List[str]):
        """
        Add document embeddings to the index.
        
        Args:
            embeddings: numpy array of shape (num_docs, dimension)
            documents: List of document text chunks
        """
        if embeddings.shape[1] != self.dimension:
            raise ValueError(f"Embedding dimension mismatch. Expected {self.dimension}, got {embeddings.shape[1]}")
        
        # Add to FAISS index
        self.index.add(embeddings)
        self.documents.extend(documents)
        
        print(f"Added {len(documents)} documents. Total documents: {len(self.documents)}")
    
    def search(self, query_embedding: np.ndarray, k: int = 5) -> Tuple[List[str], List[float]]:
        """
        Search for top-k most similar documents.
        
        Args:
            query_embedding: Query vector (1 x dimension)
            k: Number of results to return
            
        Returns:
            Tuple of (documents, distances)
        """
        if len(self.documents) == 0:
            return [], []
        
        # Ensure query is 2D: (1, dimension)
        if query_embedding.ndim == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        # Search FAISS index
        # Returns: distances (L2), indices of nearest neighbors
        distances, indices = self.index.search(query_embedding, min(k, len(self.documents)))
        
        # Get corresponding documents
        results = [self.documents[idx] for idx in indices[0]]
        scores = distances[0].tolist()
        
        return results, scores
    
    def save(self, path: str):
        """
        Save index and documents to disk.
        
        Args:
            path: Directory path to save files
        """
        os.makedirs(path, exist_ok=True)
        
        # Save FAISS index
        index_path = os.path.join(path, "faiss.index")
        faiss.write_index(self.index, index_path)
        
        # Save documents
        docs_path = os.path.join(path, "documents.pkl")
        with open(docs_path, 'wb') as f:
            pickle.dump(self.documents, f)
        
        print(f"Saved vector store to {path}")
    
    def load(self, path: str):
        """
        Load index and documents from disk.
        
        Args:
            path: Directory path to load files from
        """
        index_path = os.path.join(path, "faiss.index")
        docs_path = os.path.join(path, "documents.pkl")
        
        if not os.path.exists(index_path) or not os.path.exists(docs_path):
            raise FileNotFoundError(f"Vector store not found at {path}")
        
        # Load FAISS index
        self.index = faiss.read_index(index_path)
        
        # Load documents
        with open(docs_path, 'rb') as f:
            self.documents = pickle.load(f)
        
        print(f"Loaded vector store from {path}. Total documents: {len(self.documents)}")
    
    def size(self) -> int:
        """Return number of documents in the store."""
        return len(self.documents)

# Global instance
_vector_store = None

def get_vector_store(dimension: int = 384) -> VectorStore:
    """Get or create global vector store instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore(dimension)
    return _vector_store
