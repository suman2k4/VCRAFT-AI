# VCRAFT AI - System Architecture

## 📁 Complete Folder Structure

```
VCRAFT-AI/
│
├── frontend/                      # React + Vite Frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/               # Images, icons
│   │   ├── components/           # Reusable UI components
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── SignupForm.jsx
│   │   │   ├── pitch/
│   │   │   │   ├── PitchForm.jsx
│   │   │   │   ├── AnalysisResult.jsx
│   │   │   │   └── ScoreCard.jsx
│   │   │   └── qa/
│   │   │       ├── QuestionCard.jsx
│   │   │       └── AnswerEvaluator.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Home page
│   │   │   ├── Submit.jsx        # Pitch submission
│   │   │   ├── Dashboard.jsx     # User dashboard
│   │   │   └── QASimulator.jsx   # VC Q&A
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx   # Firebase auth state
│   │   ├── services/
│   │   │   ├── api.js            # API client
│   │   │   ├── firebase.js       # Firebase config
│   │   │   └── firestore.js      # Firestore operations
│   │   ├── utils/
│   │   │   └── helpers.js        # Utility functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css             # Tailwind imports
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/                       # FastAPI Backend
│   ├── api/                      # API routes
│   │   ├── __init__.py
│   │   ├── routes.py             # Main router
│   │   ├── pitch.py              # Pitch analysis endpoints
│   │   ├── qa.py                 # Q&A simulator endpoints
│   │   └── health.py             # Health check
│   ├── services/                 # Business logic
│   │   ├── __init__.py
│   │   ├── pitch_analyzer.py    # Core analysis logic
│   │   ├── qa_simulator.py      # Q&A generation & eval
│   │   ├── llm_service.py       # LLM API wrapper
│   │   └── firestore_service.py # Database operations
│   ├── rag/                      # RAG Implementation
│   │   ├── __init__.py
│   │   ├── embeddings.py        # SentenceTransformer setup
│   │   ├── vector_store.py      # FAISS operations
│   │   ├── retriever.py         # Context retrieval
│   │   └── knowledge_base/      # VC knowledge docs
│   │       ├── yc_advice.txt
│   │       ├── sequoia_framework.txt
│   │       └── pitch_guidelines.txt
│   ├── prompts/                  # Prompt templates
│   │   ├── __init__.py
│   │   ├── personas.py          # Investor persona definitions
│   │   ├── analysis_prompts.py  # Pitch analysis prompts
│   │   └── qa_prompts.py        # Q&A prompts
│   ├── models/                   # Pydantic models
│   │   ├── __init__.py
│   │   ├── pitch.py             # Pitch request/response
│   │   ├── analysis.py          # Analysis results
│   │   └── qa.py                # Q&A models
│   ├── config/                   # Configuration
│   │   ├── __init__.py
│   │   └── settings.py          # Environment settings
│   ├── utils/                    # Utilities
│   │   ├── __init__.py
│   │   └── validators.py        # Input validation
│   ├── main.py                   # FastAPI app entry
│   ├── requirements.txt
│   └── .env.example
│
├── docs/                         # Documentation
│   ├── API_CONTRACTS.md         # API documentation
│   ├── ARCHITECTURE.md          # System design
│   └── SETUP.md                 # Setup instructions
│
└── README.md                     # Project overview
```

## 🔄 System Architecture Flow

### 1. **User Authentication Flow**
```
User → Frontend → Firebase Auth → AuthContext → Protected Routes
                                              ↓
                                        Firestore (user profile)
```

### 2. **Pitch Analysis Flow**
```
User submits pitch → Frontend (/submit)
                          ↓
                    POST /api/analyze-pitch
                          ↓
        Backend: PitchAnalyzer Service
                ↓                    ↓
        RAG Retriever          Persona Selection
                ↓                    ↓
        FAISS Vector Store    Prompt Template
                ↓                    ↓
        Retrieved Context --------→ LLM Service
                                     ↓
                            JSON Response Parser
                                     ↓
                            Firestore Storage
                                     ↓
                          Frontend Dashboard
```

### 3. **RAG Pipeline**
```
Knowledge Base Docs → Chunking → SentenceTransformer
                                          ↓
                                  Embeddings → FAISS Index
                                          
Query → Embedding → FAISS Search → Top-K Docs → Context
                                                    ↓
                                              LLM Prompt
```

### 4. **Q&A Simulator Flow**
```
User requests questions → POST /api/generate-questions
                                      ↓
                              Persona + Pitch Context
                                      ↓
                              RAG Retrieval (VC tactics)
                                      ↓
                              LLM generates 5 questions
                                      ↓
User answers → POST /api/evaluate-answer
                          ↓
                 LLM evaluates (score + feedback)
                          ↓
                 Store in Firestore
```

## 🎯 Key Design Principles

