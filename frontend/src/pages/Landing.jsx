import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'

const Landing = () => {
  const { user } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Pitch Like a <span className="text-primary-600">Pro</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get AI-powered feedback on your startup pitch from investor personas. 
            Simulate VC Q&A sessions and improve your chances of funding.
          </p>
          
          <div className="flex justify-center gap-4">
            {user ? (
              <Link to="/submit" className="btn-primary text-lg px-8 py-4">
                Analyze Your Pitch
              </Link>
            ) : (
              <>
                <button 
                  onClick={() => setShowSignup(true)}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Get Started Free
                </button>
                <button 
                  onClick={() => setShowLogin(true)}
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Log In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why VCRAFT AI?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-primary-600 text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Persona-Aware Analysis
            </h3>
            <p className="text-gray-600">
              Get feedback tailored to specific investor types - from early-stage 
              angels to growth VCs to institutional investors.
            </p>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-primary-600 text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              RAG-Powered Insights
            </h3>
            <p className="text-gray-600">
              Our AI retrieves real VC knowledge from top investors like YC and 
              Sequoia before generating advice - no hallucinations.
            </p>
          </div>

          <div className="card hover:shadow-lg transition-shadow">
            <div className="text-primary-600 text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              VC Q&A Simulator
            </h3>
            <p className="text-gray-600">
              Practice answering tough investor questions. Get scored on logic, 
              metrics, and clarity before your real pitch.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Submit Pitch</h3>
              <p className="text-sm text-gray-600">
                Enter your startup idea and select investor persona
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AI Analysis</h3>
              <p className="text-sm text-gray-600">
                RAG retrieves VC knowledge, LLM evaluates your pitch
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Get Scores</h3>
              <p className="text-sm text-gray-600">
                Receive section-wise scores and actionable feedback
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">4</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Practice Q&A</h3>
              <p className="text-sm text-gray-600">
                Simulate investor questions and improve your answers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!user && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-primary-600 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Perfect Your Pitch?
            </h2>
            <p className="text-primary-100 mb-8 text-lg">
              Join founders who are using AI to win funding
            </p>
            <button 
              onClick={() => setShowSignup(true)}
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
            >
              Start Analyzing Now
            </button>
          </div>
        </div>
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
