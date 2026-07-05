// src/pages/coordinator/CoordinatorTimetable.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Wand2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import TimetableSelector from '../../components/TimetableSelector'
import TimetableGrid from '../../components/TimetableGrid'
import SampleTimetableConfigForm from '../../components/SampleTimetableConfigForm'
import { timetableAPI } from '../../utils/api'

const CoordinatorTimetable = ({ onStepChange }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState('selector')
  const [selectedClass, setSelectedClass] = useState(null)
  const [timetableData, setTimetableData] = useState(null)
  const [loading, setLoading] = useState(false)

  const [savedTimetableId, setSavedTimetableId] = useState(null)
  const [isPublished, setIsPublished] = useState(false)
  
  // Sample Timetable Config Form state
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedDraftId, setGeneratedDraftId] = useState(null)

  // Notify parent dashboard of step changes (to hide/show sidebar)
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep === 'grid' || currentStep === 'edit')
    }
    return () => {
      if (onStepChange) onStepChange(false)
    }
  }, [currentStep, onStepChange])

  // === Extract coordinator's full name from localStorage ===
  const getCoordinatorName = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const salutation = user?.salutation ? `${user.salutation}.` : 'Mr.'
      const first = user?.firstName?.trim() || ''
      const last = user?.lastName?.trim() || ''
      const fullName = [salutation, first, last].filter(Boolean).join(' ').trim()
      
      if (!fullName || fullName === 'Mr.') {
        return user?.cname || user?.displayName || 'Coordinator'
      }
      return fullName
    } catch (err) {
      console.error('Error extracting coordinator name:', err)
      return 'Coordinator'
    }
  }

  const coordinatorName = getCoordinatorName()

  const unwrapResponse = (response) => {
    if (!response) return null
    if (response.data?.data) return response.data.data
    if (response.data?.year) return response.data
    return response
  }

  // === Fetch existing timetable ===
  const fetchExistingTimetable = async (classData) => {
    try {
      setLoading(true)
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

  // === Sample Timetable Generator Handlers ===
  const handleOpenGenerator = () => {
    setShowGenerator(true)
  }

  const handleCloseGenerator = () => {
    setShowGenerator(false)
  }

  const handleGenerationComplete = async (result) => {
    const draftId = typeof result === 'string' ? result : result?.id || result?._id || result?.draftId || null
    const existing = result && typeof result === 'object' && result.existing ? result.existing : null
    setGeneratedDraftId(draftId || null)
    setShowGenerator(false)

    try {
      if (existing) {
        setTimetableData(existing)
        setSavedTimetableId(existing._id || existing.id)
        setIsPublished(Boolean(existing.isPublished))
        setCurrentStep('edit')
        console.log('Existing timetable opened')
        return
      }

      if (selectedClass && draftId) {
        await fetchDraftTimetable(draftId)
        return
      }

      if (selectedClass) {
        setLoading(true)
        try {
          const resp = await timetableAPI.viewTimetable({
            year: selectedClass.year,
            branch: (selectedClass.branch || '').toUpperCase(),
            section: (selectedClass.section || '').toUpperCase(),
            semester: selectedClass.semester,
            academicYear: selectedClass.academicYear
          })
          const data = unwrapResponse(resp)
          if (data) {
            setTimetableData(data)
            setSavedTimetableId(data._id || data.id)
            setIsPublished(Boolean(data.isPublished))
            setCurrentStep('edit')
            console.log('Draft timetable loaded')
            return
          }
        } catch {}

        const listResp = await timetableAPI.getTimetables({
          year: selectedClass.year,
          branch: (selectedClass.branch || '').toUpperCase(),
          section: (selectedClass.section || '').toUpperCase(),
          isPublished: false,
          semester: selectedClass.semester,
          academicYear: selectedClass.academicYear,
          limit: 1
        })
        const listData = listResp?.data?.data
        if (Array.isArray(listData) && listData.length) {
          const draft = listData[0]
          setTimetableData(draft)
          setSavedTimetableId(draft._id || draft.id)
          setIsPublished(Boolean(draft.isPublished))
          setCurrentStep('edit')
          console.log('Draft timetable loaded')
        } else {
          toast.error('Generated timetable not found')
        }
      }
    } catch (err) {
      console.error('Open generated timetable error:', err)
      toast.error(err?.response?.data?.message || 'Failed to open generated timetable')
    } finally {
      setLoading(false)
    }
  }

  const fetchDraftTimetable = async (draftId) => {
    try {
      setLoading(true)
      const response = await timetableAPI.getDraftById(draftId)
      const data = unwrapResponse(response)
      
      if (data) {
        setTimetableData(data)
        setSavedTimetableId(data._id || data.id)
        setIsPublished(false)
        setCurrentStep('edit')
        console.log('Draft timetable loaded successfully')
      }
    } catch (err) {
      console.error('Fetch draft timetable error:', err)
      toast.error('Failed to load draft timetable')
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
        setCurrentStep(savedStep === 'grid' ? 'edit' : savedStep)
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

  const handleClassSelection = async (classData) => {
    setSelectedClass(classData)
    setCurrentStep('edit')
    await fetchExistingTimetable(classData)
  }

  const handleBackToSelector = () => {
    if (location.state?.origin === 'dashboard') {
      localStorage.removeItem('coordinatorTimetable_selectedClass')
      localStorage.removeItem('coordinatorTimetable_timetableData')
      localStorage.removeItem('coordinatorTimetable_currentStep')
      navigate('/coordinator/dashboard/home')
    } else {
      localStorage.removeItem('coordinatorTimetable_selectedClass')
      localStorage.removeItem('coordinatorTimetable_timetableData')
      setSelectedClass(null)
      setTimetableData(null)
      setSavedTimetableId(null)
      setIsPublished(false)
      setCurrentStep('selector')
    }
  }

  const handleEditTimetable = () => setCurrentStep('edit')
  
  const handleBackToGrid = () => {
    if (location.state?.origin === 'dashboard') {
      localStorage.removeItem('coordinatorTimetable_selectedClass')
      localStorage.removeItem('coordinatorTimetable_timetableData')
      localStorage.removeItem('coordinatorTimetable_currentStep')
      navigate('/coordinator/dashboard/home')
    } else {
      localStorage.removeItem('coordinatorTimetable_selectedClass')
      localStorage.removeItem('coordinatorTimetable_timetableData')
      setSelectedClass(null)
      setTimetableData(null)
      setSavedTimetableId(null)
      setIsPublished(false)
      setCurrentStep('selector')
    }
  }

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
    let toastId
    try {
      toastId = toast.loading('Saving timetable...')
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
      toast.success('Timetable saved')
    } catch (err) {
      console.error('Save timetable error:', err)
      toast.error('Failed to save timetable')
    } finally {
      if (toastId) toast.dismiss(toastId)
    }
  }

  const handlePublishTimetable = async (data) => {
    const id = savedTimetableId || timetableData?._id || timetableData?.id
    if (!id) return toast.error('No timetable to publish')
    let toastId
    try {
      toastId = toast.loading('Publishing timetable...')
      const payload = {
        year: data?.year || selectedClass?.year || timetableData?.year,
        branch: (data?.branch || selectedClass?.branch || timetableData?.branch || '').toUpperCase(),
        section: (data?.section || selectedClass?.section || timetableData?.section || '').toUpperCase(),
        semester: data?.semester || selectedClass?.semester || timetableData?.semester,
        academicYear: data?.academicYear || selectedClass?.academicYear || timetableData?.academicYear,
        schedule: data?.schedule || timetableData?.schedule || [],
        isPublished: true,
        coordinatorName: data?.coordinatorName
      }

      if (!payload.year || !payload.branch || !payload.section || !payload.semester || !payload.academicYear) {
        toast.dismiss(toastId)
        return toast.error('Missing class identifiers for publish (year, branch, section, semester, academicYear)')
      }

      const response = await timetableAPI.publishTimetable(id, payload)
      const updated = unwrapResponse(response)
      if (updated) {
        setTimetableData(updated)
        setIsPublished(Boolean(updated.isPublished))
        // Display single success notification
        toast.success('Timetable published successfully.')
      }
    } catch (err) {
      console.error('Publish timetable error:', err)
      toast.error(err?.response?.data?.message || 'Failed to publish timetable')
    } finally {
      if (toastId) toast.dismiss(toastId)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
      
      {/* Selector view */}
      {currentStep === 'selector' && (
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 select-none text-left flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('coordinatorTimetable_selectedClass')
                localStorage.removeItem('coordinatorTimetable_timetableData')
                localStorage.removeItem('coordinatorTimetable_currentStep')
                navigate('/coordinator/dashboard/home')
              }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center mb-1">
                <Calendar className="w-7 h-7 text-purple-500 mr-2.5" />
                <h1 className="text-2xl font-bold text-gray-900 font-sans tracking-tight">Build Timetable</h1>
              </div>
              <p className="text-gray-500 text-xs">Select the class configuration parameters to manage or generate its timetable schedule.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-4 text-left border-b border-gray-150 pb-2">Select Class Details</h2>
            <TimetableSelector 
              onSelect={handleClassSelection} 
              renderActionButton={(selectedData) => (
                selectedData && selectedData.year && selectedData.branch && selectedData.section && selectedData.semester && selectedData.academicYear ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClass(selectedData)
                      handleOpenGenerator()
                    }}
                    className="flex items-center justify-center w-full py-2.5 px-4 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition-colors text-xs font-bold border border-purple-200"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Generate Sample Timetable
                  </button>
                ) : null
              )}
            />
          </div>

          {showGenerator && selectedClass && (
            <SampleTimetableConfigForm
              branch={selectedClass.branch}
              year={selectedClass.year}
              semester={selectedClass.semester}
              sections={selectedClass.section ? [selectedClass.section] : []}
              academicYear={selectedClass.academicYear}
              onClose={handleCloseGenerator}
              onGenerationComplete={handleGenerationComplete}
            />
          )}
        </div>
      )}

      {/* Grid view (Read-only + Action controls inside TimetableGrid header) */}
      {currentStep === 'grid' && (
        <div className="w-full flex-grow overflow-hidden flex flex-col">
          <TimetableGrid
            data={selectedClass}
            timetableData={timetableData}
            onBack={handleBackToSelector}
            isEditable={false}
            showPDFExport={true}
            mode="view"
            onPublish={handlePublishTimetable}
            onEdit={handleEditTimetable}
            savedTimetableId={savedTimetableId}
            isPublished={isPublished}
            coordinatorName={coordinatorName}
          />
        </div>
      )}

      {/* Edit view (Editable + Action controls inside TimetableGrid header) */}
      {currentStep === 'edit' && (
        <div className="w-full flex-grow overflow-hidden flex flex-col">
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
            coordinatorName={coordinatorName}
          />
        </div>
      )}
    </motion.div>
  )
}

export default CoordinatorTimetable
