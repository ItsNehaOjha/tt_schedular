import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from './components/LandingPage'
import StudentFlow from './components/StudentFlow'
import TeacherFlow from './components/TeacherFlow'
import CoordinatorFlow from './components/CoordinatorFlow'
import LoginPage from './components/LoginPage'

function App() {
  const [currentView, setCurrentView] = useState('landing')
  const [userRole, setUserRole] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleRoleSelection = (role) => {
    setUserRole(role)
    if (role === 'student') {
      setCurrentView('student')
    } else {
      setCurrentView('login')
    }
  }

  const handleLogin = (role) => {
    setIsAuthenticated(true)
    setUserRole(role)
    setCurrentView(role === 'teacher' ? 'teacher' : 'coordinator')
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserRole(null)
    setCurrentView('landing')
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onRoleSelect={handleRoleSelection} />
      case 'student':
        return <StudentFlow onBack={() => setCurrentView('landing')} />
      case 'login':
        return (
          <LoginPage
            onLogin={handleLogin}
            onBack={() => setCurrentView('landing')}
          />
        )
      case 'teacher':
        return <TeacherFlow onLogout={handleLogout} />
      case 'coordinator':
        return <CoordinatorFlow onLogout={handleLogout} />
      default:
        return <LandingPage onRoleSelect={handleRoleSelection} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderCurrentView()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default App
