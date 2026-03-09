import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserPitches } from '../services/firestore'

const SECTION_LABELS = {
  problem_clarity: 'Problem Clarity',
  market_opportunity: 'Market Opportunity',
  revenue_model: 'Revenue Model',
  competitive_moat: 'Competitive Moat',
  scalability: 'Scalability',
}

const PitchCompare = () => {
  const { user } = useAuth()
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedA, setSelectedA] = useState(null)
  const [selectedB, setSelectedB] = useState(null)

  useEffect(() => {
    const fetchPitches = async () => {
      try {
        const result = await getUserPitches(user.uid, 50)
        const data = result.pitches
        setPitches(data)
        if (data.length >= 2) {
          setSelectedA(data[0])
          setSelectedB(data[1])
        }
      } catch (err) {
        console.error('Failed to load pitches:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPitches()
  }, [user.uid])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-400 to-emerald-500'
    if (score >= 60) return 'bg-gradient-to-r from-amber-400 to-amber-500'
    return 'bg-gradient-to-r from-red-400 to-red-500'
  }

  const getDiffBadge = (scoreA, scoreB) => {
    const diff = scoreA - scoreB
    if (diff > 0) return <span className="text-xs font-bold text-green-600">+{diff}</span>
    if (diff < 0) return <span className="text-xs font-bold text-red-600">{diff}</span>
    return <span className="text-xs font-bold text-gray-400">0</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading pitches...</p>
        </div>
      </div>
    )
  }

  if (pitches.length < 2) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="card max-w-md text-center animate-scale-in">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">Need More Pitches</h2>
          <p className="text-gray-500 mb-6">You need at least 2 analyzed pitches to compare them.</p>
          <Link to="/submit" className="btn-primary">Analyze a Pitch</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mesh-gradient relative">
      <div className="blob blob-sm bg-primary-200" style={{ top: '5%', right: '8%' }} />
      <div className="blob blob-sm bg-violet-200" style={{ bottom: '20%', left: '5%', animationDelay: '3s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold mb-2"><span className="text-gradient">Compare Pitches</span></h1>
          <p className="text-gray-500">Side-by-side comparison of your pitch analyses</p>
        </div>

      {/* Selectors */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="label">Pitch A</label>
          <select
            value={selectedA?.id || ''}
            onChange={(e) => setSelectedA(pitches.find(p => p.id === e.target.value))}
            className="input-field"
          >
            {pitches.map(p => (
              <option key={p.id} value={p.id}>
                {p.industry} - Score: {p.analysis_result.overall_score} ({new Date(p.created_at.seconds * 1000).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Pitch B</label>
          <select
            value={selectedB?.id || ''}
            onChange={(e) => setSelectedB(pitches.find(p => p.id === e.target.value))}
            className="input-field"
          >
            {pitches.map(p => (
              <option key={p.id} value={p.id}>
                {p.industry} - Score: {p.analysis_result.overall_score} ({new Date(p.created_at.seconds * 1000).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedA && selectedB && (
        <>
          {/* Overall Score Comparison */}
          <div className="card mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Overall Score</h3>
            <div className="grid grid-cols-3 items-center gap-4">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(selectedA.analysis_result.overall_score)}`}>
                  {selectedA.analysis_result.overall_score}
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedA.industry}</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-300">VS</div>
                <div className="mt-2">
                  {getDiffBadge(selectedA.analysis_result.overall_score, selectedB.analysis_result.overall_score)}
                </div>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(selectedB.analysis_result.overall_score)}`}>
                  {selectedB.analysis_result.overall_score}
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedB.industry}</p>
              </div>
            </div>
          </div>

          {/* Section Comparison */}
          <div className="card mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Section Comparison</h3>
            <div className="space-y-5">
              {Object.keys(selectedA.analysis_result.section_scores || {}).map(section => {
                const scoreA = selectedA.analysis_result.section_scores[section] || 0
                const scoreB = selectedB.analysis_result.section_scores[section] || 0
                return (
                  <div key={section}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800 capitalize w-1/3">
                        {SECTION_LABELS[section] || section.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-3 w-2/3">
                        <span className={`text-sm font-bold w-8 text-right ${getScoreColor(scoreA)}`}>{scoreA}</span>
                        <div className="flex-1 flex gap-1">
                          {/* Bar A - right aligned */}
                          <div className="flex-1 flex justify-end">
                            <div
                              className={`h-5 rounded-l-md ${getScoreBg(scoreA)} transition-all duration-500`}
                              style={{ width: `${scoreA}%` }}
                            />
                          </div>
                          <div className="w-px bg-gray-300"></div>
                          {/* Bar B - left aligned */}
                          <div className="flex-1">
                            <div
                              className={`h-5 rounded-r-md ${getScoreBg(scoreB)} transition-all duration-500`}
                              style={{ width: `${scoreB}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-bold w-8 ${getScoreColor(scoreB)}`}>{scoreB}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">← Pitch A ({selectedA.industry})</span>
              <span className="text-xs text-gray-400">Pitch B ({selectedB.industry}) →</span>
            </div>
          </div>

          {/* Feedback Comparison */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Feedback Comparison</h3>
            <div className="space-y-6">
              {Object.keys(selectedA.analysis_result.feedback || {}).map(section => (
                <div key={section} className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2">
                    <h4 className="font-semibold text-gray-800 capitalize text-sm">
                      {SECTION_LABELS[section] || section.replace(/_/g, ' ')}
                    </h4>
                  </div>
                  <div className="grid md:grid-cols-2 divide-x divide-gray-100">
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-lg font-bold ${getScoreColor(selectedA.analysis_result.section_scores?.[section] || 0)}`}>
                          {selectedA.analysis_result.section_scores?.[section] || 0}
                        </span>
                        <span className="text-xs text-gray-400">{selectedA.industry}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedA.analysis_result.feedback?.[section] || 'No feedback'}
                      </p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-lg font-bold ${getScoreColor(selectedB.analysis_result.section_scores?.[section] || 0)}`}>
                          {selectedB.analysis_result.section_scores?.[section] || 0}
                        </span>
                        <span className="text-xs text-gray-400">{selectedB.industry}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedB.analysis_result.feedback?.[section] || 'No feedback'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Link to="/dashboard" className="btn-secondary flex-1 text-center">Back to Dashboard</Link>
            <Link to="/submit" className="btn-primary flex-1 text-center">New Analysis</Link>
          </div>
        </>
      )}
      </div>
    </div>
  )
}

export default PitchCompare
