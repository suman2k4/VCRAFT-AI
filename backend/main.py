from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from api.deck_routes import router as deck_router
from config.settings import get_settings
import logging
import time
import os
from collections import defaultdict

# Configure logging FIRST - visible immediately
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()

app = FastAPI(
    title="VCRAFT AI API",
    description="AI-powered pitch deck analysis with RAG and persona-aware feedback",
    version="1.0.0"
)

# CORS Configuration - allow localhost for dev + deployed frontend URL + ngrok
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://vcraft-ai-ten.vercel.app",
]
if settings.frontend_url:
    frontend = settings.frontend_url.rstrip("/")
    if frontend not in allowed_origins:
        allowed_origins.append(frontend)

# Allow ngrok URLs (all subdomains) and Vercel preview URLs
allowed_origin_regex = r"https://(.*\.ngrok-free\.app|.*\.vercel\.app)"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allowed_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# RATE LIMITING MIDDLEWARE
# Simple in-memory rate limiter: 30 requests per minute per IP
# =============================================================================

class RateLimitStore:
    """In-memory rate limit tracking."""
    def __init__(self):
        self.requests = defaultdict(list)  # IP -> list of timestamps
        self.max_requests = 30
        self.window_seconds = 60
    
    def is_rate_limited(self, client_ip: str) -> bool:
        now = time.time()
        # Clean old entries
        self.requests[client_ip] = [
            t for t in self.requests[client_ip] 
            if now - t < self.window_seconds
        ]
        # Remove empty IP keys to prevent unbounded growth
        if not self.requests[client_ip]:
            del self.requests[client_ip]
            return False
        # Check limit
        if len(self.requests[client_ip]) >= self.max_requests:
            return True
        self.requests[client_ip].append(now)
        return False
    
    def get_remaining(self, client_ip: str) -> int:
        now = time.time()
        self.requests[client_ip] = [
            t for t in self.requests[client_ip]
            if now - t < self.window_seconds
        ]
        if not self.requests[client_ip]:
            del self.requests[client_ip]
            return self.max_requests
        return max(0, self.max_requests - len(self.requests[client_ip]))

rate_limiter = RateLimitStore()

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting: 30 requests/minute per IP."""
    # Skip rate limiting for health checks and root
    if request.url.path in ("/", "/health", "/docs", "/openapi.json"):
        return await call_next(request)
    
    client_ip = request.client.host if request.client else "unknown"
    
    if rate_limiter.is_rate_limited(client_ip):
        logger.warning(f"[RATE-LIMIT] IP {client_ip} exceeded rate limit")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please wait a moment and try again."},
            headers={"Retry-After": "60"}
        )
    
    response = await call_next(request)
    remaining = rate_limiter.get_remaining(client_ip)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Limit"] = str(rate_limiter.max_requests)
    return response

# =============================================================================
# CRITICAL FIX: Load heavy models at STARTUP, not during requests
# This prevents hanging requests caused by lazy-loading SentenceTransformer
# =============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Pre-load all heavy resources at startup.
    
    WHY: Loading SentenceTransformer (90MB model) during a request causes:
    - 30+ second delays
    - Apparent "hanging" 
    - Timeout issues
    
    SOLUTION: Load everything ONCE at startup, reuse for all requests
    """
    logger.info("=" * 70)
    logger.info("VCRAFT AI BACKEND - STARTUP INITIALIZATION")
    logger.info("=" * 70)
    
    try:
        # STEP 1: Validate environment variables EARLY
        logger.info("[STARTUP] Step 1: Validating environment configuration...")
        if settings.llm_provider == "gemini" and not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not set in environment variables")
        elif settings.llm_provider == "openai" and not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY not set in environment variables")
        logger.info(f"[STARTUP] ✓ Environment validated. Provider: {settings.llm_provider}")
        
        # STEP 2: Pre-load SentenceTransformer model (HEAVY - 90MB download + loading)
        logger.info("[STARTUP] Step 2: Pre-loading SentenceTransformer model...")
        logger.info("[STARTUP] This may take 10-30 seconds on first run...")
        from rag.embeddings import get_embedding_service
        embedding_service = get_embedding_service()
        logger.info(f"[STARTUP] ✓ SentenceTransformer loaded. Dimension: {embedding_service.get_dimension()}")
        
        # STEP 3: Initialize FAISS vector store
        logger.info("[STARTUP] Step 3: Initializing FAISS vector store...")
        from rag.vector_store import get_vector_store
        vector_store = get_vector_store(embedding_service.get_dimension())
        logger.info("[STARTUP] ✓ FAISS index initialized")
        
        # STEP 4: Load RAG knowledge base
        logger.info("[STARTUP] Step 4: Loading RAG knowledge base...")
        from rag.retriever import get_rag_retriever
        retriever = get_rag_retriever()
        knowledge_base_path = "./rag/knowledge_base"
        retriever.initialize_knowledge_base(knowledge_base_path)
        logger.info("[STARTUP] ✓ RAG knowledge base loaded")
        
        # STEP 5: Pre-initialize LLM service
        logger.info("[STARTUP] Step 5: Initializing LLM service...")
        from services.llm_service import get_llm_service
        llm_service = get_llm_service()
        logger.info(f"[STARTUP] ✓ LLM service ready: {settings.llm_provider}")
        
        # STEP 6: Initialize Firebase Admin SDK for auth verification
        logger.info("[STARTUP] Step 6: Initializing Firebase Auth...")
        from api.auth import _init_firebase
        fb_app = _init_firebase()
        if fb_app:
            logger.info("[STARTUP] ✓ Firebase Admin SDK initialized — auth verification ENABLED")
        else:
            logger.warning("[STARTUP] ⚠ Firebase Admin SDK not configured — auth verification DISABLED (dev mode)")
        
        logger.info("=" * 70)
        logger.info("✓ STARTUP COMPLETE - All models loaded and ready!")
        logger.info("✓ Backend ready to handle requests instantly")
        logger.info("=" * 70)
        
    except Exception as e:
        logger.error("=" * 70)
        logger.error(f"✗ STARTUP FAILED: {e}")
        logger.error("=" * 70)
        logger.error("Backend will NOT work properly. Fix the error and restart.")
        # Don't raise - let the app start so we can see health endpoint
        # But log prominently that it's broken

# Include routers
app.include_router(router)
app.include_router(deck_router)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

@app.get("/")
async def root():
    return {
        "message": "VCRAFT AI API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.environment
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.environment == "development"
    )
