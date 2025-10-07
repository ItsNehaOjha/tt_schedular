import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import TimetableGrid from './TimetableGrid'

const TeacherFlow = ({ onLogout }) => {
  const [teacherData] = useState({
    name: 'Dr. Smith',
    schedule: generateTeacherSchedule(),
  })

  function generateTeacherSchedule() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const timeSlots = [
      '9:00-10:00',
      '10:00-11:00',
      '11:00-12:00',
      '12:00-1:00',
      '1:00-2:00',
      '2:00-3:00',
      '3:00-4:00',
      '4:00-5:00',
    ]

    const classes = [
      { acronym: 'MATH', code: 'MA101', teacher: 'Dr. Smith', class: '1st Year A' },
      { acronym: 'MATH', code: 'MA201', teacher: 'Dr. Smith', class: '2nd Year B' },
      { acronym: 'STAT', code: 'ST101', teacher: 'Dr. Smith', class: '1st Year C' },
      { acronym: 'FREE', code: '', teacher: '', class: '' },
      { acronym: 'LUNCH', code: '', teacher: '', class: '' },
    ]

    const schedule = {}
    days.forEach(day => {
      schedule[day] = {}
      timeSlots.forEach((slot, index) => {
        if (index === 3) { // Lunch time
          schedule[day][slot] = classes[4]
        } else if (Math.random() > 0.3) {
          schedule[day][slot] = classes[Math.floor(Math.random() * 3)]
        } else {
          schedule[day][slot] = classes[3] // Free period
        }
      })
    })

    return { days, timeSlots, schedule }
  }

  const timetableData = {
    year: 'Teacher',
    branch: teacherData.name,
    section: 'Schedule',
    schedule: teacherData.schedule,
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {teacherData.name}
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

      <TimetableGrid
        data={timetableData}
        onBack={onLogout}
        isEditable={false}
        showPDFExport={true}
      />
    </div>
  )
}

export default TeacherFlow