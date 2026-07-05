import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import CoordinatorSidebar from './CoordinatorSidebar'
import CoordinatorHome from './CoordinatorHome'
import CoordinatorTimetable from './CoordinatorTimetable'

const CoordinatorDashboard = ({ user, onLogout }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeUser, setActiveUser] = useState(user || null)
  const [loading, setLoading] = useState(true)
  const [isEditingTimetable, setIsEditingTimetable] = useState(false)

  // 🔹 Persist user state across refreshes
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    if (storedUser) {
      setActiveUser(storedUser)
    } else if (user) {
      localStorage.setItem('user', JSON.stringify(user))
      setActiveUser(user)
    }
    setLoading(false)
  }, [user])

  // 🔹 Redirect invalid coordinator sessions
  useEffect(() => {
    if (!loading && !activeUser) {
      navigate('/')
    }
  }, [loading, activeUser, navigate])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  // 🔹 Logout cleanup
  const handleLogout = () => {
    localStorage.removeItem('user')
    onLogout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Main Content - Full width layout (no sidebar) */}
      <div className="flex-1 transition-all duration-250 ml-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={isEditingTimetable ? 'p-3' : 'p-6'}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/coordinator/dashboard/home" replace />} />
            <Route path="/home" element={<CoordinatorHome user={activeUser} onLogout={handleLogout} />} />
            <Route 
              path="/timetable" 
              element={<CoordinatorTimetable user={activeUser} onStepChange={setIsEditingTimetable} />} 
            />
          </Routes>
        </motion.div>
      </div>
    </div>
  )
}

export default CoordinatorDashboard
