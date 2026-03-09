import { useState, useRef, useCallback } from 'react'
import { useToast } from '../components/ui/Toast'
import { uploadDeck as apiUploadDeck, analyzeDeck as apiAnalyzeDeck, generateRefinedDeck as apiGenerateRefinedDeck } from '../services/api'

const PERSONAS = [
  { value: 'saas',          label: 'SaaS-Focused',        icon: '💻' },
  { value: 'angel',         label: 'Angel Investor',      icon: '😇' },
  { value: 'growth_vc',     label: 'Growth-Stage VC',     icon: '📈' },
  { value: 'institutional', label: 'Institutional',       icon: '🏦' },
  { value: 'deep_tech',     label: 'Deep Tech VC',        icon: '🔬' },
  { value: 'impact',        label: 'Impact Investor',     icon: '🌍' },
]

const STEP = { UPLOAD: 0, ANALYSIS: 1, REFINE: 2 }

const DeckUpload = () => {
  const toast = useToast()
  const fileInputRef = useRef(null)

  // state
  const [step, setStep]               = useState(STEP.UPLOAD)
  const [dragOver, setDragOver]       = useState(false)
  const [file, setFile]               = useState(null)
  const [persona, setPersona]         = useState('growth_vc')
  const [startupName, setStartupName] = useState('')

  // api results
  const [uploading, setUploading]     = useState(false)
  const [analyzing, setAnalyzing]     = useState(false)
  const [generating, setGenerating]   = useState(false)

  const [deckId, setDeckId]           = useState(null)
  const [slides, setSlides]           = useState([])
  const [structured, setStructured]   = useState(null)
  const [analysis, setAnalysis]       = useState(null)

  const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

  // ---- helpers ----

  const resetAll = () => {
    setStep(STEP.UPLOAD)
    setFile(null)
    setDeckId(null)
    setSlides([])
    setStructured(null)
    setAnalysis(null)
  }

  const handleFile = (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['pptx', 'pdf'].includes(ext)) {
      toast.error('Only .pptx and .pdf files are supported.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10 MB.')
      return
    }
    setFile(f)
  }

  // ---- drag & drop ----

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true) }, [])
  const onDragLeave = useCallback(() => setDragOver(false), [])
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  // ---- API calls ----

  const uploadDeck = async () => {
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${API}/api/upload-deck`, { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Upload failed')
      }
      const data = await res.json()
      setDeckId(data.deck_id)
      setSlides(data.slides)
      toast.success(`Extracted ${data.total_slides} slides (${data.total_characters} chars)`)
      setStep(STEP.ANALYSIS)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  const analyzeDeck = async () => {
    setAnalyzing(true)
    try {
      const fd = new FormData()
      fd.append('deck_id', deckId)
      fd.append('investor_persona', persona)
      const res = await fetch(`${API}/api/analyze-deck`, { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Analysis failed')
      }
      const data = await res.json()
      setStructured(data.structured_sections)
      setAnalysis(data.analysis)
      toast.success(`Deck scored: ${data.analysis.score}/100`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  const generateDeck = async () => {
    setGenerating(true)
    try {
      const fd = new FormData()
      fd.append('deck_id', deckId)
      fd.append('investor_persona', persona)
      fd.append('startup_name', startupName || 'Your Startup')
      const res = await fetch(`${API}/api/generate-refined-deck`, { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Generation failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Refined_Pitch.pptx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Refined pitch deck downloaded!')
      setStep(STEP.REFINE)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  // ---- score colour helper ----
  const scoreColor = (s) => {
    if (s >= 80) return 'text-green-600'
    if (s >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }
  const scoreBg = (s) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // ==================================================================
  // RENDER
  // ==================================================================

  return (
    <div className="min-h-screen mesh-gradient relative">
      <div className="blob blob-sm bg-primary-200" style={{ top: '5%', right: '10%', animationDelay: '0s' }} />
      <div className="blob blob-sm bg-orange-200" style={{ bottom: '20%', left: '5%', animationDelay: '3s' }} />

      <div className="max-w-5xl mx-auto px-4 py-10 relative z-10">
      {/* Header */}
      <div className="text-center mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-extrabold">
          Pitch Deck <span className="text-gradient">Analyzer & Generator</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Upload your PPTX or PDF deck, get AI-powered analysis, and download an investor-ready version.
        </p>
      </div>

      {/* Stepper — Glass */}
      <div className="flex items-center justify-center gap-2 mb-10 text-sm font-medium animate-fade-in">
        {['Upload', 'Analyze', 'Download'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold backdrop-blur-sm transition-all duration-500
              ${step >= i ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-glow-sm' : 'bg-white/40 text-gray-400 border border-white/30'}`}>
              {step > i ? '✓' : i + 1}
            </div>
            <span className={`font-semibold ${step >= i ? 'text-primary-700' : 'text-gray-400'}`}>{label}</span>
            {i < 2 && <div className={`w-12 h-0.5 transition-all duration-500 ${step > i ? 'bg-gradient-to-r from-primary-500 to-primary-400' : 'bg-white/30'}`} />}
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* STEP 1: Upload */}
      {/* ============================================================ */}
      {step === STEP.UPLOAD && (
        <div className="card">
          {/* Drag-and-drop zone */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
              ${dragOver ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
              ${file ? 'border-green-400 bg-green-50' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx,.pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="space-y-2">
                <div className="text-4xl">📄</div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="text-sm text-red-500 hover:text-red-700 underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-5xl text-gray-300">☁️</div>
                <p className="font-medium text-gray-700">
                  Drag & drop your pitch deck here
                </p>
                <p className="text-sm text-gray-400">or click to browse — .pptx and .pdf, max 10 MB</p>
              </div>
            )}
          </div>

          {/* Persona selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investor Persona
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPersona(p.value)}
                  className={`p-3 rounded-lg border text-left transition
                    ${persona === p.value
                      ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-primary-300'}`}
                >
                  <span className="text-lg mr-1">{p.icon}</span>
                  <span className="text-sm font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Startup name */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Startup Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={startupName}
              onChange={(e) => setStartupName(e.target.value)}
              placeholder="Used on the generated title slide"
              className="input-field"
            />
          </div>

          {/* Upload button */}
          <button
            onClick={uploadDeck}
            disabled={!file || uploading}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Extracting slides…
              </>
            ) : '📤 Upload & Extract'}
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 2: Analysis */}
      {/* ============================================================ */}
      {step >= STEP.ANALYSIS && (
        <div className="space-y-6">
          {/* Extracted slides preview */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                📑 Extracted Slides ({slides.length})
              </h2>
              <button
                onClick={resetAll}
                className="text-sm text-primary-600 hover:underline"
              >
                ← Upload another
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 border rounded-lg">
              {slides.map((s) => (
                <div key={s.slide_number} className="px-4 py-3">
                  <span className="text-xs font-semibold text-primary-600 mr-2">
                    Slide {s.slide_number}
                  </span>
                  <span className="text-sm text-gray-700 whitespace-pre-wrap">
                    {s.content.length > 300 ? s.content.slice(0, 300) + '…' : s.content}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Analyze button */}
          {!analysis && (
            <button
              onClick={analyzeDeck}
              disabled={analyzing}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  AI is analyzing your deck…
                </>
              ) : '🧠 Analyze Deck with AI'}
            </button>
          )}

          {/* Analysis results */}
          {analysis && (
            <>
              {/* Score card */}
              <div className="card bg-gradient-to-r from-primary-500/5 to-indigo-500/5 border-primary-500/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Deck Quality Score</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {analysis.score >= 80 ? 'Investor-ready — strong deck!'
                        : analysis.score >= 60 ? 'Good foundation, a few areas to polish'
                        : 'Needs improvement before investor meetings'}
                    </p>
                  </div>
                  <div className={`text-5xl font-extrabold ${scoreColor(analysis.score)}`}>
                    {analysis.score}
                  </div>
                </div>
              </div>

              {/* Missing / Weak sections */}
              {(analysis.missing_sections?.length > 0 || analysis.weak_sections?.length > 0) && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-3">⚠️ Issues Found</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {analysis.missing_sections?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">Missing Sections</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.missing_sections.map((s) => (
                            <span key={s} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {analysis.weak_sections?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-amber-700 mb-1">Weak Metrics</p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.weak_sections.map((s) => (
                            <span key={s} className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-full">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section scores */}
              {analysis.section_scores && Object.keys(analysis.section_scores).length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-4">Section Scores</h3>
                  <div className="space-y-3">
                    {Object.entries(analysis.section_scores).map(([section, score]) => (
                      <div key={section}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-700">{section}</span>
                          <span className={`font-bold ${scoreColor(score)}`}>{score}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${scoreBg(score)}`}
                            style={{ width: `${Math.min(score, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-3">💡 AI Suggestions</h3>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-primary-500 font-bold mt-0.5">→</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Classified sections */}
              {structured && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 mb-3">📋 Classified Sections</h3>
                  <div className="divide-y divide-gray-100 border rounded-lg max-h-80 overflow-y-auto">
                    {Object.entries(structured).map(([section, content]) => (
                      <div key={section} className="px-4 py-3">
                        <span className="text-xs font-bold text-primary-600 uppercase tracking-wide">{section}</span>
                        <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                          {content.length > 400 ? content.slice(0, 400) + '…' : content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate refined deck button */}
              <button
                onClick={generateDeck}
                disabled={generating}
                className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3"
              >
                {generating ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating refined deck…
                  </>
                ) : '✨ Generate Investor-Ready Deck (PPTX)'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* STEP 3: Done */}
      {/* ============================================================ */}
      {step === STEP.REFINE && (
        <div className="card text-center mt-6 animate-scale-in">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-2">
            Refined Deck Downloaded!
          </h2>
          <p className="text-gray-500 mb-6">
            Your AI-refined, investor-ready pitch deck has been saved. Open the .pptx file to review.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={generateDeck} className="btn-primary">
              ⬇️ Download Again
            </button>
            <button onClick={resetAll} className="btn-secondary">
              📤 Upload Another Deck
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default DeckUpload
