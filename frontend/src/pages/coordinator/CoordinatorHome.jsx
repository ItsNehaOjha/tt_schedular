import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Loader, X, Eye, Edit, Trash2 } from 'lucide-react'
import { timetableAPI } from '../../utils/api'
import toast from 'react-hot-toast'

const CoordinatorHome = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState([
    { icon: Calendar, label: 'Timetables', value: '0', color: 'bg-purple-500', loading: true },
  ])
  const [showTimetableList, setShowTimetableList] = useState(false)
  const [timetables, setTimetables] = useState([])
  const [loadingTimetables, setLoadingTimetables] = useState(false)

  const quickActions = [
    {
      icon: Calendar,
      label: 'Build Timetable',
      color: 'text-purple-500',
      path: '/coordinator/dashboard/timetable'
    }
  ]

  // Fetch timetable statistics on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await timetableAPI.getTimetableStats()
        if (response.data.success) {
          const { totalTimetables } = response.data.data.overview
          setStats([
            { 
              icon: Calendar, 
              label: 'Timetables', 
              value: totalTimetables.toString(), 
              color: 'bg-purple-500', 
              loading: false 
            },
          ])
        }
      } catch (error) {
        console.error('Error fetching timetable stats:', error)
        toast.error('Failed to load timetable statistics')
        setStats([
          { icon: Calendar, label: 'Timetables', value: '0', color: 'bg-purple-500', loading: false },
        ])
      }
    }

    fetchStats()
  }, [])

  // Fetch all timetables when count is clicked
  const fetchTimetables = async () => {
    try {
      setLoadingTimetables(true)
      const response = await timetableAPI.getTimetables()
      if (response.data.success) {
        setTimetables(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching timetables:', error)
      toast.error('Failed to load timetables')
    } finally {
      setLoadingTimetables(false)
    }
  }

  const handleTimetableCountClick = () => {
    setShowTimetableList(true)
    fetchTimetables()
  }

  const handleEditTimetable = (timetable) => {
    // Store timetable data in localStorage for editing
    localStorage.setItem('coordinatorTimetable_selectedClass', JSON.stringify({
      year: timetable.year === '1' ? '1st Year' : 
            timetable.year === '2' ? '2nd Year' : 
            timetable.year === '3' ? '3rd Year' : 
            timetable.year === '4' ? '4th Year' : timetable.year,
      branch: timetable.branch,
      section: timetable.section,
      semester: timetable.semester,
      academicYear: timetable.academicYear
    }))
    localStorage.setItem('coordinatorTimetable_timetableData', JSON.stringify(timetable))
    localStorage.setItem('coordinatorTimetable_currentStep', 'edit')
    
    navigate('/coordinator/dashboard/timetable')
  }

  const handleDeleteTimetable = async (timetableId) => {
    if (window.confirm('Are you sure you want to delete this timetable?')) {
      try {
        await timetableAPI.deleteTimetable(timetableId)
        toast.success('Timetable deleted successfully')
        fetchTimetables() // Refresh the list
        
        // Update stats
        const response = await timetableAPI.getTimetableStats()
        if (response.data.success) {
          const { totalTimetables } = response.data.data.overview
          setStats([
            { 
              icon: Calendar, 
              label: 'Timetables', 
              value: totalTimetables.toString(), 
              color: 'bg-purple-500', 
              loading: false 
            },
          ])
        }
      } catch (error) {
        console.error('Error deleting timetable:', error)
        toast.error('Failed to delete timetable')
      }
    }
  }

  const handleQuickAction = (path) => {
    navigate(path)
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-8"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              onClick={stat.label === 'Timetables' ? handleTimetableCountClick : undefined}
            >
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.loading ? (
                      <Loader className="w-6 h-6 animate-spin" />
                    ) : (
                      stat.value
                    )}
                  </p>
                  {stat.label === 'Timetables' && (
                    <p className="text-xs text-gray-500 mt-1">Click to view all</p>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-lg p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              onClick={() => handleQuickAction(action.path)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 cursor-pointer"
            >
              <action.icon className={`w-8 h-8 ${action.color} mx-auto mb-2`} />
              <p className="text-sm font-medium text-gray-700">{action.label}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Timetable List Modal */}
      <AnimatePresence>
        {showTimetableList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">All Timetables</h3>
                <button
                  onClick={() => setShowTimetableList(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loadingTimetables ? (
                <div className="flex items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[60vh]">
                  {timetables.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No timetables found</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {timetables.map((timetable) => (
                        <div
                          key={timetable._id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {timetable.year === '1' ? '1st Year' : 
                                 timetable.year === '2' ? '2nd Year' : 
                                 timetable.year === '3' ? '3rd Year' : 
                                 timetable.year === '4' ? '4th Year' : timetable.year} {' '}
                                {timetable.branch.toUpperCase()} - Section {timetable.section}
                              </h4>
                              <p className="text-sm text-gray-600">
                                Semester {timetable.semester} • {timetable.academicYear}
                              </p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  timetable.isPublished 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {timetable.isPublished ? 'Published' : 'Draft'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditTimetable(timetable)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Timetable"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTimetable(timetable._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Timetable"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CoordinatorHome
