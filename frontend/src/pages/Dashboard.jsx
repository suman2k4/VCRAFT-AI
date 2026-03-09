import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getUserPitches } from '../services/firestore'

const SECTION_LABELS = {
  problem_clarity: 'Problem',
  market_opportunity: 'Market',
  revenue_model: 'Revenue',
  competitive_moat: 'Moat',
  scalability: 'Scale',
}

const PERSONA_LABELS = {
  saas: '📊 SaaS',
  angel: '👼 Angel',
  growth_vc: '🚀 Growth',
  institutional: '🏛️ Institutional',
  deep_tech: '🔬 Deep Tech',
  impact: '🌍 Impact',
}

/* Animated counter hook */
function useAnimatedCounter(end, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!end) return
    let start = 0
    const step = Math.ceil(end / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setVal(end); clearInterval(timer) }
      else setVal(start)
    }, 16)
    return () => clearInterval(timer)
  }, [end, duration])
  return val
}

const Dashboard = () => {
  const { user } = useAuth()
  const [pitches, setPitches] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('history')
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  useEffect(() => {
    const fetchPitches = async () => {
      try {
        const result = await getUserPitches(user.uid, PAGE_SIZE)
        setPitches(result.pitches)
        setLastDoc(result.lastDoc)
        setHasMore(result.pitches.length === PAGE_SIZE)
      } catch (err) {
        setError('Failed to load pitch history')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchPitches()
  }, [user.uid])

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return
    try {
      setLoadingMore(true)
      const result = await getUserPitches(user.uid, PAGE_SIZE, lastDoc)
      setPitches(prev => [...prev, ...result.pitches])
      setLastDoc(result.lastDoc)
      setHasMore(result.pitches.length === PAGE_SIZE)
    } catch (err) {
      console.error('Failed to load more pitches:', err)
    } finally {
      setLoadingMore(false)
    }
  }

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

  const getScoreGlow = (score) => {
    if (score >= 80) return 'shadow-emerald-500/20'
    if (score >= 60) return 'shadow-amber-500/20'
    return 'shadow-red-500/20'
  }

  const { avgScore, bestScore, industries, sectionAverages, scoreDistribution, recentPitches } = useMemo(() => {
    const avg = pitches.length > 0
      ? Math.round(pitches.reduce((sum, p) => sum + p.analysis_result.overall_score, 0) / pitches.length)
      : 0
    const best = pitches.length > 0
      ? Math.max(...pitches.map(p => p.analysis_result.overall_score))
      : 0
    const ind = new Set(pitches.map(p => p.industry))

    const secAvg = {}
    if (pitches.length > 0) {
      const sections = Object.keys(pitches[0]?.analysis_result?.section_scores || {})
      sections.forEach(section => {
        const scores = pitches.map(p => p.analysis_result?.section_scores?.[section] || 0)
        secAvg[section] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      })
    }

    const dist = { excellent: 0, good: 0, needsWork: 0 }
    pitches.forEach(p => {
      const s = p.analysis_result.overall_score
      if (s >= 80) dist.excellent++
      else if (s >= 60) dist.good++
      else dist.needsWork++
    })

    const recent = [...pitches].reverse().slice(-5)

    return { avgScore: avg, bestScore: best, industries: ind, sectionAverages: secAvg, scoreDistribution: dist, recentPitches: recent }
  }, [pitches])

  // animated counters
  const animTotal = useAnimatedCounter(pitches.length)
  const animAvg = useAnimatedCounter(avgScore)
  const animBest = useAnimatedCounter(bestScore)
  const animInd = useAnimatedCounter(industries.size)

  if (loading) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-primary-200 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-gray-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen mesh-gradient relative">
      {/* Floating decorative blobs */}
      <div className="blob blob-lg bg-primary-300" style={{ top: '-10%', right: '-5%', animationDelay: '0s' }} />
      <div className="blob blob-sm bg-orange-300" style={{ bottom: '20%', left: '-3%', animationDelay: '3s' }} />
      <div className="blob blob-sm bg-amber-200" style={{ top: '40%', right: '10%', animationDelay: '5s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 animate-fade-in-up">
          <div>
            <h1 className="text-4xl font-extrabold mb-2">
              <span className="text-gradient">Dashboard</span>
            </h1>
            <p className="text-gray-500">
              Track your pitch performance & improvements
            </p>
          </div>
          <div className="flex gap-3">
            {pitches.length >= 2 && (
              <Link to="/compare" className="btn-secondary text-sm">
                📊 Compare
              </Link>
            )}
            <Link to="/submit" className="btn-primary">
              ✨ New Analysis
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm text-red-600 p-4 rounded-xl mb-6 border border-red-500/20 animate-fade-in">
            {error}
          </div>
        )}

        {/* Stats Overview — Glass Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5 mb-10">
          {[
            { label: 'Total Pitches', value: animTotal, icon: '🎯', color: 'from-primary-500 to-orange-400' },
            { label: 'Average Score', value: animAvg, icon: '📈', color: 'from-blue-500 to-cyan-400', scoreColored: true },
            { label: 'Best Score', value: animBest, icon: '🏆', color: 'from-emerald-500 to-teal-400', scoreColored: true },
            { label: 'Industries', value: animInd, icon: '🌐', color: 'from-violet-500 to-purple-400' },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="stat-card group animate-fade-in-up"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${stat.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${stat.color}`} />
              </div>
              <div className={`text-3xl font-extrabold mb-1 counter-animate ${stat.scoreColored ? getScoreColor(stat.value) : 'text-gray-800'}`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Navigation — Glassmorphism */}
        <div className="flex gap-2 mb-8 p-1.5 bg-white/30 backdrop-blur-md rounded-xl border border-white/20 w-fit animate-fade-in">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
              activeTab === 'history' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            📋 History
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
              activeTab === 'analytics' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            📊 Analytics
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && pitches.length > 0 && (
          <div className="space-y-6 mb-8 animate-fade-in-up">
            {/* Score Trend */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-primary-500/10 rounded-lg flex items-center justify-center text-sm">📈</span>
                Score Trend
              </h3>
              <div className="flex items-end gap-3 h-44 px-2">
                {recentPitches.map((pitch, idx) => {
                  const score = pitch.analysis_result.overall_score
                  const height = Math.max((score / 100) * 100, 8)
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group" style={{ animationDelay: `${idx * 100}ms` }}>
                      <span className={`text-xs font-bold ${getScoreColor(score)} opacity-0 group-hover:opacity-100 transition-opacity`}>{score}</span>
                      <div className="w-full relative">
                        <div
                          className={`w-full rounded-xl ${getScoreBg(score)} shadow-lg ${getScoreGlow(score)} transition-all duration-700 group-hover:shadow-xl group-hover:scale-105`}
                          style={{ height: `${height * 1.4}px`, minHeight: '12px', animationDelay: `${idx * 150}ms` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 text-center truncate w-full font-medium">
                        {pitch.industry?.slice(0, 6)}
                      </span>
                    </div>
                  )
                })}
              </div>
              {pitches.length > 1 && recentPitches.length >= 2 && (
                <div className="mt-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm ${
                    recentPitches[recentPitches.length - 1].analysis_result.overall_score >
                    recentPitches[0].analysis_result.overall_score
                      ? 'text-emerald-600 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                  }`}>
                    {recentPitches[recentPitches.length - 1].analysis_result.overall_score >
                    recentPitches[0].analysis_result.overall_score ? '↑' : '↓'}
                    {recentPitches[recentPitches.length - 1].analysis_result.overall_score >
                    recentPitches[0].analysis_result.overall_score ? ' Improving' : ' Declining'}
                  </span>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Section Averages */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-sm">🎯</span>
                  Skill Breakdown
                </h3>
                <div className="space-y-4">
                  {Object.entries(sectionAverages).map(([section, avg], idx) => (
                    <div key={section} className="animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm text-gray-600 capitalize font-medium">
                          {section.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(avg)}`}>{avg}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className={`fill ${getScoreBg(avg)}`}
                          style={{ width: `${avg}%`, transitionDelay: `${idx * 100}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Score Distribution */}
              <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <span className="w-8 h-8 bg-violet-500/10 rounded-lg flex items-center justify-center text-sm">📊</span>
                  Score Distribution
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Excellent (80+)', count: scoreDistribution.excellent, color: 'from-emerald-400 to-emerald-500', dot: 'bg-emerald-500' },
                    { label: 'Good (60-79)', count: scoreDistribution.good, color: 'from-amber-400 to-amber-500', dot: 'bg-amber-500' },
                    { label: 'Needs Work (<60)', count: scoreDistribution.needsWork, color: 'from-red-400 to-red-500', dot: 'bg-red-500' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.dot} shadow-sm`}></div>
                      <span className="text-sm text-gray-600 flex-1 font-medium">{item.label}</span>
                      <span className="text-sm font-bold text-gray-800">{item.count}</span>
                      {pitches.length > 0 && (
                        <div className="w-20 h-2 rounded-full bg-gray-200/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                            style={{ width: `${(item.count / pitches.length) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Persona usage */}
                <div className="mt-6 pt-4 border-t border-white/20">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3">Personas Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {[...new Set(pitches.map(p => p.investor_persona))].map(persona => (
                      <span key={persona} className="bg-primary-500/10 text-primary-700 text-xs px-3 py-1.5 rounded-full font-semibold border border-primary-500/10 backdrop-blur-sm">
                        {PERSONA_LABELS[persona] || persona}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && pitches.length === 0 && (
          <div className="card text-center py-16 animate-fade-in-up">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-gray-500 mb-6 text-lg">Analyze at least one pitch to see analytics</p>
            <Link to="/submit" className="btn-primary text-lg px-8">Analyze Your First Pitch</Link>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="animate-fade-in-up">
            {pitches.length === 0 ? (
              <div className="card text-center py-16">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No pitches yet</h3>
                <p className="text-gray-500 mb-6">Start by analyzing your first startup pitch</p>
                <Link to="/submit" className="btn-primary text-lg px-8">
                  ✨ Analyze Your First Pitch
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {pitches.map((pitch, idx) => (
                  <div 
                    key={pitch.id} 
                    className="card group animate-fade-in-up"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">
                            {pitch.industry} Startup
                          </h3>
                          <div className={`w-2 h-2 rounded-full ${pitch.analysis_result.overall_score >= 80 ? 'bg-emerald-500' : pitch.analysis_result.overall_score >= 60 ? 'bg-amber-500' : 'bg-red-500'} animate-pulse-soft`} />
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {pitch.startup_idea}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/30 text-gray-600 font-medium">
                            {pitch.investor_stage.replace('_', ' ')}
                          </span>
                          <span className="bg-primary-500/10 px-2.5 py-1 rounded-lg border border-primary-500/10 text-primary-700 font-medium">
                            {PERSONA_LABELS[pitch.investor_persona] || pitch.investor_persona.replace('_', ' ')}
                          </span>
                          <span className="bg-white/50 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/30 text-gray-500">
                            {new Date(pitch.created_at.seconds * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 sm:ml-6">
                        <div className="text-right">
                          <div className={`text-4xl font-extrabold ${getScoreColor(pitch.analysis_result.overall_score)} drop-shadow-sm`}>
                            {pitch.analysis_result.overall_score}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">SCORE</div>
                        </div>
                      </div>
                    </div>

                    {/* Section scores — mini bar chart */}
                    <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-white/20">
                      {Object.entries(pitch.analysis_result.section_scores).map(([section, score]) => (
                        <div key={section} className="text-center group/sec">
                          <div className="h-1.5 rounded-full bg-gray-200/50 mb-2 overflow-hidden">
                            <div className={`h-full rounded-full ${getScoreBg(score)} transition-all duration-500`} style={{ width: `${score}%` }} />
                          </div>
                          <div className={`text-sm font-bold ${getScoreColor(score)} group-hover/sec:scale-110 transition-transform`}>
                            {score}
                          </div>
                          <div className="text-[10px] text-gray-400 font-medium">
                            {SECTION_LABELS[section] || section.replace(/_/g, ' ').split(' ')[0]}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/20">
                      <Link 
                        to={`/chat/${pitch.id}`}
                        className="btn-primary text-sm py-2 px-4"
                      >
                        💬 Chat Q&A
                      </Link>
                      <Link 
                        to={`/qa/${pitch.id}`}
                        className="btn-secondary text-sm py-2 px-4"
                      >
                        📝 Classic Q&A
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Load More button */}
                {hasMore && (
                  <div className="text-center pt-6">
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn-secondary text-sm inline-flex items-center gap-2"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : 'Load More Pitches'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
