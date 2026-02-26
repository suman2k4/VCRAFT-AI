import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
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
export const evaluateAnswer = async (questionId, answer, analysisId, questionText = '', pitchSummary = '') => {
  const response = await api.post('/api/evaluate-answer', {
    question_id: questionId,
    answer: answer,
    analysis_id: analysisId,
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

export default api