### Backend (FastAPI)
- **Modular Services**: Each service handles one responsibility
- **Dependency Injection**: Use FastAPI dependencies for LLM, RAG, DB
- **Type Safety**: Pydantic models for all requests/responses
- **Error Handling**: Proper HTTP status codes and error messages
- **Async Operations**: Use async/await for I/O operations

### Frontend (React)
- **Component-Based**: Small, reusable components
- **Context API**: Global auth state management
- **API Service Layer**: Centralized API calls
- **Protected Routes**: Auth-gated pages
- **Professional UI**: Tailwind CSS with indigo theme

### RAG System
- **Document Ingestion**: One-time embedding of VC knowledge
- **Efficient Retrieval**: FAISS for fast similarity search
- **Context Injection**: Retrieved docs injected into prompts
- **Fallback Handling**: "Insufficient data" when context is poor

### Prompt Engineering
- **Persona-Specific**: Different templates per investor type
- **Structured Output**: Force JSON responses with strict schema
- **Context-Aware**: RAG context + pitch + persona
- **Chain of Thought**: Multi-step reasoning in prompts

## 🔑 API Contracts (Summary)

### POST /api/analyze-pitch
```json
Request: {
  "startup_idea": "string",
  "pitch_deck_text": "string (optional)",
  "investor_stage": "seed|series_a|series_b|growth",
  "investor_persona": "saas|angel|growth_vc|institutional",
  "industry": "string",
  "user_id": "string"
}

Response: {
  "analysis_id": "string",
  "overall_score": 75,
  "section_scores": {
    "problem_clarity": 80,
    "market_opportunity": 70,
    "revenue_model": 75,
    "competitive_moat": 65,
    "scalability": 85
  },
  "feedback": {
    "problem_clarity": "...",
    "market_opportunity": "...",
    ...
  },
  "recommendations": ["...", "..."]
}
```

### POST /api/generate-questions
```json
Request: {
  "analysis_id": "string",
  "investor_persona": "saas",
  "num_questions": 5
}

Response: {
  "questions": [
    {
      "id": "q1",
      "question": "What is your customer acquisition cost?",
      "category": "business_model",
      "difficulty": "medium"
    },
    ...
  ]
}
```

### POST /api/evaluate-answer
```json
Request: {
  "question_id": "q1",
  "answer": "Our CAC is $50...",
  "analysis_id": "string"
}

Response: {
  "score": 8,
  "feedback": "Strong answer with specific metrics...",
  "improvement_tips": ["Consider adding LTV comparison", ...]
}
```

## 🚀 Technology Justification

### Why FAISS?
- Industry-standard vector DB (used by OpenAI, Meta)
- Fast similarity search (sub-linear time)
- Can handle 1M+ embeddings
- Easy persistence (save/load indices)

### Why SentenceTransformers?
- State-of-the-art embeddings for semantic search
- Pre-trained models (no training needed)
- Efficient (runs on CPU)
- Better than TF-IDF for semantic similarity

### Why FastAPI?
- Modern Python web framework
- Auto-generated OpenAPI docs
- Type hints + validation
- Async support (concurrent requests)
- Easy to test and deploy

### Why Firebase?
- Quick auth setup (no backend auth logic)
- Real-time database (Firestore)
- Free tier sufficient for demo
- Industry-used (not toy tech)

## 📊 Data Models

### Firestore Collections

**users/**
```
{
  uid: string,
  email: string,
  created_at: timestamp,
  total_pitches: number
}
```

**pitches/**
```
{
  pitch_id: string,
  user_id: string,
  startup_idea: string,
  industry: string,
  investor_persona: string,
  analysis_result: object,
  created_at: timestamp
}
```

**qa_sessions/**
```
{
  session_id: string,
  pitch_id: string,
  questions: array,
  answers: array,
  created_at: timestamp
}
```

## 🎓 Viva Explanation Points

### For Examiners/Interviews:

1. **Why RAG?**
   - LLMs hallucinate without grounding
   - RAG provides factual, citation-backed responses
   - Industry standard for knowledge-intensive tasks

2. **Why Persona-Aware?**
   - VCs have different priorities (SaaS vs hardware)
   - Personalization improves relevance
   - Demonstrates advanced prompt engineering

3. **Scalability Considerations**
   - FAISS can scale to millions of documents
   - FastAPI handles 1000s of concurrent requests
   - Firebase auto-scales
   - Can add caching (Redis) if needed

4. **Security**
   - Firebase handles auth tokens
   - API keys in environment variables
   - Input validation with Pydantic
   - CORS configured properly

5. **Testing Strategy**
   - Unit tests for services
   - Integration tests for API endpoints
   - Mock LLM responses for deterministic tests
   - Frontend component tests with React Testing Library

---

**Next Steps**: Implement frontend, backend, and RAG system
