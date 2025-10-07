import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Users, Calendar, UserPlus, Settings, Plus } from 'lucide-react'
import TimetableGrid from './TimetableGrid'
import TimetableSelector from './TimetableSelector'
import TeacherManagement from './TeacherManagement'
import { timetableAPI } from '../utils/api'
import toast from 'react-hot-toast'

const CoordinatorFlow = ({ user, onLogout }) => {
  // Load initial state from localStorage
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('coordinatorFlow_activeTab') || 'timetables'
  })
  const [selectedTimetable, setSelectedTimetable] = useState(() => {
    const saved = localStorage.getItem('coordinatorFlow_selectedTimetable')
    return saved ? JSON.parse(saved) : null
  })
  const [timetableMode, setTimetableMode] = useState(() => {
    return localStorage.getItem('coordinatorFlow_timetableMode') || 'student'
  })
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('coordinatorFlow_viewMode') || 'list'
  })

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('coordinatorFlow_activeTab', activeTab)
  }, [activeTab])

  useEffect(() => {
    localStorage.setItem('coordinatorFlow_selectedTimetable', JSON.stringify(selectedTimetable))
  }, [selectedTimetable])

  useEffect(() => {
    localStorage.setItem('coordinatorFlow_timetableMode', timetableMode)
  }, [timetableMode])

  useEffect(() => {
    localStorage.setItem('coordinatorFlow_viewMode', viewMode)
  }, [viewMode])

  // Mock timetable data generator
  const generateMockTimetable = (year, branch, section) => {
    const timeSlots = [
      '8:50-9:40', '9:40-10:30', '10:30-11:20', '11:20-12:10',
      '12:10-1:00', '1:00-1:50', '1:50-2:40', '2:40-3:30'
    ]
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const subjects = ['Math', 'Physics', 'Chemistry', 'English', 'CS']
    const teachers = ['Dr. Smith', 'Prof. Johnson', 'Dr. Brown', 'Ms. Davis', 'Mr. Wilson']
    
    const timetable = {}
    days.forEach(day => {
      timetable[day] = {}
      timeSlots.forEach(slot => {
        if (slot === '12:10-1:00') {
          timetable[day][slot] = { subject: 'LUNCH', teacher: '', type: 'lunch', room: '' }
        } else {
          const randomSubject = subjects[Math.floor(Math.random() * subjects.length)]
          const randomTeacher = teachers[Math.floor(Math.random() * teachers.length)]
          const type = Math.random() > 0.7 ? 'lab' : 'lecture'
          timetable[day][slot] = {
            subject: randomSubject,
            teacher: randomTeacher,
            type: type,
            room: type === 'lab' ? 'Lab-' + Math.floor(Math.random() * 5 + 1) : 'Room-' + Math.floor(Math.random() * 20 + 1)
          }
        }
      })
    })
    
    return {
      id: Date.now(),
      year,
      branch,
      section,
      semester: Math.floor(Math.random() * 8 + 1),
      academicYear: '2024-25',
      schedule: timetable,
      timeSlots,
      days,
      isPublished: false,
      metadata: {
        lastUpdated: new Date().toISOString(),
        createdBy: user?.displayName || user?.cname || 'Coordinator'
      }
    }
  }

  const handleTimetableSelect = (selection) => {
    const mockTimetable = generateMockTimetable(selection.year, selection.branch, selection.section)
    setSelectedTimetable(mockTimetable)
    setViewMode('view')
  }

  const handleCreateNew = () => {
    setSelectedTimetable(null)
    setViewMode('create')
  }

  const handleEdit = () => {
    setViewMode('edit')
  }

  const handleSave = async (scheduleData) => {
    try {
      console.log('CoordinatorFlow handleSave called with:', scheduleData)
      
      if (!selectedTimetable) {
        toast.error('No timetable selected')
        return
      }

      // Prepare the data for saving
      const timetableData = {
        year: selectedTimetable.year,
        branch: selectedTimetable.branch,
        section: selectedTimetable.section,
        semester: selectedTimetable.semester || 1,
        academicYear: selectedTimetable.academicYear || '2024-25',
        schedule: scheduleData
      }

      console.log('Saving timetable data:', timetableData)

      let response
      if (selectedTimetable.id && selectedTimetable.id !== 'new') {
        // Update existing timetable
        response = await timetableAPI.updateTimetable(selectedTimetable.id, timetableData)
      } else {
        // Create new timetable
        response = await timetableAPI.createTimetable(timetableData)
      }

      console.log('Save response:', response)

      // Update the selected timetable with the response data
      const updatedTimetable = {
        ...selectedTimetable,
        ...response.data,
        schedule: scheduleData
      }
      
      setSelectedTimetable(updatedTimetable)
      
      // Ensure we stay in edit mode after saving
      setViewMode('edit')
      
      // Update localStorage to maintain state
      localStorage.setItem('coordinatorFlow_selectedTimetable', JSON.stringify(updatedTimetable))
      localStorage.setItem('coordinatorFlow_viewMode', 'edit')

      toast.success('Timetable saved successfully!')
      
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error.response?.data?.message || 'Failed to save timetable')
    }
  }

  const handlePublish = async (scheduleData) => {
    try {
      console.log('CoordinatorFlow handlePublish called')
      
      if (!selectedTimetable || !selectedTimetable.id) {
        toast.error('Please save the timetable first')
        return
      }

      // First save the current data
      await handleSave(scheduleData)

      // Then publish
      const response = await timetableAPI.publishTimetable(selectedTimetable.id, { isPublished: true })
      
      // Update the selected timetable
      const updatedTimetable = {
        ...selectedTimetable,
        ...response.data,
        isPublished: true
      }
      
      setSelectedTimetable(updatedTimetable)
      
      // Update localStorage
      localStorage.setItem('coordinatorFlow_selectedTimetable', JSON.stringify(updatedTimetable))

      toast.success('Timetable published successfully!')
      
    } catch (error) {
      console.error('Publish error:', error)
      toast.error(error.response?.data?.message || 'Failed to publish timetable')
    }
  }

  const handleBack = () => {
    if (viewMode === 'edit' || viewMode === 'create') {
      if (window.confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
        setViewMode('list')
        setSelectedTimetable(null)
        // Clear related localStorage
        localStorage.removeItem('coordinatorFlow_selectedTimetable')
        localStorage.setItem('coordinatorFlow_viewMode', 'list')
      }
    } else {
      setViewMode('list')
      setSelectedTimetable(null)
      // Clear related localStorage
      localStorage.removeItem('coordinatorFlow_selectedTimetable')
      localStorage.setItem('coordinatorFlow_viewMode', 'list')
    }
  }

  // Clear state when switching tabs
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    if (tabId !== 'timetables') {
      setViewMode('list')
      setSelectedTimetable(null)
      localStorage.removeItem('coordinatorFlow_selectedTimetable')
      localStorage.setItem('coordinatorFlow_viewMode', 'list')
    }
  }

  const tabs = [
    { id: 'timetables', label: 'Timetables', icon: Calendar },
    { id: 'teachers', label: 'Teachers', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Coordinator Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.displayName || user?.cname || 'Coordinator'}
              </p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setViewMode('list')
                    setSelectedTimetable(null)
                  }}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'timetables' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {viewMode === 'list' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Manage Timetables</h2>
                  <button
                    onClick={handleCreateNew}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Timetable</span>
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Timetable Type</h3>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setTimetableMode('student')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          timetableMode === 'student'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Student Timetables
                      </button>
                      <button
                        onClick={() => setTimetableMode('teacher')}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          timetableMode === 'teacher'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Teacher Schedules
                      </button>
                    </div>
                  </div>

                  <TimetableSelector onSelect={handleTimetableSelect} />
                </div>
              </div>
            )}

            {(viewMode === 'view' || viewMode === 'edit') && selectedTimetable && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBack}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ← Back to List
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {viewMode === 'edit' ? 'Edit Timetable' : 'View Timetable'}
                    </h2>
                  </div>
                  {viewMode === 'view' && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Timetable
                    </button>
                  )}
                </div>

                <TimetableGrid
                  timetableData={selectedTimetable}
                  mode={viewMode}
                  isEditable={viewMode === 'edit'}
                  showPDFExport={true}
                  onSave={handleSave}
                  onPublish={handlePublish}
                  onBack={handleBack}
                />
              </div>
            )}

            {viewMode === 'create' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleBack}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ← Back to List
                    </button>
                    <h2 className="text-xl font-semibold text-gray-900">Create New Timetable</h2>
                  </div>
                </div>

                <TimetableGrid
                  mode="create"
                  isEditable={true}
                  onSave={handleSave}
                  onPublish={handlePublish}
                  onBack={handleBack}
                />
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'teachers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TeacherManagement />
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Settings</h2>
              <p className="text-gray-600">Settings panel coming soon...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default CoordinatorFlow