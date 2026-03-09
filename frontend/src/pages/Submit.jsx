import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { analyzePitch, extractPDF } from '../services/api'
import { savePitchAnalysis } from '../services/firestore'
import { useToast } from '../components/ui/Toast'
import AnalysisResult from '../components/pitch/AnalysisResult'

const Submit = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef(null)
  
  const [formData, setFormData] = useState({
    startup_idea: '',
    pitch_deck_text: '',
    investor_stage: 'seed',
    investor_persona: 'saas',
    industry: '',
  })
  
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [pdfFileName, setPdfFileName] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please upload a PDF file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.')
      return
    }

    try {
      setPdfLoading(true)
      setPdfFileName(file.name)
      toast.info('Extracting text from PDF...')
      
      const result = await extractPDF(file)
      
      setFormData(prev => ({
        ...prev,
        pitch_deck_text: prev.pitch_deck_text 
          ? prev.pitch_deck_text + '\n\n--- Extracted from PDF ---\n\n' + result.text
          : result.text,
      }))
      
      toast.success(`Extracted ${result.characters.toLocaleString()} characters from ${result.pages} pages`)
    } catch (err) {
      console.error('PDF extraction failed:', err)
      toast.error(err.response?.data?.detail || 'Failed to extract PDF. Try copying text manually.')
      setPdfFileName('')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.startup_idea.trim() || !formData.industry.trim()) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.startup_idea.trim().length < 50) {
      setError('Startup idea must be at least 50 characters long')
      return
    }

    try {
      setError('')
      setLoading(true)
      toast.info('Analyzing your pitch... This may take 15-30 seconds.')
      
      const result = await analyzePitch({
        ...formData,
        user_id: user.uid,
      })
      
      const firestoreId = await savePitchAnalysis(user.uid, formData, result)
      
      setAnalysisResult({ ...result, analysis_id: firestoreId })
      toast.success(`Analysis complete! Score: ${result.overall_score}/100`)
    } catch (err) {
      setError('Failed to analyze pitch. Please try again.')
      toast.error('Analysis failed. Please check your input and try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (analysisResult) {
    return <AnalysisResult result={analysisResult} />
  }

  return (
    <div className="min-h-screen mesh-gradient relative">
      {/* Decorative blobs */}
      <div className="blob blob-sm bg-primary-300" style={{ top: '5%', right: '10%', animationDelay: '0s' }} />
      <div className="blob blob-sm bg-orange-200" style={{ bottom: '15%', left: '5%', animationDelay: '4s' }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold mb-2">
            <span className="text-gradient">Analyze Your Pitch</span>
          </h1>
          <p className="text-gray-500">
            Get AI-powered feedback tailored to your target investor
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm text-red-600 p-4 rounded-xl mb-6 border border-red-500/20 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {/* PDF Upload Section */}
          <div className="mb-6 p-5 border-2 border-dashed border-white/40 rounded-xl hover:border-primary-400/60 hover:bg-white/30 transition-all duration-300 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-bold text-gray-700 mb-1">Upload Pitch Deck (Optional)</h3>
              <p className="text-sm text-gray-400 mb-3">
                Upload a PDF to auto-extract content for analysis
              </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePDFUpload}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pdfLoading}
              className="btn-secondary text-sm px-4 py-2 inline-flex items-center gap-2"
            >
              {pdfLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  Extracting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  Choose PDF File
                </>
              )}
            </button>
            
            {pdfFileName && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                ✓ {pdfFileName}
              </p>
            )}
          </div>
        </div>

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
          <p className="text-xs text-gray-400 mt-1">
            {formData.startup_idea.length}/50 minimum characters
          </p>
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
          {formData.pitch_deck_text && (
            <p className="text-xs text-gray-400 mt-1">
              {formData.pitch_deck_text.length} characters
            </p>
          )}
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
            placeholder="e.g., FinTech, HealthTech, SaaS, E-commerce, CleanTech"
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
            <option value="deep_tech">Deep Tech VC</option>
            <option value="impact">Impact Investor</option>
          </select>
          
          {/* Persona description card */}
          <div className="mt-3 p-3.5 bg-white/40 backdrop-blur-sm rounded-xl border border-white/30">
            {formData.investor_persona === 'saas' && (
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">📊 SaaS Investor:</span> Focuses on MRR, CAC/LTV, churn, and unit economics. Best for B2B SaaS startups.</p>
            )}
            {formData.investor_persona === 'angel' && (
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">👼 Angel Investor:</span> Cares about founder quality, vision, and market potential. More flexible on metrics.</p>
            )}
            {formData.investor_persona === 'growth_vc' && (
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">🚀 Growth VC:</span> Focused on revenue growth rate, market leadership, and path to IPO.</p>
            )}
            {formData.investor_persona === 'institutional' && (
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">🏛️ Institutional:</span> Risk-averse. Focuses on moats, IP, compliance, and profitability.</p>
            )}
            {formData.investor_persona === 'deep_tech' && (
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">🔬 Deep Tech VC:</span> Specializes in frontier tech (AI, biotech, quantum). Values technical innovation and IP.</p>
            )}
            {formData.investor_persona === 'impact' && (
              <p className="text-sm text-gray-600"><span className="font-semibold text-gray-800">🌍 Impact Investor:</span> Invests for social/environmental impact. Focused on ESG, sustainability, and SDG alignment.</p>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full text-lg flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Analyzing Your Pitch...
            </>
          ) : (
            'Analyze Pitch'
          )}
        </button>
      </form>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-5 mt-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        {[
          { icon: '✓', title: 'Problem Clarity', desc: "We'll evaluate how clearly you define the problem", color: 'from-blue-500 to-cyan-400' },
          { icon: '✓', title: 'Market Opportunity', desc: 'Assessment of your market size and potential', color: 'from-primary-500 to-orange-400' },
          { icon: '✓', title: 'Competitive Moat', desc: 'Analysis of your defensibility and advantages', color: 'from-violet-500 to-purple-400' },
        ].map((card, idx) => (
          <div key={card.title} className="stat-card group animate-fade-in-up" style={{ animationDelay: `${(idx + 3) * 100}ms` }}>
            <div className={`absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br ${card.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
            <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center text-white text-xs font-bold`}>{card.icon}</span>
              {card.title}
            </h3>
            <p className="text-sm text-gray-500">{card.desc}</p>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}

export default Submit
