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

  const { teacherName, teacherId } = location.state || {}

  useEffect(() => {
    if (!teacherName || !teacherId) {
      navigate('/teacher')
      return
    }

    fetchTeacherSchedule()
    fetchNotifications()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchTeacherSchedule(true)
      fetchNotifications()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [teacherName, teacherId])

  const fetchTeacherSchedule = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      const response = await timetableAPI.getTeacherTimetable(teacherId)
      setTeacherSchedule(response.data)
      
      if (isRefresh) {
        toast.success('Schedule refreshed')
      }
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

  const handleDownloadPDF = () => {
    // PDF export functionality
    toast.success('PDF download started')
  }

  const handleRefresh = () => {
    fetchTeacherSchedule(true)
    fetchNotifications()
  }

  const renderScheduleGrid = () => {
    if (!teacherSchedule || !teacherSchedule.length) {
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

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const timeSlots = [
      '9:00-10:00', '10:00-11:00', '11:15-12:15', '12:15-1:15',
      '2:15-3:15', '3:15-4:15', '4:30-5:30'
    ]

    // Group schedule by day and time
    const scheduleGrid = {}
    teacherSchedule.forEach(slot => {
      if (!scheduleGrid[slot.day]) {
        scheduleGrid[slot.day] = {}
      }
      scheduleGrid[slot.day][slot.timeSlot] = slot
    })

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
                  const slot = scheduleGrid[day]?.[timeSlot]
                  return (
                    <td key={`${day}-${timeSlot}`} className="border border-gray-300 p-2">
                      {slot ? (
                        <div className="bg-blue-100 rounded p-2 text-sm">
                          <div className="font-semibold text-blue-900">{slot.subject}</div>
                          <div className="text-blue-700">{slot.class}</div>
                          <div className="text-blue-600 text-xs">
                            {slot.type} • {slot.room}
                          </div>
                        </div>
                      ) : (
                        <div className="h-16"></div>
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
        {/* Header */}
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
              <p className="text-gray-600">Academic Year 2024-25</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-6 h-6 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="relative">
              <button className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <Bell className="w-6 h-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
          </div>
        </motion.div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Notifications</h3>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification._id} className="text-sm text-green-800">
                    <span className="font-medium">{notification.title}</span>
                    {notification.message && <span className="ml-2">{notification.message}</span>}
                  </div>
                ))}
                {notifications.length > 3 && (
                  <p className="text-xs text-green-600">+{notifications.length - 3} more notifications</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Teaching Schedule Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          {renderScheduleGrid()}
        </motion.div>

        {/* Summary Stats */}
        {teacherSchedule && teacherSchedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Total Classes</h3>
              <p className="text-2xl font-bold text-green-600">{teacherSchedule.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Subjects</h3>
              <p className="text-2xl font-bold text-green-600">
                {new Set(teacherSchedule.map(s => s.subject)).size}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Classes Taught</h3>
              <p className="text-2xl font-bold text-green-600">
                {new Set(teacherSchedule.map(s => s.class)).size}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default TeacherDashboard