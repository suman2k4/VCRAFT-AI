import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'
import useScrollReveal from '../hooks/useScrollReveal'

// Small reusable reveal wrapper
function Reveal({ children, className = '' }) {
  const ref = useScrollReveal()
  return <div ref={ref} className={`reveal ${className}`}>{children}</div>
}

const FEATURES = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59" />
      </svg>
    ),
    title: 'Persona-Aware Analysis',
    desc: 'Get feedback from 6 investor types — from early-stage angels to deep tech VCs to impact investors.',
    gradient: 'from-orange-400 to-rose-400',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
      </svg>
    ),
    title: 'RAG-Powered Insights',
    desc: 'Our AI retrieves real VC knowledge from top investors like YC and Sequoia — no hallucinations.',
    gradient: 'from-violet-400 to-purple-400',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
    title: 'Interactive VC Chatbot',
    desc: 'Chat with AI investor personas in real-time. Practice tough questions and get scored live.',
    gradient: 'from-cyan-400 to-blue-400',
  },
]

const STEPS = [
  { num: '01', title: 'Submit Pitch', desc: 'Enter your startup idea and select an investor persona.', icon: '🚀' },
  { num: '02', title: 'AI Analysis', desc: 'RAG retrieves VC knowledge, LLM evaluates your pitch.', icon: '🧠' },
  { num: '03', title: 'Get Scores', desc: 'Receive section-wise scores and actionable feedback.', icon: '📊' },
  { num: '04', title: 'Practice Q&A', desc: 'Simulate investor questions and refine your answers.', icon: '💬' },
]

const PILLS = [
  'PDF Pitch Deck Upload',
  'Export Reports as PDF',
  'Analytics Dashboard',
  'Pitch Comparison',
]

const STATS = [
  { value: '6+', label: 'Investor Personas' },
  { value: '10+', label: 'Scoring Criteria' },
  { value: '100%', label: 'AI-Powered' },
]

