import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Link } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Landing from './pages/Landing'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/ui/ErrorBoundary'

// Lazy-load heavy pages — only downloaded when the user navigates to them
const Submit = lazy(() => import('./pages/Submit'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const QASimulator = lazy(() => import('./pages/QASimulator'))
const ChatQA = lazy(() => import('./pages/ChatQA'))
const PitchCompare = lazy(() => import('./pages/PitchCompare'))
const DeckUpload = lazy(() => import('./pages/DeckUpload'))

// Full-screen loading spinner shown while lazy chunks download
function PageLoader() {
  return (
    <div className="relative flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        {/* Double-ring spinner */}
        <div className="relative w-16 h-16 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-primary-100 animate-spin" style={{ borderTopColor: 'var(--tw-border-opacity, #f97316)' }} />
          <div className="absolute inset-2 rounded-full border-2 border-orange-100 animate-spin" style={{ borderBottomColor: '#fb923c', animationDirection: 'reverse', animationDuration: '0.8s' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-primary-400 to-orange-400 animate-pulse" />
          </div>
        </div>
        <p className="text-gray-400 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

// 404 catch-all page
function NotFound() {
  return (
    <div className="relative flex items-center justify-center min-h-[70vh] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="blob blob-sm bg-primary-200/30 -top-10 -right-10" />
      <div className="blob blob-sm bg-orange-200/30 -bottom-10 -left-10" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 text-center animate-scale-in">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-glass-lg p-12 md:p-16 max-w-md mx-4">
          {/* Large 404 with gradient */}
          <h1 className="text-8xl md:text-9xl font-extrabold text-gradient mb-2 leading-none">404</h1>
          <div className="w-16 h-1 bg-gradient-to-r from-primary-400 to-orange-400 rounded-full mx-auto mb-6" />
          <p className="text-xl text-gray-600 mb-2 font-semibold">Page not found</p>
          <p className="text-gray-400 mb-8 text-sm">The page you're looking for doesn't exist or has been moved.</p>
          <Link
            to="/"
            className="btn-primary text-lg px-8 py-3 shadow-glow-sm group"
          >
            Go Home
            <svg className="inline-block w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

function AppLayout() {
  const location = useLocation()
  const isChatPage = location.pathname.startsWith('/chat/')

  return (
    <div className="min-h-screen flex flex-col">
      {!isChatPage && <Navbar />}
      <main className="flex-grow">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route 
                path="/submit" 
                element={
                  <ProtectedRoute>
                    <Submit />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/qa/:analysisId" 
                element={
                  <ProtectedRoute>
                    <QASimulator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/chat/:analysisId" 
                element={
                  <ProtectedRoute>
                    <ChatQA />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/compare" 
                element={
                  <ProtectedRoute>
                    <PitchCompare />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/deck" 
                element={
                  <ProtectedRoute>
                    <DeckUpload />
                  </ProtectedRoute>
                } 
              />
              {/* 404 catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!isChatPage && <Footer />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppLayout />
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
