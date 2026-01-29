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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pitchData = await getPitchAnalysis(analysisId)
        setPitch(pitchData)
        
        // Generate questions
        const questionsData = await generateQuestions(
          analysisId,
          pitchData.investor_persona,
          5
        )
        setQuestions(questionsData.questions)
      } catch (err) {
        setError('Failed to load Q&A session')
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
      
      const result = await evaluateAnswer(
        questions[currentQuestionIndex].id,
        answer,
        analysisId
      )
      
      setEvaluation(result)
      
      // Save answer
      const newAnswers = [...answers, {
        question: questions[currentQuestionIndex].question,
        answer: answer,
        evaluation: result,
      }]
      setAnswers(newAnswers)
      
      // Save to Firestore
      await saveQASession(analysisId, questions, newAnswers)
      
    } catch (err) {
      setError('Failed to evaluate answer')
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
    if (score >= 8) return 'text-green-600 bg-green-50'
    if (score >= 5) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  if (!pitch || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating VC questions...</p>
        </div>
      </div>
    )
  }

  if (currentQuestionIndex >= questions.length) {
    const avgScore = answers.reduce((sum, a) => sum + a.evaluation.score, 0) / answers.length

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Q&A Session Complete!
          </h2>
          
          <div className={`text-6xl font-bold ${getScoreColor(avgScore)} px-8 py-4 rounded-2xl inline-block mb-6`}>
            {avgScore.toFixed(1)}/10
          </div>
          
          <p className="text-gray-600 mb-8">
            Average Score Across {answers.length} Questions
          </p>

          <div className="space-y-6 text-left">
            {answers.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <p className="font-semibold text-gray-900 flex-1">
                    Q{index + 1}: {item.question}
                  </p>
                  <span className={`text-xl font-bold ${getScoreColor(item.evaluation.score)} px-3 py-1 rounded ml-4`}>
                    {item.evaluation.score}/10
                  </span>
                </div>
                <p className="text-gray-700 mb-2">
                  <span className="font-medium">Your Answer:</span> {item.answer}
                </p>
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Feedback:</span> {item.evaluation.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-gray-900">
            VC Q&A Simulator
          </h1>
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="card mb-6">
        <div className="flex items-start mb-4">
          <div className="bg-primary-100 text-primary-600 font-bold px-3 py-1 rounded mr-4">
            {currentQuestion.category.replace(/_/g, ' ')}
          </div>
          <div className="text-sm text-gray-600">
            Difficulty: <span className="font-medium capitalize">{currentQuestion.difficulty}</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Answer:</p>
              <p className="text-gray-900">{answer}</p>
            </div>

            <div className={`p-6 rounded-lg mb-6 ${getScoreColor(evaluation.score)}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Evaluation</h3>
                <span className="text-4xl font-bold">{evaluation.score}/10</span>
              </div>
              
              <p className="text-gray-700 mb-4">{evaluation.feedback}</p>
              
              {evaluation.improvement_tips && evaluation.improvement_tips.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Improvement Tips:</p>
                  <ul className="space-y-1">
                    {evaluation.improvement_tips.map((tip, index) => (
                      <li key={index} className="text-sm">
                        → {tip}
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
              {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Session'}
            </button>
          </>
        )}
      </div>

      {/* Context Card */}
      <div className="card bg-primary-50 border border-primary-200">
        <h3 className="font-bold text-primary-900 mb-2">💡 Tip</h3>
        <p className="text-sm text-primary-700">
          VCs look for specific metrics, clear reasoning, and evidence of deep thinking. 
          Back your claims with data when possible.
        </p>
      </div>
    </div>
  )
}

export default QASimulator
