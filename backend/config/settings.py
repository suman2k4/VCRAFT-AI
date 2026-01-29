from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # LLM Configuration
    llm_provider: str = "gemini"
    gemini_api_key: str = ""
    openai_api_key: str = ""
    
    # Firebase
    firebase_credentials_path: str = ""
    
    # RAG Configuration
    embeddings_model: str = "all-MiniLM-L6-v2"
    faiss_index_path: str = "./rag/faiss_index"
    knowledge_base_path: str = "./rag/knowledge_base"
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
