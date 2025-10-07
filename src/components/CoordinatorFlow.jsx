import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Users, GraduationCap } from 'lucide-react'
import TimetableSelector from './TimetableSelector'
import TimetableGrid from './TimetableGrid'

const CoordinatorFlow = ({ onLogout }) => {
  const [mode, setMode] = useState(null) // 'student' or 'teacher'
  const [selectedTimetable, setSelectedTimetable] = useState(null)
  const [timetableData, setTimetableData] = useState(null)

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode)
  }

  const handleTimetableSelect = (selection) => {
    setSelectedTimetable(selection)
    // Mock timetable data
    setTimetableData({
      ...selection,
      schedule: generateMockSchedule(),
    })
  }

  const generateMockSchedule = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const timeSlots = [
      '8:50-9:40',
      '9:40-10:30',
      '10:30-11:20',
      '11:20-12:10',
      '12:10-1:00',
      '1:00-1:50',
      '1:50-2:40',
      '2:40-3:30',
      '9:00-10:00',
      '10:00-11:00',
      '11:00-12:00',
      '12:00-1:00',
      '1:00-2:00',
      '2:00-3:00',
      '3:00-4:00',
      '4:00-5:00',
    ]

    const subjects = [
      { acronym: 'MATH', code: 'MA101', teacher: 'Dr. Smith' },
      { acronym: 'PHY', code: 'PH101', teacher: 'Prof. Johnson' },
      { acronym: 'CHEM', code: 'CH101', teacher: 'Dr. Brown' },
      { acronym: 'ENG', code: 'EN101', teacher: 'Ms. Davis' },
      { acronym: 'CS', code: 'CS101', teacher: 'Mr. Wilson' },
      { acronym: 'LUNCH', code: '', teacher: '' },
    ]

    const schedule = {}
    days.forEach(day => {
      schedule[day] = {}
      timeSlots.forEach((slot, index) => {
        if (index === 3) {
          schedule[day][slot] = subjects[5]
        } else {
          schedule[day][slot] = subjects[Math.floor(Math.random() * 5)]
        }
      })
    })

    return { days, timeSlots, schedule }
  }

  const handleSave = () => {
    alert('Timetable saved successfully!')
  }

  const handlePublish = () => {
    alert('Timetable published successfully!')
  }

  const handleBack = () => {
    if (timetableData) {
      setTimetableData(null)
    } else if (mode) {
      setMode(null)
    }
  }

  if (timetableData) {
    return (
      <TimetableGrid
        data={timetableData}
        onBack={handleBack}
        isEditable={true}
        onSave={handleSave}
        onPublish={handlePublish}
      />
    )
  }

  if (mode) {
    return (
      <div className="min-h-screen">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Coordinator Dashboard
            </h1>
            <button
              onClick={onLogout}
              className="btn-secondary flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              <div className="flex items-center mb-6">
                <button
                  onClick={handleBack}
                  className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ←
                </button>
                <h2 className="text-2xl font-bold text-gray-900">
                  {mode === 'student' ? 'Manage Student Timetable' : 'Manage Teacher Timetable'}
                </h2>
              </div>

              <TimetableSelector onSelect={handleTimetableSelect} />
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Coordinator Dashboard
          </h1>
          <button
            onClick={onLogout}
            className="btn-secondary flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Select Management Mode
            </h2>
            <p className="text-xl text-gray-600">
              Choose what you want to manage
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={() => handleModeSelect('student')}
            >
              <div className="text-center">
                <div className="bg-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Student Timetables
                </h3>
                <p className="text-gray-600">
                  Manage class schedules and student timetables
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card cursor-pointer hover:shadow-xl transition-shadow duration-300"
              onClick={() => handleModeSelect('teacher')}
            >
              <div className="text-center">
                <div className="bg-green-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Teacher Schedules
                </h3>
                <p className="text-gray-600">
                  Manage teacher assignments and schedules
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CoordinatorFlow