import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Bell, RefreshCw, Calendar } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { timetableAPI } from '../../utils/api'

const TeacherDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [teacherSchedule, setTeacherSchedule] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [academicYear, setAcademicYear] = useState('')

  const { teacherName, teacherId } = location.state || {}

  useEffect(() => {
    if (!teacherName || !teacherId) {
      navigate('/teacher')
      return
    }

    fetchTeacherSchedule()
    fetchNotifications()

    const interval = setInterval(() => {
      fetchTeacherSchedule(true)
      fetchNotifications()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [teacherName, teacherId])

  const fetchTeacherSchedule = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const response = await timetableAPI.getTeacherTimetable(teacherId)
      const payload = response.data?.data || {}

      setTeacherSchedule(payload.grid) // {days, timeSlots, schedule}
      setAcademicYear(payload.meta?.latestAcademicYear || '')

      if (isRefresh) toast.success('Schedule refreshed')
    } catch (error) {
      console.error('Error fetching teacher schedule:', error)
      if (error.response?.status === 404) {
        toast.error('No teaching schedule found')
      } else {
        toast.error('Failed to load teaching schedule')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await timetableAPI.getTimetables()
      setNotifications(response.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const renderScheduleGrid = () => {
    if (!teacherSchedule || !teacherSchedule.days || !teacherSchedule.timeSlots) {
      return (
        <div className="p-6 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No teaching schedule found</p>
          <p className="text-sm text-gray-500 mt-2">
            You may not be assigned to any classes yet
          </p>
        </div>
      )
    }

    const { days, timeSlots, schedule } = teacherSchedule

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-3 text-left font-semibold">Time</th>
              {days.map(day => (
                <th key={day} className="border border-gray-300 p-3 text-center font-semibold">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(timeSlot => (
              <tr key={timeSlot}>
                <td className="border border-gray-300 p-3 font-medium bg-gray-50">
                  {timeSlot}
                </td>
                {days.map(day => {
                  const cell = schedule[day]?.[timeSlot]

                  return (
                    <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-2">
                      {!cell ? (
                        <div className="h-16"></div>
                      ) : Array.isArray(cell) ? (
                        cell.map((c, i) => (
                          <div key={i} className="bg-blue-100 rounded p-2 text-sm mb-1">
                            <div className="font-semibold text-blue-900">{c.subject}</div>
                            <div className="text-blue-700">{c.class}</div>
                            <div className="text-blue-600 text-xs">
                              {c.type} • {c.room}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-blue-100 rounded p-2 text-sm">
                          <div className="font-semibold text-blue-900">{cell.subject}</div>
                          <div className="text-blue-700">{cell.class}</div>
                          <div className="text-blue-600 text-xs">
                            {cell.type} • {cell.room}
                          </div>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teaching schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <button
              onClick={() => navigate('/teacher')}
              className="mr-4 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Teaching Schedule - {teacherName}
              </h1>
              <p className="text-gray-600">Academic Year {academicYear || '—'}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {renderScheduleGrid()}
        </motion.div>
      </div>
    </div>
  )
}

export default TeacherDashboard
