import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { LogOut, Loader, AlertCircle } from 'lucide-react'
import TimetableGrid from './TimetableGrid'
import { timetableAPI } from '../utils/api'

const TeacherFlow = ({ user, onLogout }) => {
  const {
    data: teacherData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['teacherTimetable', user?.id],
    queryFn: () => timetableAPI.getTeacherTimetable(user.id),
    enabled: !!user?.id,
    refetchInterval: 60000, // Auto-refresh every minute
  })

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load Schedule
          </h2>
          <p className="text-gray-600 mb-4">
            {error.response?.data?.message || 'Something went wrong'}
          </p>
          <button onClick={refetch} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Transform teacher data to match TimetableGrid format
  const transformedData = teacherData?.data ? {
    year: 'Teacher',
    branch: teacherData.data.teacher.name,
    section: 'Schedule',
    schedule: transformTeacherSchedule(teacherData.data.schedule)
  } : null

  return (
    <div className="min-h-screen">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-gray-600">{user?.department}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {transformedData ? (
        <TimetableGrid
          data={transformedData}
          onBack={handleLogout}
          isEditable={false}
          showPDFExport={true}
          onRefresh={refetch}
        />
      ) : (
        <div className="p-8 text-center">
          <p className="text-gray-600">No schedule found</p>
        </div>
      )}
    </div>
  )
}

// Helper function to transform teacher schedule data
const transformTeacherSchedule = (schedule) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const timeSlots = [
    '08:50-09:40',
    '09:40-10:30',
    '10:30-11:20',
    '11:20-12:10',
    '12:10-01:00',
    '01:00-01:50',
    '01:50-02:40',
    '02:40-03:30',
    '09:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-01:00',
    '01:00-02:00', 
    '02:00-03:00',
    '03:00-04:00',
    '04:00-5:00',
  ]

  const scheduleGrid = {}
  
  // Initialize empty schedule
  days.forEach(day => {
    scheduleGrid[day] = {}
    timeSlots.forEach(slot => {
      scheduleGrid[day][slot] = { acronym: '', code: '', teacher: '', type: 'free' }
    })
  })

  // Fill in the actual schedule
  schedule.forEach(item => {
    if (scheduleGrid[item.day] && scheduleGrid[item.day][item.timeSlot]) {
      scheduleGrid[item.day][item.timeSlot] = {
        acronym: item.subject.acronym,
        code: item.subject.code,
        teacher: item.class, // Show class instead of teacher name
        type: item.type,
        room: item.room
      }
    }
  })

  return { days, timeSlots, schedule: scheduleGrid }
}

export default TeacherFlow