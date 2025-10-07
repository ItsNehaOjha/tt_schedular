import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import TimetableSelector from './TimetableSelector'
import TimetableGrid from './TimetableGrid'

const StudentFlow = ({ onBack }) => {
  const [selectedTimetable, setSelectedTimetable] = useState(null)
  const [timetableData, setTimetableData] = useState(null)

  const handleTimetableSelect = (selection) => {
    setSelectedTimetable(selection)
    // Mock timetable data - in real app, this would come from API
    setTimetableData({
      year: selection.year,
      branch: selection.branch,
      section: selection.section,
      schedule: generateMockSchedule(),
    })
  }

  const generateMockSchedule = () => {
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
        if (index === 3) { // Lunch time
          schedule[day][slot] = subjects[5]
        } else {
          schedule[day][slot] = subjects[Math.floor(Math.random() * 5)]
        }
      })
    })

    return { days, timeSlots, schedule }
  }

  if (timetableData) {
    return (
      <TimetableGrid
        data={timetableData}
        onBack={() => setTimetableData(null)}
        isEditable={false}
        showPDFExport={true}
      />
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Student Timetable</h2>
          </div>

          <TimetableSelector onSelect={handleTimetableSelect} />
        </motion.div>
      </div>
    </div>
  )
}

export default StudentFlow