const Landing = () => {
  const { user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  // hero entrance animation
  const [heroReady, setHeroReady] = useState(false)
  useEffect(() => { setHeroReady(true) }, [])

  return (
    <div className="min-h-screen overflow-hidden">
      {/* ===== HERO ===== */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 mesh-gradient" />
        <div className="noise-overlay" />

        {/* Decorative blobs */}
        <div className="blob blob-lg bg-primary-300/40 -top-32 -left-32" />
        <div className="blob blob-lg bg-orange-200/40 -bottom-40 -right-40" style={{ animationDelay: '2s' }} />
        <div className="blob blob-sm bg-amber-300/30 top-1/4 right-1/6" style={{ animationDelay: '4s' }} />
        <div className="blob blob-sm bg-rose-200/30 bottom-1/4 left-1/6" style={{ animationDelay: '6s' }} />

        {/* Floating glass orbs */}
        <div className="absolute top-20 left-[15%] w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 animate-float hidden lg:block" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 right-[20%] w-14 h-14 rounded-full bg-primary-200/30 backdrop-blur-md border border-white/20 animate-float hidden lg:block" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-[8%] w-10 h-10 rounded-full bg-orange-200/30 backdrop-blur-md border border-white/20 animate-float hidden lg:block" style={{ animationDelay: '5s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center w-full">
          <div className={`transition-all duration-700 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-flex items-center gap-2 px-5 py-2 mb-8 text-sm font-semibold text-primary-700 bg-white/60 backdrop-blur-md border border-white/40 rounded-full shadow-glass">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI-Powered Pitch Intelligence
            </span>
          </div>

          <h1 className={`text-5xl sm:text-6xl md:text-8xl font-extrabold text-gray-900 mb-8 leading-[1.05] tracking-tight transition-all duration-700 delay-100 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Pitch Like a{' '}
            <span className="text-gradient">Pro</span>
          </h1>

          <p className={`text-lg md:text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-200 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Get AI-powered feedback from investor personas. Simulate VC Q&A sessions. 
            Win the funding you deserve.
          </p>

          <div className={`flex flex-col sm:flex-row justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {user ? (
              <Link to="/submit" className="btn-primary text-lg px-10 py-4 group shadow-glow-md">
                Analyze Your Pitch
                <svg className="inline-block w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => setShowSignup(true)}
                  className="btn-primary text-lg px-10 py-4 group shadow-glow-md"
                >
                  Get Started Free
                  <svg className="inline-block w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
                <button 
                  onClick={() => setShowLogin(true)}
                  className="bg-white/60 backdrop-blur-md border border-white/40 text-gray-700 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-white/80 hover:shadow-glass transition-all duration-200 active:scale-[0.98]"
                >
                  Log In
                </button>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className={`flex justify-center gap-6 md:gap-12 transition-all duration-700 delay-[400ms] ${heroReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {STATS.map((s, i) => (
              <div key={i} className="text-center px-4 py-3 bg-white/40 backdrop-blur-md rounded-2xl border border-white/30 shadow-glass min-w-[120px]">
                <div className="text-2xl md:text-3xl font-extrabold text-gradient">{s.value}</div>
                <div className="text-xs md:text-sm text-gray-500 font-medium mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white/50 to-slate-50/80" />
        <div className="noise-overlay" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50/80 backdrop-blur-sm rounded-full border border-primary-100">
                Features
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4">
                Why <span className="text-gradient">VCRAFT AI</span>?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto text-lg">
                Everything you need to refine your pitch and impress investors.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {FEATURES.map((f, i) => (
              <Reveal key={i}>
                <div className="group relative bg-white/60 backdrop-blur-xl rounded-2xl border border-white/40 p-8 shadow-glass hover:shadow-glass-lg transition-all duration-500 hover:-translate-y-2 cursor-default overflow-hidden">
                  {/* Gradient accent on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 rounded-2xl`} />
                  
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} text-white flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.desc}</p>

                  {/* Bottom gradient line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                </div>
              </Reveal>
            ))}
          </div>

          {/* Feature pills */}
          <Reveal className="mt-14">
            <div className="flex flex-wrap justify-center gap-3">
              {PILLS.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/40 text-sm font-medium text-gray-700 hover:border-primary-300 hover:bg-white/80 hover:shadow-glass transition-all duration-300 cursor-default">
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  {p}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="noise-overlay" />

        {/* Decorative blobs */}
        <div className="blob blob-sm bg-violet-200/30 top-20 -right-16" style={{ animationDelay: '1s' }} />
        <div className="blob blob-sm bg-primary-200/30 bottom-20 -left-16" style={{ animationDelay: '3s' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50/80 backdrop-blur-sm rounded-full border border-primary-100">
                Process
              </span>
              <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900">
                How It Works
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-6 lg:gap-8">
            {STEPS.map((s, i) => (
              <Reveal key={i}>
                <div className="group text-center bg-white/50 backdrop-blur-xl rounded-2xl border border-white/40 p-8 shadow-glass hover:shadow-glass-lg hover:-translate-y-1 transition-all duration-500">
                  <div className="relative mx-auto w-16 h-16 mb-6">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-400 to-orange-400 opacity-20 group-hover:opacity-30 transition-opacity rotate-6 group-hover:rotate-12 duration-300" />
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-glow-sm">
                      <span className="text-2xl">{s.icon}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">Step {s.num}</span>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg mt-1">{s.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-1/2 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-primary-200/50 to-transparent" style={{ transform: 'translateY(40px)' }} />
        </div>
      </section>

      {/* ===== CTA ===== */}
      {!user && (
        <section className="relative py-28 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-slate-50/50" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Reveal>
              <div className="relative rounded-3xl overflow-hidden shadow-glass-lg">
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-orange-500 to-primary-600 gradient-animate" />
                {/* Glass overlay for depth */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
                
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                
                <div className="relative z-10 p-12 md:p-20 text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-semibold text-white/90 bg-white/15 backdrop-blur-sm rounded-full border border-white/20">
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                    Free to get started
                  </div>
                  <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                    Ready to Perfect<br className="hidden md:block" /> Your Pitch?
                  </h2>
                  <p className="text-white/80 mb-10 text-lg max-w-lg mx-auto">
                    Join founders who are using AI to win funding. Get real-time feedback from investor personas powered by RAG.
                  </p>
                  <button 
                    onClick={() => setShowSignup(true)}
                    className="bg-white text-primary-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-white/90 hover:shadow-2xl transition-all duration-300 active:scale-[0.98] shadow-xl"
                  >
                    Start Analyzing Now
                    <svg className="inline-block w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {showLogin && (
        <LoginForm 
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false)
            setShowSignup(true)
          }}
        />
      )}

      {showSignup && (
        <SignupForm 
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false)
            setShowLogin(true)
          }}
        />
      )}
    </div>
  )
}

export default Landing
