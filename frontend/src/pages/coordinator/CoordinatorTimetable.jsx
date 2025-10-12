// src/pages/coordinator/CoordinatorTimetable.jsx
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import TimetableSelector from '../../components/TimetableSelector'
import TimetableGrid from '../../components/TimetableGrid'
import api, { timetableAPI } from '../../utils/api'

const CoordinatorTimetable = () => {
  const [currentStep, setCurrentStep] = useState('selector')
  const [selectedClass, setSelectedClass] = useState(null)
  const [timetableData, setTimetableData] = useState(null)
  const [loading, setLoading] = useState(false)

  const [savedTimetableId, setSavedTimetableId] = useState(null)
  const [isPublished, setIsPublished] = useState(false)

  // === Helper to unwrap axios responses ===
  const unwrapResponse = (response) => {
    if (!response) return null
    if (response.data?.data) return response.data.data
    if (response.data?.year) return response.data
    return response
  }
  // src/pages/coordinator/CoordinatorTimetable.jsx
// ...imports unchanged...

// inside component:

// === Fetch existing timetable ===
const fetchExistingTimetable = async (classData) => {
  try {
    setLoading(true)
    // FIX: use viewTimetable instead of /timetable/class (404)
    const response = await timetableAPI.viewTimetable({
      year: classData.year,
      branch: classData.branch,
      section: classData.section,
      semester: classData.semester,
      academicYear: classData.academicYear
    })
    const data = unwrapResponse(response)
    if (data) {
      setTimetableData(data)
      setSavedTimetableId(data._id || data.id)
      setIsPublished(Boolean(data.isPublished))
    } else {
      setTimetableData(null)
      setSavedTimetableId(null)
      setIsPublished(false)
    }
  } catch (err) {
    console.error('Fetch timetable error:', err)
    if (err.response?.status === 404) {
      setTimetableData(null)
    } else {
      toast.error('Failed to fetch timetable')
    }
  } finally {
    setLoading(false)
  }
}


  // === Load saved state & fetch backend version ===
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem('coordinatorTimetable_currentStep')
      const savedClass = localStorage.getItem('coordinatorTimetable_selectedClass')
      const savedData = localStorage.getItem('coordinatorTimetable_timetableData')

      if (savedStep && savedClass) {
        setCurrentStep(savedStep)
        const classData = JSON.parse(savedClass)
        setSelectedClass(classData)

        let parsed = null
        try {
          if (savedData) parsed = JSON.parse(savedData)
        } catch (e) {
          console.warn('Failed to parse saved timetableData', e)
        }

        if (parsed) {
          setTimetableData(parsed)
          setSavedTimetableId(parsed._id || parsed.id || null)
          setIsPublished(Boolean(parsed.isPublished))
        }

        fetchExistingTimetable(classData)
      } else {
        setCurrentStep('selector')
      }
    } catch (err) {
      console.error('State load error:', err)
    }
  }, [])

  useEffect(() => {
    if (selectedClass)
      localStorage.setItem('coordinatorTimetable_selectedClass', JSON.stringify(selectedClass))
  }, [selectedClass])

  useEffect(() => {
    if (timetableData)
      localStorage.setItem('coordinatorTimetable_timetableData', JSON.stringify(timetableData))
  }, [timetableData])

  useEffect(() => {
    const isInitialLoad = !selectedClass && !timetableData
    if (!isInitialLoad)
      localStorage.setItem('coordinatorTimetable_currentStep', currentStep)
  }, [currentStep, selectedClass, timetableData])

  // === Fetch existing timetable ===
 

  const handleClassSelection = async (classData) => {
    setSelectedClass(classData)
    setCurrentStep('grid')
    await fetchExistingTimetable(classData)
  }

  const handleBackToSelector = () => {
    localStorage.removeItem('coordinatorTimetable_selectedClass')
    localStorage.removeItem('coordinatorTimetable_timetableData')
    setSelectedClass(null)
    setTimetableData(null)
    setSavedTimetableId(null)
    setIsPublished(false)
    setCurrentStep('selector')
  }

  const handleEditTimetable = () => setCurrentStep('edit')
  const handleBackToGrid = () => setCurrentStep('grid')

  // === Sanitize schedule ===
  const sanitizeSchedule = (schedule) => {
    if (Array.isArray(schedule)) return schedule
    const result = []
    Object.entries(schedule || {}).forEach(([day, timeSlots]) => {
      Object.entries(timeSlots || {}).forEach(([slot, cell]) => {
        if (cell && (cell.subject || cell.teacher)) {
          result.push({
            day,
            timeSlot: slot,
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
    return result
  }

  // === Save Timetable ===
  const handleSaveTimetable = async (data) => {
    try {
      const toastId = toast.loading('Saving timetable...')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const coordinatorId = user.id || user._id
      if (!coordinatorId) {
        toast.dismiss(toastId)
        return toast.error('Login required.')
      }

      const sanitized = sanitizeSchedule(data.schedule)
      const payload = {
        year: data.year || selectedClass?.year,
        branch: (data.branch || selectedClass?.branch || '').toLowerCase(),
        section: data.section || selectedClass?.section,
        semester: data.semester || selectedClass?.semester,
        academicYear: data.academicYear || selectedClass?.academicYear,
        schedule: sanitized,
        createdBy: coordinatorId
      }

      let response
      const id = timetableData?._id || timetableData?.id
      if (id) response = await timetableAPI.updateTimetable(id, payload)
      else response = await timetableAPI.createTimetable(payload)

      const saved = unwrapResponse(response)
      if (!saved) throw new Error('Invalid save response')

      setTimetableData(saved)
      setSavedTimetableId(saved._id || saved.id)
      setIsPublished(Boolean(saved.isPublished))

      toast.dismiss(toastId)
      toast.success('Timetable saved successfully!')
      setCurrentStep('grid')
      return saved
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Failed to save timetable')
      throw err
    }
  }

  // === Publish Timetable ===
  const handlePublishTimetable = async (data) => {
    try {
      const toastId = toast.loading('Publishing timetable...')
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const coordinatorId = user.id || user._id
      if (!coordinatorId) {
        toast.dismiss(toastId)
        return toast.error('Login required.')
      }

      const sanitized = sanitizeSchedule(data.schedule)
      const fullPayload = {
        year: data.year || selectedClass?.year,
        branch: (data.branch || selectedClass?.branch || '').toLowerCase(),
        section: data.section || selectedClass?.section,
        semester: data.semester || selectedClass?.semester,
        academicYear: data.academicYear || selectedClass?.academicYear,
        schedule: sanitized,
        isPublished: true
      }

      const id = timetableData?._id || timetableData?.id
      const response = await timetableAPI.publishTimetable(id, fullPayload)

      const published = unwrapResponse(response)
      if (!published) throw new Error('Invalid publish response')

      setTimetableData(published)
      setSavedTimetableId(published._id || published.id)
      setIsPublished(true)

      toast.dismiss(toastId)
      toast.success('Timetable published successfully!')
      setCurrentStep('grid')
      return published
    } catch (err) {
      console.error('Publish error:', err)
      toast.error(
        'Failed to publish timetable: ' + (err.response?.data?.message || err.message)
      )
      throw err
    }
  }

  // === Render Views ===
  if (currentStep === 'selector')
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Calendar className="w-8 h-8 text-purple-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Build Timetable</h1>
          </div>
          <p className="text-gray-600">Select the class to create or edit its timetable</p>
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
              <p className="text-gray-600">View and manage timetable</p>
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
          onPublish={handlePublishTimetable}
          savedTimetableId={savedTimetableId}
          isPublished={isPublished}
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
              <p className="text-gray-600">Modify and update class schedule</p>
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
          savedTimetableId={savedTimetableId}
          isPublished={isPublished}
        />
      </motion.div>
    )

  return null
}

export default CoordinatorTimetable
