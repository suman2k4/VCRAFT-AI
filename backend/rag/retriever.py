from typing import List
from .embeddings import get_embedding_service
from .vector_store import get_vector_store
import os
from pathlib import Path

class RAGRetriever:
    """
    Retrieval-Augmented Generation (RAG) Retriever.
    
    This is the core RAG component that:
    1. Takes a query (e.g., user's pitch)
    2. Retrieves relevant VC knowledge from vector store
    3. Returns context to inject into LLM prompts
    
    WHY RAG?
    - LLMs hallucinate without grounding
    - RAG retrieves REAL knowledge before generation
    - Ensures advice is based on actual VC principles
    """
    
    def __init__(self):
        self.embedding_service = get_embedding_service()
        self.vector_store = get_vector_store(self.embedding_service.get_dimension())
        self.initialized = False
    
    def initialize_knowledge_base(self, knowledge_base_path: str):
        """
        Load and index VC knowledge documents.
        
        This should be called once at startup.
        
        Args:
            knowledge_base_path: Directory containing VC knowledge files
        """
        if self.initialized:
            print("Knowledge base already initialized")
            return
        
        print(f"Initializing knowledge base from: {knowledge_base_path}")
        
        # Load all text files from knowledge base
        kb_path = Path(knowledge_base_path)
        if not kb_path.exists():
            print(f"WARNING: Knowledge base not found at {knowledge_base_path}")
            print("Creating empty knowledge base. Please add documents.")
            kb_path.mkdir(parents=True, exist_ok=True)
            return
        
        documents = []
        for file_path in kb_path.glob("*.txt"):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Chunk the document (simple approach: split by paragraphs)
                chunks = self._chunk_text(content, chunk_size=500, overlap=50)
                documents.extend(chunks)
                print(f"Loaded {len(chunks)} chunks from {file_path.name}")
        
        if len(documents) == 0:
            print("WARNING: No documents found in knowledge base")
            return
        
        # Generate embeddings for all documents
        print(f"Generating embeddings for {len(documents)} chunks...")
        embeddings = self.embedding_service.embed_batch(documents)
        
        # Add to vector store
        self.vector_store.add_documents(embeddings, documents)
        
        self.initialized = True
        print(f"Knowledge base initialized with {len(documents)} chunks")
    
    def retrieve(self, query: str, top_k: int = 5) -> List[str]:
        """
        Retrieve top-k most relevant documents for a query.
        
        This is the CORE RAG operation.
        
        Args:
            query: User's query (e.g., their pitch idea)
            top_k: Number of relevant chunks to retrieve
            
        Returns:
            List of relevant text chunks from VC knowledge
        """
        if not self.initialized or self.vector_store.size() == 0:
            print("WARNING: Knowledge base not initialized. Returning empty context.")
            return []
        
        # Convert query to embedding
        query_embedding = self.embedding_service.embed_text(query)
        
        # Search vector store
        documents, scores = self.vector_store.search(query_embedding, k=top_k)
        
        print(f"Retrieved {len(documents)} documents with scores: {[f'{s:.3f}' for s in scores]}")
        
        return documents
    
    def retrieve_with_context(self, query: str, context_prefix: str = "", top_k: int = 5) -> str:
        """
        Retrieve documents and format as context string for LLM prompt.
        
        Args:
            query: User's query
            context_prefix: Optional prefix for the context
            top_k: Number of documents to retrieve
            
        Returns:
            Formatted context string ready for LLM prompt injection
        """
        documents = self.retrieve(query, top_k)
        
        if len(documents) == 0:
            return "Insufficient data in knowledge base."
        
        # Format retrieved documents
        context = context_prefix + "\n\n" if context_prefix else ""
        context += "RELEVANT VC KNOWLEDGE:\n"
        context += "=" * 50 + "\n\n"
        
        for i, doc in enumerate(documents, 1):
            context += f"[Source {i}]\n{doc}\n\n"
        
        context += "=" * 50 + "\n"
        context += "USE ONLY THE ABOVE KNOWLEDGE TO ANSWER. DO NOT HALLUCINATE.\n"
        
        return context
    
    def _chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """
        Split text into overlapping chunks.
        
        Overlap ensures context isn't lost at chunk boundaries.
        
        Args:
            text: Input text
            chunk_size: Target characters per chunk
            overlap: Overlapping characters between chunks
            
        Returns:
            List of text chunks
        """
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    def save_index(self, path: str):
        """Save the vector store to disk."""
        self.vector_store.save(path)
    
    def load_index(self, path: str):
        """Load the vector store from disk."""
        self.vector_store.load(path)
        self.initialized = True

# Global instance
_rag_retriever = None

def get_rag_retriever() -> RAGRetriever:
    """Get or create global RAG retriever instance."""
    global _rag_retriever
    if _rag_retriever is None:
        _rag_retriever = RAGRetriever()
    return _rag_retriever
