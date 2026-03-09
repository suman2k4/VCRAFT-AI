import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getPitchAnalysis, saveQASession } from '../services/firestore'
import { generateQuestions, evaluateAnswer } from '../services/api'

const QASimulator = () => {
  const { analysisId } = useParams()
  const [pitch, setPitch] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState([])
  const [pitchSummary, setPitchSummary] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pitchData = await getPitchAnalysis(analysisId)
        setPitch(pitchData)
        
        // Build pitch summary for backend context
        const summary = `${pitchData.startup_idea}\nIndustry: ${pitchData.industry}\nStage: ${pitchData.investor_stage}`
        setPitchSummary(summary)
        
        // Use the backend analysis_id if available, otherwise use the Firestore doc ID
        const backendAnalysisId = pitchData.analysis_result?.analysis_id || analysisId
        
        // Generate questions - pass pitch summary inline for robustness
        const questionsData = await generateQuestions(
          backendAnalysisId,
          pitchData.investor_persona,
          5,
          summary
        )
        setQuestions(questionsData.questions)
      } catch (err) {
        setError('Failed to load Q&A session. Please try analyzing your pitch first.')
        console.error(err)
      }
    }

    fetchData()
  }, [analysisId])

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      setError('Please enter an answer')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const currentQuestion = questions[currentQuestionIndex]
      const backendAnalysisId = pitch?.analysis_result?.analysis_id || analysisId
      
      const result = await evaluateAnswer(
        currentQuestion.id,
        answer,
        backendAnalysisId,
        currentQuestion.question,
        pitchSummary,
        pitch?.investor_persona
      )
      
      setEvaluation(result)
      
      // Save answer
      const newAnswers = [...answers, {
        question: currentQuestion.question,
        answer: answer,
        evaluation: result,
      }]
      setAnswers(newAnswers)
      
      // Save to Firestore
      try {
        await saveQASession(analysisId, questions, newAnswers)
      } catch (saveErr) {
        console.warn('Failed to save Q&A session to Firestore:', saveErr)
      }
      
    } catch (err) {
      setError('Failed to evaluate answer. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleNextQuestion = () => {
    setAnswer('')
    setEvaluation(null)
    setCurrentQuestionIndex(currentQuestionIndex + 1)
  }

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-500'
    if (score >= 5) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreBgClass = (score) => {
    if (score >= 8) return 'bg-emerald-500/10 border-emerald-500/20'
    if (score >= 5) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  if (!pitch || questions.length === 0) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-primary-200 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-500 font-medium">Generating VC questions...</p>
        </div>
      </div>
    )
  }

  if (currentQuestionIndex >= questions.length) {
    const avgScore = answers.reduce((sum, a) => sum + a.evaluation.score, 0) / answers.length

    return (
      <div className="min-h-screen mesh-gradient relative">
        <div className="blob blob-sm bg-primary-300" style={{ top: '10%', right: '5%' }} />
        <div className="blob blob-sm bg-emerald-200" style={{ bottom: '20%', left: '5%', animationDelay: '3s' }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="card text-center animate-scale-in">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
              Q&A Session Complete!
            </h2>
            
            <div className={`text-6xl font-extrabold ${getScoreColor(avgScore)} inline-block mb-2`}>
              {avgScore.toFixed(1)}<span className="text-2xl text-gray-400">/10</span>
            </div>
            
            <p className="text-gray-500 mb-8">
              Average Score Across {answers.length} Questions
            </p>

            <div className="space-y-4 text-left">
              {answers.map((item, index) => (
                <div key={index} className="card animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-bold text-gray-800 flex-1">
                      Q{index + 1}: {item.question}
                    </p>
                    <span className={`text-xl font-extrabold ${getScoreColor(item.evaluation.score)} px-3 py-1 rounded-xl border backdrop-blur-sm ${getScoreBgClass(item.evaluation.score)} ml-4`}>
                      {item.evaluation.score}/10
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2 text-sm">
                    <span className="font-semibold text-gray-700">Your Answer:</span> {item.answer}
                  </p>
                  <p className="text-gray-500 text-sm">
                    <span className="font-semibold text-gray-600">Feedback:</span> {item.evaluation.feedback}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="min-h-screen mesh-gradient relative">
      <div className="blob blob-sm bg-primary-200" style={{ top: '5%', right: '8%', animationDelay: '0s' }} />
      <div className="blob blob-sm bg-orange-200" style={{ bottom: '30%', left: '3%', animationDelay: '4s' }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-6 animate-fade-in-up">
          <div className="flex justify-between items-center mb-3">
            <h1 className="text-3xl font-extrabold">
              <span className="text-gradient">VC Q&A Simulator</span>
            </h1>
            <span className="text-sm text-gray-500 bg-white/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/30 font-medium">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="fill"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm text-red-600 p-4 rounded-xl mb-6 border border-red-500/20">
            {error}
          </div>
        )}

        <div className="card mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-start mb-4 gap-3">
            <span className="bg-primary-500/10 text-primary-600 font-bold px-3 py-1.5 rounded-lg text-sm border border-primary-500/10 backdrop-blur-sm">
              {currentQuestion.category.replace(/_/g, ' ')}
            </span>
            <span className="text-sm text-gray-500 bg-white/40 px-2.5 py-1 rounded-lg border border-white/30">
              <span className="capitalize">{currentQuestion.difficulty}</span>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

        {!evaluation ? (
          <>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              className="input-field mb-4"
              placeholder="Type your answer here. Be specific, use metrics where possible, and explain your reasoning..."
            />

            <button 
              onClick={handleSubmitAnswer}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Evaluating...' : 'Submit Answer'}
            </button>
          </>
        ) : (
          <>
            <div className="bg-white/30 backdrop-blur-sm p-4 rounded-xl mb-6 border border-white/20">
              <p className="text-sm text-gray-500 mb-2">Your Answer:</p>
              <p className="text-gray-800">{answer}</p>
            </div>

            <div className={`p-6 rounded-xl mb-6 border backdrop-blur-sm ${getScoreBgClass(evaluation.score)}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Evaluation</h3>
                <span className={`text-4xl font-extrabold ${getScoreColor(evaluation.score)}`}>{evaluation.score}/10</span>
              </div>
              
              <p className="text-gray-600 mb-4">{evaluation.feedback}</p>
              
              {evaluation.improvement_tips && evaluation.improvement_tips.length > 0 && (
                <div>
                  <p className="font-bold text-gray-700 mb-2">Improvement Tips:</p>
                  <ul className="space-y-1.5">
                    {evaluation.improvement_tips.map((tip, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">→</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <button 
              onClick={handleNextQuestion}
              className="btn-primary"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : '🎉 Finish Session'}
            </button>
          </>
        )}
      </div>

      {/* Context Card */}
      <div className="card bg-primary-500/5 border-primary-500/10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
          <span className="w-7 h-7 bg-primary-500/10 rounded-lg flex items-center justify-center text-sm">💡</span>
          Pro Tip
        </h3>
        <p className="text-sm text-gray-500">
          VCs look for specific metrics, clear reasoning, and evidence of deep thinking. 
          Back your claims with data when possible.
        </p>
      </div>
    </div>
    </div>
  )
}

export default QASimulator
