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
export const generateQuestions = async (analysisId, persona, numQuestions = 5) => {
  const response = await api.post('/api/generate-questions', {
    analysis_id: analysisId,
    investor_persona: persona,
    num_questions: numQuestions,
  })
  return response.data
}

// Evaluate Answer
export const evaluateAnswer = async (questionId, answer, analysisId) => {
  const response = await api.post('/api/evaluate-answer', {
    question_id: questionId,
    answer: answer,
    analysis_id: analysisId,
  })
  return response.data
}

// Health Check
export const checkHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
