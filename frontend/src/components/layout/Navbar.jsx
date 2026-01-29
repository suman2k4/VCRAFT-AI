import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoginForm from '../auth/LoginForm'
import SignupForm from '../auth/SignupForm'

const Navbar = () => {
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-primary-600">VCRAFT</span>
                <span className="text-2xl font-light text-gray-700 ml-1">AI</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link 
                    to="/submit" 
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Analyze Pitch
                  </Link>
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 hover:text-primary-600 font-medium"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">{user.email}</span>
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
          </div>
        </div>
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
