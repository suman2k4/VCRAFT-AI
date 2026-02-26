import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Landing from './pages/Landing'
import Submit from './pages/Submit'
import Dashboard from './pages/Dashboard'
import QASimulator from './pages/QASimulator'
import ChatQA from './pages/ChatQA'
import ProtectedRoute from './components/auth/ProtectedRoute'

function AppLayout() {
  const location = useLocation()
  const isChatPage = location.pathname.startsWith('/chat/')

  return (
    <div className="min-h-screen flex flex-col">
      {!isChatPage && <Navbar />}
      <main className="flex-grow">
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
        </Routes>
      </main>
      {!isChatPage && <Footer />}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  )
}

export default App
