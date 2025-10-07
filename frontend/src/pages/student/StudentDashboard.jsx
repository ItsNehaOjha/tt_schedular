import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Bell, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { timetableAPI } from '../../utils/api'
import TimetableGrid from '../../components/TimetableGrid'

const StudentDashboard = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [timetable, setTimetable] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const { year, branch, section } = location.state || {}

  useEffect(() => {
    if (!year || !branch || !section) {
      navigate('/student')
      return
    }

    fetchTimetable()
    fetchNotifications()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchTimetable(true)
      fetchNotifications()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [year, branch, section])

  const fetchTimetable = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Debug logging to see what values we're working with
      console.log('Fetching timetable with:', { year, branch, section })
      
      // Remove the branch mapping - backend expects the short form (cse, ece, etc.)
      // The backend model stores branches as 'cse', 'ece', etc., not full names
      
      console.log('Calling API with:', { branch, section, year })
      
      // Use the correct endpoint structure from backend routes - now passing year parameter
      const response = await timetableAPI.getTimetableByBranchSection(branch, section, year)
      
      // Fix: Access the nested data property
      setTimetable(response.data.data)  // Changed from response.data to response.data.data
      
      if (isRefresh) {
        toast.success('Timetable refreshed')
      }
    } catch (error) {
      console.error('Error fetching timetable:', error)
      // Don't show toast error for 404 as UI already shows "No timetable found"
      if (error.response?.status !== 404) {
        toast.error('Failed to load timetable')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchNotifications = async () => {
    try {
      // Map frontend branch abbreviations to backend full names
      const branchMapping = {
        'cse': 'Computer Science',
        'ece': 'Electronics',
        'mech': 'Mechanical',
        'civil': 'Civil',
        'eee': 'Electrical',
        'it': 'Information Technology'
      }
      
      const fullBranchName = branchMapping[branch] || branch
      
      const response = await timetableAPI.getTimetables()
      setNotifications(response.data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const handleDownloadPDF = () => {
    if (!timetable) {
      toast.error('No timetable data available to download')
      return
    }

    // Debug: Log the actual timetable structure
    console.log('Timetable data for PDF:', timetable)

    // Import the PDF export utility dynamically
    import('../../utils/pdfExport').then(({ exportToPDF }) => {
      // Convert backend array format to frontend object format for PDF export
      let schedule = {}
      let timeSlots = []
      let days = []

      // Handle backend array format
      if (Array.isArray(timetable.schedule)) {
        // Extract unique days and time slots
        days = [...new Set(timetable.schedule.map(slot => slot.day))].filter(Boolean)
        timeSlots = [...new Set(timetable.schedule.map(slot => slot.timeSlot))].filter(Boolean)
        
        // Convert to object format
        days.forEach(day => {
          schedule[day] = {}
          timeSlots.forEach(slot => {
            schedule[day][slot] = {
              subject: '',
              teacher: '',
              type: 'lecture',
              room: ''
            }
          })
        })
        
        // Populate with actual data
        timetable.schedule.forEach(slot => {
          if (slot.day && slot.timeSlot && schedule[slot.day]) {
            schedule[slot.day][slot.timeSlot] = {
              subject: slot.subject?.acronym || slot.subject?.name || '',
              teacher: slot.teacher?.name || '',
              type: slot.type || 'lecture',
              room: slot.room || ''
            }
          }
        })
      } else if (timetable.schedule && typeof timetable.schedule === 'object') {
        // Handle object format (if already converted)
        schedule = timetable.schedule
        days = Object.keys(schedule)
        timeSlots = days.length > 0 ? Object.keys(schedule[days[0]] || {}) : []
      }

      // Fallback to default values if no data found
      if (days.length === 0) {
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      }
      if (timeSlots.length === 0) {
        const defaultTimeSlots = [
          '8:50 AM-9:40 AM', '9:40 AM-10:30 AM', '10:30 AM-11:20 AM', '11:20 AM-12:10 PM',
          '12:10 PM-1:00 PM', '1:00 PM-1:50 PM', '1:50 PM-2:40 PM', '2:40 PM-3:30 PM'
        ]
      }
      timeSlots = [
        '9:00 AM-10:00 AM', '10:00 AM-11:00 AM', '11:00 AM-12:00 PM', '12:00 PM-1:00 PM',
        '1:00 PM-2:00 PM', '2:00 PM-3:00 PM', '3:00 PM-4:00 PM', '4:00 PM-5:00 PM'
      ]

      const timetableData = {
        year: year || 'Unknown Year',
        branch: branch || 'Unknown Branch', 
        section: section || 'Unknown Section',
        schedule: schedule,
        timeSlots: timeSlots,
        days: days,
        semester: timetable.semester || '',
        academicYear: timetable.academicYear || new Date().getFullYear()
      }
      
      console.log('Processed timetable data for PDF:', timetableData)
      
      try {
        exportToPDF(timetableData)
        toast.success('PDF generated successfully!')
      } catch (error) {
        console.error('Error generating PDF:', error)
        toast.error('Failed to generate PDF. Please try again.')
      }
    }).catch(error => {
      console.error('Error loading PDF export:', error)
      toast.error('Failed to load PDF generator. Please try again.')
    })
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
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Notifications</h3>
              <div className="space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification._id} className="text-sm text-blue-800">
                    <span className="font-medium">{notification.title}</span>
                    {notification.message && <span className="ml-2">{notification.message}</span>}
                  </div>
                ))}
                {notifications.length > 3 && (
                  <p className="text-xs text-blue-600">+{notifications.length - 3} more notifications</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Timetable Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
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