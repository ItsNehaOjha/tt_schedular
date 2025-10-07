import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  Calendar, 
  LogOut,
  Settings
} from 'lucide-react'

const CoordinatorSidebar = ({ user, onLogout }) => {
  const navigate = useNavigate()

  // Debug: Log user data to see what's available
  console.log('Current user data in sidebar:', user)

  const menuItems = [
    { path: '/coordinator/dashboard/home', icon: Home, label: 'Home' },
    { path: '/coordinator/dashboard/timetable', icon: Calendar, label: 'Timetable' },
  ]

  return (
    <motion.div
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center">
          <div className="bg-purple-500 w-12 h-12 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">
              {user?.cname || user?.displayName || user?.firstName || 'Coordinator'}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {user?.branch || 'N/A'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Year {user?.year || 'N/A'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">@{user?.username}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors ${
                isActive ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-500' : ''
              }`
            }
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-6 left-0 right-0 px-6">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </motion.div>
  )
}

export default CoordinatorSidebar