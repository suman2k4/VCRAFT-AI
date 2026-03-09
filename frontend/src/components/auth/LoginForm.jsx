import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const LoginForm = ({ onClose, onSwitchToSignup }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setError('')
      setMessage('')
      setLoading(true)
      await login(email, password)
      onClose()
    } catch (err) {
      setError('Failed to log in. Check your credentials.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }
    try {
      setError('')
      setLoading(true)
      await resetPassword(email)
      setMessage('Password reset email sent! Check your inbox.')
    } catch (err) {
      setError('Failed to send reset email. Check your email address.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/70 backdrop-blur-2xl rounded-2xl p-8 max-w-md w-full shadow-glass-lg border border-white/30 animate-scale-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-800">Log In</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-white/50 flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm text-red-600 p-3 rounded-xl mb-4 border border-red-500/20">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 backdrop-blur-sm text-emerald-600 p-3 rounded-xl mb-4 border border-emerald-500/20">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="mb-2">
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="mb-6 text-right">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Forgot password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginForm
