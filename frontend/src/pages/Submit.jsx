import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { analyzePitch } from '../services/api'
import { savePitchAnalysis } from '../services/firestore'
import AnalysisResult from '../components/pitch/AnalysisResult'

const Submit = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    startup_idea: '',
    pitch_deck_text: '',
    investor_stage: 'seed',
    investor_persona: 'saas',
    industry: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.startup_idea.trim() || !formData.industry.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setError('')
      setLoading(true)
      
      // Call API
      const result = await analyzePitch({
        ...formData,
        user_id: user.uid,
      })
      
      // Save to Firestore
      await savePitchAnalysis(user.uid, formData, result)
      
      setAnalysisResult(result)
    } catch (err) {
      setError('Failed to analyze pitch. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (analysisResult) {
    return <AnalysisResult result={analysisResult} />
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Analyze Your Pitch
        </h1>
        <p className="text-gray-600">
          Get AI-powered feedback tailored to your target investor
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        {/* Startup Idea */}
        <div className="mb-6">
          <label className="label">
            Startup Idea <span className="text-red-500">*</span>
          </label>
          <textarea
            name="startup_idea"
            value={formData.startup_idea}
            onChange={handleChange}
            rows={6}
            className="input-field"
            placeholder="Describe your startup in 2-3 paragraphs. What problem are you solving? Who are your customers? What's your solution?"
            required
          />
        </div>

        {/* Pitch Deck Text (Optional) */}
        <div className="mb-6">
          <label className="label">
            Additional Pitch Details (Optional)
          </label>
          <textarea
            name="pitch_deck_text"
            value={formData.pitch_deck_text}
            onChange={handleChange}
            rows={4}
            className="input-field"
            placeholder="Add any additional information from your pitch deck: market size, traction, revenue model, team background, etc."
          />
        </div>

        {/* Industry */}
        <div className="mb-6">
          <label className="label">
            Industry <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g., FinTech, HealthTech, SaaS, E-commerce"
            required
          />
        </div>

        {/* Investor Stage */}
        <div className="mb-6">
          <label className="label">
            Funding Stage <span className="text-red-500">*</span>
          </label>
          <select
            name="investor_stage"
            value={formData.investor_stage}
            onChange={handleChange}
            className="input-field"
          >
            <option value="seed">Seed Stage</option>
            <option value="series_a">Series A</option>
            <option value="series_b">Series B</option>
            <option value="growth">Growth Stage</option>
          </select>
        </div>

        {/* Investor Persona */}
        <div className="mb-8">
          <label className="label">
            Investor Persona <span className="text-red-500">*</span>
          </label>
          <select
            name="investor_persona"
            value={formData.investor_persona}
            onChange={handleChange}
            className="input-field"
          >
            <option value="saas">SaaS-Focused Investor</option>
            <option value="angel">Early-Stage Angel Investor</option>
            <option value="growth_vc">Growth-Stage VC</option>
            <option value="institutional">Conservative Institutional Investor</option>
          </select>
          <p className="text-sm text-gray-500 mt-2">
            Choose the type of investor you're targeting for personalized feedback
          </p>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full text-lg"
        >
          {loading ? 'Analyzing Your Pitch...' : 'Analyze Pitch'}
        </button>
      </form>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="bg-primary-50 p-4 rounded-lg">
          <h3 className="font-bold text-primary-900 mb-2">✓ Problem Clarity</h3>
          <p className="text-sm text-primary-700">
            We'll evaluate how clearly you define the problem
          </p>
        </div>
        <div className="bg-primary-50 p-4 rounded-lg">
          <h3 className="font-bold text-primary-900 mb-2">✓ Market Opportunity</h3>
          <p className="text-sm text-primary-700">
            Assessment of your market size and potential
          </p>
        </div>
        <div className="bg-primary-50 p-4 rounded-lg">
          <h3 className="font-bold text-primary-900 mb-2">✓ Competitive Moat</h3>
          <p className="text-sm text-primary-700">
            Analysis of your defensibility and advantages
          </p>
        </div>
      </div>
    </div>
  )
}

export default Submit
