import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserPitches } from '../services/firestore'

const Dashboard = () => {
  const { user } = useAuth()
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchPitches = async () => {
      try {
        const data = await getUserPitches(user.uid)
        setPitches(data)
      } catch (err) {
        setError('Failed to load pitch history')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPitches()
  }, [user.uid])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your pitches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Dashboard
          </h1>
          <p className="text-gray-600">
            Review your pitch analyses and track improvements
          </p>
        </div>
        <Link to="/submit" className="btn-primary">
          New Analysis
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {pitches.length}
          </div>
          <div className="text-sm text-gray-600">Total Pitches</div>
        </div>
        
        <div className="card">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {pitches.length > 0 
              ? Math.round(pitches.reduce((sum, p) => sum + p.analysis_result.overall_score, 0) / pitches.length)
              : 0
            }
          </div>
          <div className="text-sm text-gray-600">Average Score</div>
        </div>
        
        <div className="card">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {pitches.length > 0 
              ? Math.max(...pitches.map(p => p.analysis_result.overall_score))
              : 0
            }
          </div>
          <div className="text-sm text-gray-600">Best Score</div>
        </div>
        
        <div className="card">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {new Set(pitches.map(p => p.industry)).size}
          </div>
          <div className="text-sm text-gray-600">Industries</div>
        </div>
      </div>

      {/* Pitch History */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Pitch History
        </h2>

        {pitches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No pitches yet</p>
            <Link to="/submit" className="btn-primary">
              Analyze Your First Pitch
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {pitches.map((pitch) => (
              <div 
                key={pitch.id} 
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {pitch.industry} Startup
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {pitch.startup_idea}
                    </p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {pitch.investor_stage.replace('_', ' ')}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {pitch.investor_persona.replace('_', ' ')}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {new Date(pitch.created_at.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-6 text-right">
                    <div className={`text-4xl font-bold ${getScoreColor(pitch.analysis_result.overall_score)}`}>
                      {pitch.analysis_result.overall_score}
                    </div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Object.entries(pitch.analysis_result.section_scores).map(([section, score]) => (
                    <div key={section} className="text-center">
                      <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                        {score}
                      </div>
                      <div className="text-xs text-gray-600 capitalize">
                        {section.replace(/_/g, ' ').split(' ')[0]}
                      </div>
                    </div>
                  ))}
                </div>

                <Link 
                  to={`/qa/${pitch.id}`}
                  className="btn-primary text-sm inline-block"
                >
                  Practice Q&A
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
