import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',  // Skip ngrok browser interstitial
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors globally (e.g. expired/revoked tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid/expired — clear stored auth and redirect to home
      localStorage.removeItem('authToken')
      // Only redirect if not already on the landing page
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

// Pitch Analysis API
export const analyzePitch = async (pitchData) => {
  const response = await api.post('/api/analyze-pitch', pitchData)
  return response.data
}

// Generate VC Questions
export const generateQuestions = async (analysisId, persona, numQuestions = 5, pitchSummary = '') => {
  const response = await api.post('/api/generate-questions', {
    analysis_id: analysisId,
    investor_persona: persona,
    num_questions: numQuestions,
    pitch_summary: pitchSummary || undefined,
  })
  return response.data
}

// Evaluate Answer
export const evaluateAnswer = async (questionId, answer, analysisId, questionText = '', pitchSummary = '', investorPersona = 'saas') => {
  const response = await api.post('/api/evaluate-answer', {
    question_id: questionId,
    answer: answer,
    analysis_id: analysisId,
    investor_persona: investorPersona || undefined,
    question_text: questionText || undefined,
    pitch_summary: pitchSummary || undefined,
  })
  return response.data
}

// Health Check
export const checkHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

// ==========================================
// PDF EXTRACTION API
// ==========================================

// Extract text from a PDF pitch deck
export const extractPDF = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await api.post('/api/extract-pdf', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data
}

// ==========================================
// CHATBOT Q&A API
// ==========================================

// Start a new chatbot Q&A session
export const startChatSession = async (pitchSummary, industry, persona, stage) => {
  const response = await api.post('/api/chat/start', {
    pitch_summary: pitchSummary,
    industry: industry,
    investor_persona: persona,
    investor_stage: stage,
  })
  return response.data
}

// Send a message in a chat session
export const sendChatMessage = async (sessionId, message) => {
  const response = await api.post('/api/chat/message', {
    session_id: sessionId,
    message: message,
  })
  return response.data
}

// ==========================================
// DECK UPLOAD & GENERATION API
// ==========================================

// Upload a PPTX/PDF deck and extract slides
export const uploadDeck = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/api/upload-deck', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// Analyze an uploaded deck (classify + score)
export const analyzeDeck = async (deckId, investorPersona = 'growth_vc') => {
  const formData = new FormData()
  formData.append('deck_id', deckId)
  formData.append('investor_persona', investorPersona)
  const response = await api.post('/api/analyze-deck', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

// Generate a refined PPTX deck (returns blob)
export const generateRefinedDeck = async (deckId, investorPersona = 'growth_vc', startupName = 'Your Startup') => {
  const formData = new FormData()
  formData.append('deck_id', deckId)
  formData.append('investor_persona', investorPersona)
  formData.append('startup_name', startupName)
  const response = await api.post('/api/generate-refined-deck', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseType: 'blob',
  })
  return response.data
}

export default api
