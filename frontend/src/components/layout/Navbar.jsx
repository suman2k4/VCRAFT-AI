import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginForm from '../auth/LoginForm'
import SignupForm from '../auth/SignupForm'

const Navbar = () => {
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
      setMobileOpen(false)
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center group" onClick={() => setMobileOpen(false)}>
                <span className="text-2xl font-extrabold text-gradient bg-gradient-to-r from-primary-500 to-orange-400 group-hover:from-primary-600 group-hover:to-orange-500 transition-all">VCRAFT</span>
                <span className="text-2xl font-light text-gray-400 ml-1">AI</span>
              </Link>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link 
                    to="/submit" 
                    className="text-gray-600 hover:text-primary-600 font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary-500 after:transition-all hover:after:w-full"
                  >
                    Analyze Pitch
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-600 hover:text-primary-600 font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary-500 after:transition-all hover:after:w-full"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/deck" 
                    className="text-gray-600 hover:text-primary-600 font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary-500 after:transition-all hover:after:w-full"
                  >
                    Deck AI
                  </Link>
                  <Link 
                    to="/compare" 
                    className="text-gray-600 hover:text-primary-600 font-medium transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary-500 after:transition-all hover:after:w-full"
                  >
                    Compare
                  </Link>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 max-w-[150px] truncate">{user.email}</span>
                    <button 
                      onClick={handleLogout}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => setShowSignup(true)}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-gray-700 hover:text-primary-600 p-2"
                aria-label="Toggle menu"
              >
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
            <div className="px-4 py-4 space-y-3">
              {user ? (
                <>
                  <div className="text-sm text-gray-500 pb-2 border-b border-gray-100 truncate">
                    {user.email}
                  </div>
                  <Link 
                    to="/submit" 
                    className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Analyze Pitch
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/deck" 
                    className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Deck AI
                  </Link>
                  <Link 
                    to="/compare" 
                    className="block text-gray-700 hover:text-primary-600 font-medium py-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    Compare Pitches
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="btn-secondary w-full text-sm mt-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => { setShowLogin(true); setMobileOpen(false) }}
                    className="block w-full text-left text-gray-700 hover:text-primary-600 font-medium py-2"
                  >
                    Log In
                  </button>
                  <button 
                    onClick={() => { setShowSignup(true); setMobileOpen(false) }}
                    className="btn-primary w-full text-sm"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

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
    </>
  )
}

export default Navbar
