import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// Pages
import LandingPage from './components/LandingPage'
import StudentPage from './pages/student/StudentPage'
import StudentDashboard from './pages/student/StudentDashboard'
import TeacherPage from './pages/teacher/TeacherPage'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import CoordinatorLogin from './components/LoginPage'
import CoordinatorSignup from './components/CoordinatorSignup'
import CoordinatorDashboard from './pages/coordinator/CoordinatorDashboard'
import ProtectedRoute from './components/ProtectedRoute'

// Utils
import { getUser, isAuthenticated, logout } from './utils/auth'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function AppContent() {
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    const handleStorageChange = () => {
      setUser(getUser())
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    logout()
    setUser(null)
    window.location.href = '/' // Force redirect to home
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Student Routes */}
        <Route path="/student" element={<StudentPage />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        
        {/* Teacher Routes (No Login Required) */}
        <Route path="/teacher" element={<TeacherPage />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        
        {/* Coordinator Authentication Routes */}
        <Route path="/coordinator/signup" element={<CoordinatorSignup />} />
        <Route 
          path="/coordinator/login" 
          element={
            isAuthenticated() && user?.role === 'coordinator' ? (
              <Navigate to="/coordinator/dashboard" replace />
            ) : (
              <CoordinatorLogin />
            )
          } 
        />
        
        {/* Protected Coordinator Routes */}
        <Route
          path="/coordinator/dashboard/*"
          element={
            <ProtectedRoute requiredRole="coordinator">
              <CoordinatorDashboard user={user} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Legacy redirects */}
        <Route path="/login" element={<Navigate to="/coordinator/login" replace />} />
        <Route path="/coordinator-signup" element={<Navigate to="/coordinator/signup" replace />} />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
            error: {
              duration: 5000,
              theme: {
                primary: 'red',
                secondary: 'black',
              },
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  )
}

export default App