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
      {/* Sidebar */}
      <CoordinatorSidebar user={activeUser} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          <Routes>
            <Route path="/" element={<Navigate to="/coordinator/dashboard/home" replace />} />
            <Route path="/home" element={<CoordinatorHome user={activeUser} />} />
            <Route path="/timetable" element={<CoordinatorTimetable user={activeUser} />} />
          </Routes>
        </motion.div>
      </div>
    </div>
  )
}

export default CoordinatorDashboard
