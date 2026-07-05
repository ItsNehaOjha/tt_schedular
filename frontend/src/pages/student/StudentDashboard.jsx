import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Bell, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { timetableAPI, notificationAPI } from '../../utils/api'
import TimetableGrid from '../../components/TimetableGrid'
import { prepareTimetableForPDF } from '../../utils/prepareTimetableForPDF'  // ✅ Added centralized utility
import { exportToPDF } from '../../utils/pdfExport'  // ✅ Static import (fix for failed dynamic import)

const StudentDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [timetable, setTimetable] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const notificationRef = useRef(null)
  const { year, branch, section } = location.state || {}

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length
  }, [notifications])

  const handleMarkSingleAsRead = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await notificationAPI.markAsRead(id)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async (e) => {
    if (e) e.stopPropagation()
    try {
      const unread = notifications.filter(n => !n.isRead)
      await Promise.all(unread.map(n => notificationAPI.markAsRead(n._id)))
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleDeleteAll = async (e) => {
    if (e) e.stopPropagation()
    const confirmDelete = window.confirm('Are you sure you want to delete all notifications?')
    if (!confirmDelete) return
    try {
      await notificationAPI.deleteAll({ targetAudience: 'students' })
      setNotifications([])
      toast.success('All notifications deleted')
    } catch (error) {
      console.error('Error deleting all notifications:', error)
      toast.error('Failed to delete notifications')
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationAPI.markAsRead(notification._id)
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n))
      } catch (error) {
        console.error('Error marking notification as read on click:', error)
      }
    }
    fetchTimetable(true)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!year || !branch || !section) {
      navigate('/student')
      return
    }

    fetchTimetable()
    fetchNotifications()

    // Auto-refresh every 15 seconds for real-time notification sync
    const interval = setInterval(() => {
      fetchTimetable(true)
      fetchNotifications()
    }, 15 * 1000)

    return () => clearInterval(interval)
  }, [year, branch, section])

  const fetchTimetable = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log('Fetching timetable with:', { year, branch, section })
      const response = await timetableAPI.getTimetableByBranchSection(branch, section, year)
      setTimetable(response.data.data)

      if (isRefresh) toast.success('Timetable refreshed')
    } catch (error) {
      console.error('Error fetching timetable:', error)
      if (error.response?.status !== 404) toast.error('Failed to load timetable')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications({ targetAudience: 'students' })
      const allNotifications = response.data?.data || []
      
      const filtered = allNotifications.filter(n => {
        if (n.relatedTimetable && typeof n.relatedTimetable === 'object') {
          const t = n.relatedTimetable;
          return (
            String(t.year || '').toLowerCase() === String(year || '').toLowerCase() &&
            String(t.branch || '').toLowerCase() === String(branch || '').toLowerCase() &&
            String(t.section || '').toLowerCase() === String(section || '').toLowerCase()
          );
        }
        return !n.relatedTimetable;
      });

      setNotifications(filtered)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  // ✅ Stable static import version — no failed dynamic module issue
  const handleDownloadPDF = () => {
    if (!timetable) {
      toast.error('No timetable data available to download')
      return
    }

    if (!timetable.isPublished) {
      toast.error('Coordinator has not published this timetable yet')
      return
    }

    try {
      const { schedule, days, timeSlots } = prepareTimetableForPDF(timetable)

      const timetableData = {
      year: timetable.year || year,
      branch: timetable.branch || branch,
      section: timetable.section || section,
      semester: timetable.semester || '',
      academicYear: timetable.academicYear || new Date().getFullYear(),
      schedule,
      timeSlots,
      days,
      coordinatorName: timetable.coordinatorName || 'Coordinator'
    }


      console.log('✅ Final processed timetable for PDF:', timetableData)
      exportToPDF(timetableData)
      toast.success('PDF generated successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const handleRefresh = () => {
    fetchTimetable(true)
    fetchNotifications()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timetable...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 p-4 flex flex-col overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex flex-col flex-grow overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <button
              onClick={() => navigate('/student')}
              className="mr-4 p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Timetable - {year} Year {branch} {section}
              </h1>
              <p className="text-gray-600">
                {timetable ? `Academic Year ${timetable.academicYear}` : 'Academic Year 2024-25'}
              </p>
              {timetable?.coordinatorName && (
  <p className="text-sm text-gray-700 mt-1">
    <strong>Published by:</strong> {timetable.coordinatorName}
  </p>
)}

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
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors relative"
              >
                <Bell className="w-6 h-6 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 text-left">
                  <div className="px-4 py-2 border-b border-gray-150 flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">Notifications</span>
                    <div className="flex space-x-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllAsRead} 
                          className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleDeleteAll} 
                          className="text-xs text-red-600 hover:text-red-700 font-semibold"
                        >
                          Delete all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500 text-xs">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div 
                          key={notification._id} 
                          onClick={() => handleNotificationClick(notification)}
                          className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50/40' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-gray-950 text-xs">{notification.title}</span>
                            {!notification.isRead && (
                              <button 
                                onClick={(e) => handleMarkSingleAsRead(notification._id, e)}
                                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium ml-2 shrink-0"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs mt-1 leading-normal">{notification.message}</p>
                          <span className="text-[10px] text-gray-400 block mt-1.5">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
  onClick={handleDownloadPDF}
  disabled={!timetable?.isPublished}
  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
    timetable?.isPublished
      ? 'bg-blue-500 text-white hover:bg-blue-600'
      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
  }`}
>
  <Download className="w-4 h-4 mr-2" />
  {timetable?.isPublished ? 'Download PDF' : 'Not Published'}
</button>

          </div>
        </motion.div>

        {/* Timetable Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden flex-grow flex flex-col"
        >
          {timetable ? (
            <TimetableGrid timetableData={timetable} />
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600">No timetable found for your class</p>
              <p className="text-sm text-gray-500 mt-2">
                Please contact your coordinator if this seems incorrect
              </p>
              <button
                onClick={() => navigate('/student')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Select Different Class
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default StudentDashboard