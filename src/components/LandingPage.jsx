import React from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Users, Settings } from 'lucide-react'

const LandingPage = ({ onRoleSelect }) => {
  const roles = [
    {
      id: 'student',
      title: 'Student',
      description: 'View your class timetable',
      icon: GraduationCap,
      color: 'bg-blue-500',
    },
    {
      id: 'teacher',
      title: 'Teacher',
      description: 'View your teaching schedule',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      id: 'coordinator',
      title: 'Coordinator',
      description: 'Manage timetables and schedules',
      icon: Settings,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Timetable Management System
          </h1>
          <p className="text-xl text-gray-600">
            Select your role to continue
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={() => onRoleSelect(role.id)}
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
      </div>
    </div>
  )
}

export default LandingPage