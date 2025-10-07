import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CoordinatorSidebar from './CoordinatorSidebar'
import CoordinatorHome from './CoordinatorHome'
import CoordinatorTimetable from './CoordinatorTimetable'

const CoordinatorDashboard = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <CoordinatorSidebar user={user} onLogout={onLogout} />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-6"
        >
          <Routes>
            <Route path="/" element={<Navigate to="/coordinator/dashboard/home" replace />} />
            <Route path="/home" element={<CoordinatorHome />} />
            <Route path="/timetable" element={<CoordinatorTimetable />} />
          </Routes>
        </motion.div>
      </div>
    </div>
  )
}

export default CoordinatorDashboard