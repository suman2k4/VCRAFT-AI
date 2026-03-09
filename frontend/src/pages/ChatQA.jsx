import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPitchAnalysis } from '../services/firestore'
import { startChatSession, sendChatMessage } from '../services/api'

const PERSONA_AVATARS = {
  saas: { emoji: '📊', color: 'bg-blue-500' },
  angel: { emoji: '👼', color: 'bg-purple-500' },
  growth_vc: { emoji: '🚀', color: 'bg-green-500' },
  institutional: { emoji: '🏛️', color: 'bg-gray-700' },
  deep_tech: { emoji: '🔬', color: 'bg-cyan-600' },
  impact: { emoji: '🌍', color: 'bg-emerald-600' },
}

const ChatQA = () => {
  const { analysisId } = useParams()
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Session state
  const [sessionId, setSessionId] = useState(null)
  const [investorName, setInvestorName] = useState('')
  const [investorDesc, setInvestorDesc] = useState('')
  const [persona, setPersona] = useState('saas')
  const [pitch, setPitch] = useState(null)

  // Chat state
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState('')

  // Session stats
  const [questionsAsked, setQuestionsAsked] = useState(0)
  const [avgScore, setAvgScore] = useState(null)
  const [sessionComplete, setSessionComplete] = useState(false)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      try {
        setInitializing(true)

        // Fetch pitch data from Firestore
        const pitchData = await getPitchAnalysis(analysisId)
        setPitch(pitchData)
        setPersona(pitchData.investor_persona || 'saas')

        const summary = `${pitchData.startup_idea}\nIndustry: ${pitchData.industry}\nStage: ${pitchData.investor_stage}`

        // Start chat session on backend
        const session = await startChatSession(
          summary,
          pitchData.industry,
          pitchData.investor_persona || 'saas',
          pitchData.investor_stage || 'seed'
        )

        setSessionId(session.session_id)
        setInvestorName(session.investor_name)
        setInvestorDesc(session.investor_description)

        // Add greeting as first message
        setMessages([{
          role: 'investor',
          content: session.greeting,
          timestamp: new Date(),
        }])
      } catch (err) {
        console.error('Failed to init chat session:', err)
        setError('Failed to start Q&A session. Please try analyzing your pitch first.')
      } finally {
        setInitializing(false)
      }
    }

    initSession()
  }, [analysisId])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading || sessionComplete) return

    // Add founder message
    const founderMsg = {
      role: 'founder',
      content: trimmed,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, founderMsg])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const response = await sendChatMessage(sessionId, trimmed)

      // Add investor reply
      const investorMsg = {
        role: 'investor',
        content: response.reply,
        score: response.score,
        feedback: response.feedback,
        tips: response.tips,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, investorMsg])
      setQuestionsAsked(response.questions_asked)
      setAvgScore(response.avg_score)

      if (response.session_complete) {
        setSessionComplete(true)
      }
    } catch (err) {
      console.error('Chat error:', err)
      setError('Failed to get response. Please try again.')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const avatarInfo = PERSONA_AVATARS[persona] || PERSONA_AVATARS.saas

  const getScoreBadge = (score) => {
    if (score == null) return null
    let color = 'bg-red-100 text-red-700 border-red-200'
    if (score >= 8) color = 'bg-emerald-100 text-emerald-700 border-emerald-200'
    else if (score >= 5) color = 'bg-amber-100 text-amber-700 border-amber-200'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${color}`}>
        {score}/10
      </span>
    )
  }

  // ── Loading State ──
  if (initializing) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-primary-200 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">Setting up your interview...</h3>
          <p className="text-sm text-gray-500">The investor is reviewing your pitch</p>
        </div>
      </div>
    )
  }

  // ── Error State ──
  if (error && !sessionId) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center animate-scale-in">
          <div className="text-5xl mb-4">😕</div>
          <h3 className="text-xl font-extrabold text-gray-800 mb-2">Session Error</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/submit" className="btn-primary inline-block">Analyze a Pitch First</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mesh-gradient flex flex-col">
      {/* ── Header Bar ── Glassmorphism */}
      <div className="frosted border-b border-white/20 shadow-glass sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${avatarInfo.color} flex items-center justify-center text-lg shadow-md`}>
              {avatarInfo.emoji}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm leading-tight">{investorName}</h2>
              <p className="text-xs text-gray-500 leading-tight">{pitch?.industry} &bull; {pitch?.investor_stage?.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {avgScore != null && (
              <div className="text-right hidden sm:block">
                <div className="text-xs text-gray-500">Avg Score</div>
                <div className="text-lg font-bold text-primary-600">{avgScore}/10</div>
              </div>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-500">Questions</div>
              <div className="text-lg font-bold text-gray-700">{questionsAsked}/7</div>
            </div>
            {/* Progress ring */}
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15" fill="none"
                  stroke="#ea580c" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(questionsAsked / 7) * 94.2} 94.2`}
                  className="transition-all duration-500"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                {Math.round((questionsAsked / 7) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'founder' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'founder' ? 'order-1' : 'order-2'}`}>
                {/* Avatar */}
                {msg.role === 'investor' && (
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`w-6 h-6 rounded-full ${avatarInfo.color} flex items-center justify-center text-xs`}>
                      {avatarInfo.emoji}
                    </div>
                    <span className="text-xs font-medium text-gray-500">{investorName}</span>
                  </div>
                )}

                {/* Bubble — Glass */}
                <div
                  className={`rounded-2xl px-4 py-3 shadow-glass ${
                    msg.role === 'founder'
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-br-md'
                      : 'bg-white/70 backdrop-blur-xl text-gray-800 rounded-bl-md border border-white/30'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Score card for investor messages */}
                {msg.role === 'investor' && msg.score != null && (
                  <div className="mt-2 bg-white/60 backdrop-blur-xl border border-white/30 rounded-xl p-3 shadow-glass">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Answer Evaluation</span>
                      {getScoreBadge(msg.score)}
                    </div>
                    {msg.feedback && (
                      <p className="text-xs text-gray-600 mb-2">{msg.feedback}</p>
                    )}
                    {msg.tips && msg.tips.length > 0 && (
                      <div className="space-y-1">
                        {msg.tips.map((tip, i) => (
                          <div key={i} className="flex items-start text-xs text-gray-500">
                            <span className="text-primary-500 mr-1.5 mt-0.5">→</span>
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-[10px] text-gray-400 mt-1 ${msg.role === 'founder' ? 'text-right' : ''}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="flex items-center space-x-2 mb-1">
                  <div className={`w-6 h-6 rounded-full ${avatarInfo.color} flex items-center justify-center text-xs`}>
                    {avatarInfo.emoji}
                  </div>
                  <span className="text-xs font-medium text-gray-500">{investorName}</span>
                </div>
                <div className="bg-white/70 backdrop-blur-xl rounded-2xl rounded-bl-md px-4 py-3 shadow-glass border border-white/30">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Session Complete Banner ── */}
      {sessionComplete && (
        <div className="bg-gradient-to-r from-primary-500 to-orange-500 text-white">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 backdrop-blur rounded-full p-2">
                  <span className="text-2xl">🎉</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm">Session Complete!</h3>
                  <p className="text-xs text-white/80">
                    Average Score: <span className="font-bold text-white">{avgScore}/10</span> across {questionsAsked} questions
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link
                  to="/submit"
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  New Analysis
                </Link>
                <Link
                  to="/dashboard"
                  className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Input Area ── */}
      {!sessionComplete && (
        <div className="frosted border-t border-white/20 shadow-glass">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {error && (
              <div className="bg-red-500/10 backdrop-blur-sm text-red-600 text-xs px-3 py-1.5 rounded-xl mb-2 border border-red-500/20">
                {error}
              </div>
            )}
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="w-full px-4 py-3 bg-white/40 backdrop-blur-sm border border-white/30 rounded-2xl resize-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400/50 focus:bg-white/60 outline-none text-sm placeholder-gray-400 max-h-32 overflow-y-auto transition-all duration-300"
                  placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
                  disabled={loading}
                  style={{ minHeight: '44px' }}
                  onInput={(e) => {
                    e.target.style.height = '44px'
                    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
                  }}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-primary-600 text-white w-11 h-11 rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md flex-shrink-0"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Be specific, use metrics, and show deep understanding of your business
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatQA
