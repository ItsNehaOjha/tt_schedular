import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import TimetableSelector from '../../components/TimetableSelector'
import TimetableGrid from '../../components/TimetableGrid'
import { timetableAPI } from '../../utils/api'

const CoordinatorTimetable = () => {
  const [currentStep, setCurrentStep] = useState('selector')
  const [selectedClass, setSelectedClass] = useState(null)
  const [timetableData, setTimetableData] = useState(null)
  const [loading, setLoading] = useState(false)

  // === Load saved state from localStorage ===
  useEffect(() => {
    console.log('🔍 CoordinatorTimetable useEffect triggered')
    try {
      const savedStep = localStorage.getItem('coordinatorTimetable_currentStep')
      const savedClass = localStorage.getItem('coordinatorTimetable_selectedClass')
      const savedData = localStorage.getItem('coordinatorTimetable_timetableData')

      console.log('📦 localStorage values:', { 
        savedStep, 
        savedClass: savedClass ? 'exists' : 'null', 
        savedData: savedData ? 'exists' : 'null' 
      })

      if (savedStep && savedClass) {
        console.log('✅ Setting up from localStorage - step:', savedStep)
        setCurrentStep(savedStep)
        const classData = JSON.parse(savedClass)
        setSelectedClass(classData)
        
        if (savedData) {
          console.log('📊 Loading timetable data from localStorage')
          setTimetableData(JSON.parse(savedData))
        }
        
        // Always fetch fresh data when in edit or grid mode to ensure we have the latest version
        if (savedStep === 'edit' || savedStep === 'grid') {
          console.log('🔄 Fetching fresh data for step:', savedStep)
          fetchExistingTimetable(classData)
        }
      } else {
        console.log('❌ Missing localStorage data - showing selector')
      }
    } catch (err) {
      console.error('❗ State load error:', err)
      // Don't clear localStorage immediately, might be a temporary parsing issue
    }
  }, [])

  // === Persist selections ===
  useEffect(() => {
    if (selectedClass)
      localStorage.setItem('coordinatorTimetable_selectedClass', JSON.stringify(selectedClass))
  }, [selectedClass])

  useEffect(() => {
    if (timetableData)
      localStorage.setItem('coordinatorTimetable_timetableData', JSON.stringify(timetableData))
  }, [timetableData])

  useEffect(() => {
    // Only persist to localStorage if we're not in the initial load phase
    // This prevents overwriting the saved state during component initialization
    const isInitialLoad = !selectedClass && !timetableData
    if (!isInitialLoad) {
      localStorage.setItem('coordinatorTimetable_currentStep', currentStep)
    }
  }, [currentStep, selectedClass, timetableData])

  // === Fetch existing timetable from backend ===
  const fetchExistingTimetable = async (classData) => {
    try {
      setLoading(true)
      console.log('Fetching timetable for class:', classData)
      
      const response = await timetableAPI.getTimetableByClass({
        year: classData.year,
        branch: classData.branch,
        section: classData.section,
        semester: classData.semester,
        academicYear: classData.academicYear
      })
      
      console.log('Fetched timetable response:', response)
      setTimetableData(response.data || null)
      
    } catch (err) {
      console.error('Fetch timetable error:', err)
      // If timetable doesn't exist, that's okay - we'll create a new one
      if (err.response?.status === 404) {
        console.log('No existing timetable found, will create new one')
        setTimetableData(null)
      } else {
        toast.error('Failed to fetch timetable data')
        setTimetableData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClassSelection = async (classData) => {
    console.log('Class selected:', classData)
    setSelectedClass(classData)
    setCurrentStep('grid')
    
    // Store in localStorage for persistence
    localStorage.setItem('coordinatorTimetable_selectedClass', JSON.stringify(classData))
    localStorage.setItem('coordinatorTimetable_currentStep', 'grid')
    
    await fetchExistingTimetable(classData)
  }

  // === Navigation ===
  const handleBackToSelector = () => {
    const key = selectedClass
      ? `timetable_draft_${selectedClass.branch}_${selectedClass.year}_${selectedClass.section}`
      : null

    if (key && localStorage.getItem(key)) {
      if (!window.confirm('Unsaved changes will be lost. Continue?')) return
      localStorage.removeItem(key)
    }

    localStorage.removeItem('coordinatorTimetable_selectedClass')
    localStorage.removeItem('coordinatorTimetable_timetableData')
    setSelectedClass(null)
    setTimetableData(null)
    setCurrentStep('selector')
  }

  const handleEditTimetable = () => setCurrentStep('edit')
  const handleBackToGrid = () => setCurrentStep('grid')

  // === Sanitize before save/publish ===
  const sanitizeSchedule = (schedule) => {
    // Handle both array and object formats
    if (Array.isArray(schedule)) return schedule

    const sanitized = []
    Object.entries(schedule || {}).forEach(([day, timeSlots]) => {
      Object.entries(timeSlots || {}).forEach(([timeSlot, cell]) => {
        if (cell && (cell.subject || cell.teacher)) {
          sanitized.push({
            day,
            timeSlot,
            subject: {
              acronym: cell.subject || '',
              code: cell.code || '',
              name: cell.name || cell.subject || ''
            },
            teacher: {
              id: cell.teacherId || null,
              name:
                typeof cell.teacher === 'object'
                  ? cell.teacher.name || cell.teacher.username || ''
                  : cell.teacher || '',
              username: cell.teacherUsername || ''
            },
            type: cell.type || 'lecture',
            room: cell.room || ''
          })
        }
      })
    })
    return sanitized
  }

  // === Save timetable ===
  const handleSaveTimetable = async (data) => {
    try {
      const toastId = toast.loading('Saving timetable...')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const coordinatorId = user.id || user._id
      if (!coordinatorId) return toast.error('Login required.')

      const sanitizedSchedule = sanitizeSchedule(data.schedule)
      const timetableToSave = {
        year: data.year || selectedClass?.year,
        branch: data.branch || selectedClass?.branch,
        section: data.section || selectedClass?.section,
        semester: data.semester || selectedClass?.semester,
        academicYear: data.academicYear || selectedClass?.academicYear,
        schedule: sanitizedSchedule,
        createdBy: coordinatorId
      }

      console.log('🧩 Saving Timetable:', timetableToSave)

      const response =
        timetableData?.id || timetableData?._id
          ? await timetableAPI.updateTimetable(timetableData.id || timetableData._id, timetableToSave)
          : await timetableAPI.createTimetable(timetableToSave)

      toast.dismiss(toastId)
      if (response.data) {
        toast.success('Timetable saved successfully!')
        setTimetableData(response.data)
        const key = selectedClass
          ? `timetable_draft_${selectedClass.branch}_${selectedClass.year}_${selectedClass.section}`
          : null
        if (key) localStorage.removeItem(key)
        setCurrentStep('grid')
      } else toast.error('Failed to save timetable.')
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Failed to save timetable: ' + (err.response?.data?.message || err.message))
    }
  }

  // === Publish timetable ===
  const handlePublishTimetable = async (data) => {
    try {
      const toastId = toast.loading('Publishing timetable...')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const coordinatorId = user.id || user._id
      if (!coordinatorId) return toast.error('Login required.')

      const sanitizedSchedule = sanitizeSchedule(data.schedule)
      const timetableToPublish = {
        year: data.year || selectedClass?.year,
        branch: data.branch || selectedClass?.branch,
        section: data.section || selectedClass?.section,
        semester: data.semester || selectedClass?.semester,
        academicYear: data.academicYear || selectedClass?.academicYear,
        schedule: sanitizedSchedule,
        createdBy: coordinatorId,
        isPublished: true,
        publishedAt: new Date().toISOString()
      }

      console.log('🚀 Publishing Timetable:', timetableToPublish)

      const response =
        timetableData?.id || timetableData?._id
          ? await timetableAPI.publishTimetable(timetableData.id || timetableData._id, timetableToPublish)
          : await timetableAPI.createTimetable(timetableToPublish)

      toast.dismiss(toastId)
      if (response.data) {
        toast.success('Timetable published successfully!')
        setTimetableData(response.data)
        const key = selectedClass
          ? `timetable_draft_${selectedClass.branch}_${selectedClass.year}_${selectedClass.section}`
          : null
        if (key) localStorage.removeItem(key)
        setCurrentStep('grid')
      } else toast.error('Failed to publish timetable.')
    } catch (err) {
      console.error('Publish error:', err)
      toast.error('Failed to publish timetable: ' + (err.response?.data?.message || err.message))
    }
  }

  // === Render ===
  console.log('🎨 Rendering - currentStep:', currentStep, 'selectedClass:', selectedClass ? 'exists' : 'null', 'timetableData:', timetableData ? 'exists' : 'null')

  if (currentStep === 'selector')
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Calendar className="w-8 h-8 text-purple-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Build Timetable</h1>
          </div>
          <p className="text-gray-600">Select the class for which you want to create or edit a timetable</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Class Details</h2>
          <TimetableSelector onSelect={handleClassSelection} />
        </div>
      </motion.div>
    )

  if (currentStep === 'grid')
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button onClick={handleBackToSelector} className="mr-4 p-2 rounded-lg hover:bg-gray-200">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Timetable - {selectedClass?.year} {selectedClass?.branch} {selectedClass?.section}
              </h1>
              <p className="text-gray-600">View and manage class timetable</p>
            </div>
          </div>
          <button
            onClick={handleEditTimetable}
            className="flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit Timetable
          </button>
        </div>

        <TimetableGrid
          data={selectedClass}
          timetableData={timetableData}
          onBack={handleBackToSelector}
          isEditable={false}
          showPDFExport={true}
          mode="view"
        />
      </motion.div>
    )

  if (currentStep === 'edit')
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button onClick={handleBackToGrid} className="mr-4 p-2 rounded-lg hover:bg-gray-200">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Edit Timetable - {selectedClass?.year} {selectedClass?.branch} {selectedClass?.section}
              </h1>
              <p className="text-gray-600">Create and modify class schedule</p>
            </div>
          </div>
        </div>

        <TimetableGrid
          data={selectedClass}
          timetableData={timetableData}
          onBack={handleBackToGrid}
          isEditable={true}
          showPDFExport={false}
          onSave={handleSaveTimetable}
          onPublish={handlePublishTimetable}
          mode="edit"
        />
      </motion.div>
    )

  return null
}

export default CoordinatorTimetable
