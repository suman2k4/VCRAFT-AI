"""
Startup script to initialize the RAG system.

Run this once before starting the server to:
1. Load VC knowledge documents
2. Generate embeddings
3. Build FAISS index
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rag.retriever import get_rag_retriever
from config.settings import get_settings

def initialize_rag():
    """Initialize the RAG system with VC knowledge."""
    print("=" * 60)
    print("VCRAFT AI - RAG Initialization")
    print("=" * 60)
    
    settings = get_settings()
    retriever = get_rag_retriever()
    
    print("\nInitializing knowledge base...")
    retriever.initialize_knowledge_base(settings.knowledge_base_path)
    
    print("\nSaving FAISS index...")
    retriever.save_index(settings.faiss_index_path)
    
    print("\n" + "=" * 60)
    print("RAG initialization complete!")
    print("=" * 60)
    print("\nYou can now start the FastAPI server.")

if __name__ == "__main__":
    initialize_rag()
