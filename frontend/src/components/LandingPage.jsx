import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { GraduationCap, Users, Settings, UserPlus } from 'lucide-react'

const LandingPage = () => {
  const navigate = useNavigate()

  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'View your class timetable',
      icon: GraduationCap,
      color: 'bg-blue-500',
      path: '/student'
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'View your teaching schedule',
      icon: Users,
      color: 'bg-green-500',
      path: '/teacher'
    },
    {
      id: 'coordinator',
      title: 'Coordinator',
      description: 'Manage timetables and schedules',
      icon: Settings,
      color: 'bg-purple-500',
      path: '/coordinator/login'
    },
  ]

  const handleRoleSelect = (role) => {
    console.log('Navigating to:', role.path) // Debug log
    navigate(role.path)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Smart Timetable Tracker
          </h1>
          <p className="text-xl text-gray-600">
            Select your role to continue
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={() => handleRoleSelect(role)}
            >
              <div className="text-center">
                <div className={`${role.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <role.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  {role.title}
                </h3>
                <p className="text-gray-600">
                  {role.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Coordinator Signup CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <UserPlus className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              New Coordinator?
            </h3>
            <p className="text-gray-600 mb-4">
              Create your coordinator account to start managing timetables and teacher accounts.
            </p>
            <button
              onClick={() => navigate('/coordinator-signup')}
              className="btn-secondary"
            >
              Sign Up as Coordinator
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LandingPage