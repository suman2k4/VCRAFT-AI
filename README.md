# VCRAFT AI

**AI-Powered Pitch Deck Analysis for Startups**

VCRAFT AI helps startup founders evaluate and improve their pitch decks using:
- **RAG (Retrieval-Augmented Generation)** with real VC knowledge
- **Persona-aware analysis** from different investor perspectives
- **VC Q&A simulation** to practice tough questions
- **Actionable feedback** based on proven frameworks (YC, Sequoia)

## 🎯 Project Purpose

This is a **final-year + industry-grade** application demonstrating:
- Production-quality architecture
- Modern AI/ML techniques (RAG, LLMs, embeddings)
- Full-stack development (React + FastAPI)
- Real-world problem-solving

**Not a toy project.** This is demo-ready and suitable for:
- Final year evaluation
- Technical interviews
- Portfolio showcase
- Actual use by founders

## 🏗️ Architecture

```
Frontend (React + Vite + Tailwind)
           ↓
Backend API (FastAPI)
           ↓
    ┌──────┴──────┐
    ↓             ↓
RAG System    LLM Service
    ↓             ↓
FAISS Index   Gemini/OpenAI
    ↓
VC Knowledge Base
```

### Key Components

1. **RAG System**: FAISS + SentenceTransformers for semantic search
2. **LLM Service**: Unified interface for Gemini/OpenAI
3. **Prompt Engineering**: Persona-aware templates with structured output
4. **Firebase**: Authentication + Firestore database

## 🚀 Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router
- Firebase Auth
- Axios

### Backend
- FastAPI
- Python 3.10+
- SentenceTransformers (embeddings)
- FAISS (vector search)
- Google Gemini / OpenAI (LLMs)
- Firebase Admin SDK

## 📁 Project Structure

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete architecture documentation.

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.10+
- Firebase project (free tier)
- Gemini API key OR OpenAI API key

### 1. Clone Repository

```bash
cd "VCRAFT AI"
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Setup environment
copy .env.example .env
# Edit .env with your API keys

# Initialize RAG system (IMPORTANT!)
python initialize_rag.py

# Start server
python main.py
```

Backend will run on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
copy .env.example .env
# Edit .env with Firebase config

# Start dev server
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Firebase Setup

1. Create Firebase project at https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Enable Firestore Database
4. Get Firebase config from Project Settings
5. Add config to `frontend/.env`

## 🎮 Usage

### 1. Sign Up / Log In
- Create account on landing page
- Firebase handles authentication

### 2. Analyze Pitch
- Go to `/submit`
- Enter startup idea (minimum 50 chars)
- Select industry, funding stage, investor persona
- Click "Analyze Pitch"

### 3. View Results
- Get overall score + section-wise breakdown
- Read detailed feedback
- Review recommendations

### 4. Practice Q&A
- Click "Practice VC Q&A"
- Answer 5 persona-specific questions
- Get scored feedback (0-10)
- Review improvement tips

### 5. Dashboard
- View pitch history
- Track scores over time
- Re-access previous analyses

## 🧠 How It Works

### RAG Pipeline

```
User submits pitch
        ↓
Embed query with SentenceTransformer
        ↓
Search FAISS index for relevant VC knowledge
        ↓
Retrieve top-5 most similar chunks
        ↓
Inject context into LLM prompt
        ↓
LLM generates grounded analysis
        ↓
Parse JSON response
        ↓
Return to user
```

### Why RAG?
- **No hallucinations**: LLM only uses retrieved knowledge
- **Grounded advice**: Based on real VC frameworks
- **Explainable**: Can trace advice back to sources
- **Updatable**: Add new VC content without retraining

### Persona Adaptation

Different investors care about different things:

**SaaS Investor**: CAC, LTV, MRR, unit economics
**Angel Investor**: Team, vision, market potential
**Growth VC**: Scale, metrics, competitive position
**Institutional**: Defensibility, profitability, risk

Prompts and evaluation criteria adapt automatically.

## 📊 API Endpoints

### POST /api/analyze-pitch
Analyze a startup pitch.

**Request:**
```json
{
  "startup_idea": "...",
  "industry": "SaaS",
  "investor_stage": "seed",
  "investor_persona": "saas",
  "user_id": "firebase_uid"
}
```

**Response:**
```json
{
  "analysis_id": "uuid",
  "overall_score": 75,
  "section_scores": {...},
  "feedback": {...},
  "recommendations": [...]
}
```

### POST /api/generate-questions
Generate VC questions for Q&A.

### POST /api/evaluate-answer
Evaluate founder's answer.

See full API docs at `http://localhost:8000/docs` (FastAPI auto-generated)

## 🎓 For Academic Evaluation

### Key Features to Highlight

1. **RAG Implementation**: Production-quality vector search with FAISS
2. **Prompt Engineering**: Persona-aware templates with JSON enforcement
3. **Modular Architecture**: Clean separation of concerns
4. **Error Handling**: Proper validation and error messages
5. **Real-world Application**: Solves actual founder pain point

### Viva Questions & Answers

**Q: Why use RAG instead of just LLM?**
A: LLMs hallucinate without grounding. RAG retrieves real VC knowledge before generation, ensuring advice is factual and citation-backed. Industry standard for knowledge-intensive tasks.

**Q: Why FAISS over other vector databases?**
A: FAISS is industry-proven (used by Meta, OpenAI), efficient for millions of vectors, works well on CPU, and has easy persistence. Perfect for this scale.

**Q: How do you prevent hallucinations?**
A: 1) RAG retrieves context first, 2) Prompt explicitly says "use ONLY provided knowledge", 3) Structured JSON output enforces format, 4) Validate responses.

**Q: Why multiple investor personas?**
A: VCs have different priorities. A SaaS investor cares about MRR; an angel cares about team. Personalization makes feedback relevant and realistic.

**Q: How scalable is this?**
A: Very. FAISS scales to millions of docs, FastAPI handles 1000s concurrent requests, Firebase auto-scales. Can add caching (Redis) and load balancing for more scale.

## 🔒 Security

- API keys in environment variables (never committed)
- Firebase handles auth tokens securely
- Input validation with Pydantic
- CORS configured for specific origins
- Rate limiting (can be added via FastAPI middleware)

## 🚢 Deployment

### Backend (Recommended: Google Cloud Run / AWS Lambda)
```bash
# Build Docker image
docker build -t vcraft-backend .

# Deploy to Cloud Run
gcloud run deploy vcraft-backend --source .
```

### Frontend (Recommended: Vercel / Netlify)
```bash
# Build production
npm run build

# Deploy to Vercel
vercel --prod
```

## 📈 Future Enhancements

- [ ] PDF pitch deck upload and parsing
- [ ] Comparison with successful pitch decks
- [ ] Collaborative feedback (share with team)
- [ ] More investor personas (thesis-driven, sector-specific)
- [ ] Export analysis as PDF report
- [ ] Multi-language support
- [ ] Integration with pitch deck builders (Canva, Pitch)

## 🤝 Contributing

This is an academic project, but suggestions are welcome!

## 📄 License

MIT License - Free for educational and commercial use

## 👨‍💻 Author

Built by [Your Name] as a final-year project demonstrating:
- Full-stack development
- AI/ML implementation (RAG, LLMs)
- System architecture
- Real-world problem-solving

---

**Questions?** Open an issue or contact [your email]

**Demo:** [Link to deployed version]

**Documentation:** See `docs/` folder for detailed technical docs
