# VCRAFT AI - Setup Guide

Complete setup instructions for development and deployment.

## Prerequisites

### Required Software
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.10+ ([Download](https://python.org/))
- **Git** ([Download](https://git-scm.com/))

### Required Accounts
- **Firebase** account (free tier) - [console.firebase.google.com](https://console.firebase.google.com)
- **Google Gemini** API key (free tier) OR **OpenAI** API key

## Step-by-Step Setup

### 1. Firebase Project Setup

#### Create Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "vcraft-ai" (or your preference)
4. Disable Google Analytics (optional)
5. Click "Create project"

#### Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable "Email/Password" provider
4. Save

#### Enable Firestore
1. Go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a region close to you
5. Click "Enable"

#### Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click Web icon (</>) to create web app
4. Register app with nickname "vcraft-frontend"
5. Copy the `firebaseConfig` object - you'll need these values:
   ```javascript
   {
     apiKey: "...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   }
   ```

### 2. Get API Keys

#### Option A: Google Gemini (Recommended for Free Tier)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the API key

#### Option B: OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up / Log in
3. Click "Create new secret key"
4. Copy the key (store safely!)

### 3. Backend Setup

#### Navigate to Backend
```bash
cd backend
```

#### Create Virtual Environment
**Windows:**
```bash
python -m venv venv
.\venv\Scripts\activate
```

**Mac/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

This will install:
- FastAPI (web framework)
- SentenceTransformers (embeddings)
- FAISS (vector search)
- Google Generative AI / OpenAI
- Firebase Admin SDK
- Other utilities

#### Configure Environment

1. Copy the example env file:
```bash
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux
```

2. Edit `.env` file with your values:
```env
# Choose your LLM provider
LLM_PROVIDER=gemini  # or 'openai'

# Add your API key
GEMINI_API_KEY=your_actual_gemini_key_here
# OPENAI_API_KEY=your_openai_key_here

# Firebase (optional for backend - mainly for frontend)
FIREBASE_CREDENTIALS_PATH=path/to/serviceAccountKey.json

# RAG Configuration (defaults are fine)
EMBEDDINGS_MODEL=all-MiniLM-L6-v2
FAISS_INDEX_PATH=./rag/faiss_index
KNOWLEDGE_BASE_PATH=./rag/knowledge_base

# Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
```

#### Initialize RAG System (CRITICAL!)

This step loads VC knowledge and builds the FAISS index:

```bash
python initialize_rag.py
```

You should see:
```
====================================
VCRAFT AI - RAG Initialization
====================================

Loading embedding model: all-MiniLM-L6-v2
Model loaded. Embedding dimension: 384

Initializing knowledge base from: ./rag/knowledge_base
Loaded 45 chunks from yc_advice.txt
Loaded 52 chunks from sequoia_framework.txt
Loaded 63 chunks from pitch_guidelines.txt

Generating embeddings for 160 chunks...
Added 160 documents. Total documents: 160

Saving FAISS index...
Saved vector store to ./rag/faiss_index

====================================
RAG initialization complete!
====================================
```

#### Start Backend Server

```bash
python main.py
```

Server will start on `http://localhost:8000`

Visit `http://localhost:8000/docs` to see auto-generated API documentation.

### 4. Frontend Setup

#### Navigate to Frontend
```bash
cd frontend  # from project root
```

#### Install Dependencies
```bash
npm install
```

This installs:
- React + React Router
- Tailwind CSS
- Firebase SDK
- Axios
- Vite

#### Configure Environment

1. Copy example env:
```bash
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux
```

2. Edit `.env` with your Firebase config:
```env
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# API Configuration
VITE_API_BASE_URL=http://localhost:8000
```

#### Start Frontend Dev Server

```bash
npm run dev
```

Frontend will start on `http://localhost:3000`

### 5. Verify Setup

1. **Backend Health Check**
   - Go to `http://localhost:8000/health`
   - Should see: `{"status": "healthy"}`

2. **Frontend**
   - Go to `http://localhost:3000`
   - Should see the landing page

3. **Create Account**
   - Click "Sign Up"
   - Create test account
   - Should redirect to dashboard

4. **Test Pitch Analysis**
   - Go to "Analyze Pitch"
   - Submit a test pitch
   - Should receive analysis with scores

## Troubleshooting

### Backend Issues

**"Module not found" errors:**
```bash
# Make sure virtual environment is activated
# Reinstall dependencies
pip install -r requirements.txt
```

**"FAISS index not found":**
```bash
# Re-run initialization
python initialize_rag.py
```

**"API key not found":**
- Check `.env` file exists
- Verify API key is correct
- No quotes around the key value

**Port already in use:**
```bash
# Change port in .env
PORT=8001
```

### Frontend Issues

**"Firebase not configured":**
- Verify all VITE_FIREBASE_* variables in `.env`
- Restart dev server after changing `.env`

**"Cannot connect to API":**
- Verify backend is running on port 8000
- Check VITE_API_BASE_URL in `.env`

**"Module not found":**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

## Development Workflow

### Starting Development

**Terminal 1 - Backend:**
```bash
cd backend
.\venv\Scripts\activate  # or source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Making Changes

- Backend changes auto-reload (FastAPI reload enabled)
- Frontend changes hot-reload (Vite HMR)
- RAG changes require re-running `initialize_rag.py`

### Adding VC Knowledge

1. Add `.txt` files to `backend/rag/knowledge_base/`
2. Run `python initialize_rag.py`
3. Restart backend

## Production Deployment

### Backend (Google Cloud Run)

```bash
# Build and deploy
gcloud run deploy vcraft-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

Update `VITE_API_BASE_URL` to production backend URL.

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| LLM_PROVIDER | Yes | `gemini` or `openai` |
| GEMINI_API_KEY | If using Gemini | Google Gemini API key |
| OPENAI_API_KEY | If using OpenAI | OpenAI API key |
| EMBEDDINGS_MODEL | No | SentenceTransformer model (default: all-MiniLM-L6-v2) |
| FAISS_INDEX_PATH | No | Path to store FAISS index |
| KNOWLEDGE_BASE_PATH | No | Path to VC knowledge docs |
| HOST | No | Server host (default: 0.0.0.0) |
| PORT | No | Server port (default: 8000) |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_FIREBASE_API_KEY | Yes | Firebase API key |
| VITE_FIREBASE_AUTH_DOMAIN | Yes | Firebase auth domain |
| VITE_FIREBASE_PROJECT_ID | Yes | Firebase project ID |
| VITE_FIREBASE_STORAGE_BUCKET | Yes | Firebase storage bucket |
| VITE_FIREBASE_MESSAGING_SENDER_ID | Yes | Firebase messaging sender ID |
| VITE_FIREBASE_APP_ID | Yes | Firebase app ID |
| VITE_API_BASE_URL | No | Backend API URL (default: http://localhost:8000) |

## Next Steps

After setup is complete:

1. Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for architecture
2. Check API docs at `http://localhost:8000/docs`
3. Test all features (signup, analyze, Q&A)
4. Review code in `backend/services/` for core logic
5. Customize prompts in `backend/prompts/`

## Support

For issues:
1. Check logs in terminal
2. Verify environment variables
3. Ensure all prerequisites installed
4. Check Firebase console for auth/database issues

---

**Setup Complete!** 🎉

You now have a fully functional AI-powered pitch analysis system.
