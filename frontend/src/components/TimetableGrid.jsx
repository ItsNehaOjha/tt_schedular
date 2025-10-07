import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Share, 
  Edit, 
  Plus, 
  Minus, 
  Trash2,
  Copy,
  RotateCcw,
  Settings,
  Clock,
  Undo2,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import EditModal from './EditModal'

const TimetableGrid = ({ 
  data,
  timetableData,
  onBack, 
  isEditable = false, 
  showPDFExport = false,
  onSave,
  onPublish,
  mode = 'view' // 'view', 'edit', 'create'
}) => {
  // Default time slots and days
  const defaultTimeSlots = [
    '8:50 AM-9:40 AM', '9:40 AM-10:30 AM', '10:30 AM-11:20 AM', '11:20 AM-12:10 PM',
    '12:10 PM-1:00 PM', '1:00 PM-1:50 PM', '1:50 PM-2:40 PM', '2:40 PM-3:30 PM'
  ]
  const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  // State management
  const [editingCell, setEditingCell] = useState(null)
  const [editingTimeSlot, setEditingTimeSlot] = useState(null)
  const [timeSlots, setTimeSlots] = useState(defaultTimeSlots)
  const [days, setDays] = useState(defaultDays)
  const [deletedTimeSlots, setDeletedTimeSlots] = useState([]) // Track deleted time slots
  const [timetableInfo, setTimetableInfo] = useState({
    year: '',
    branch: '',
    section: '',
    semester: '',
    academicYear: ''
  })

  // Parse time string to minutes (handle both 12-hour and 24-hour formats)
  const parseTime = (timeStr) => {
    // Remove AM/PM and get the time part
    const cleanTime = timeStr.replace(/\s*(AM|PM)\s*/i, '')
    const [hours, minutes] = cleanTime.split(':').map(Number)
    
    // Check if original string had PM and adjust hours
    const isPM = /PM/i.test(timeStr)
    const isAM = /AM/i.test(timeStr)
    
    let adjustedHours = hours
    if (isPM && hours !== 12) {
      adjustedHours = hours + 12
    } else if (isAM && hours === 12) {
      adjustedHours = 0
    }
    
    return adjustedHours * 60 + minutes
  }

  // Convert minutes to time string with 12-hour format
  const minutesToTime = (minutes) => {
    const hours24 = Math.floor(minutes / 60)
    const mins = minutes % 60
    
    let hours12 = hours24 % 12
    if (hours12 === 0) hours12 = 12
    
    const ampm = hours24 >= 12 ? 'PM' : 'AM'
    
    return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`
  }

  // Parse time slot string
  const parseTimeSlot = (slot) => {
    const [start, end] = slot.split('-')
    return {
      start: parseTime(start),
      end: parseTime(end),
      duration: parseTime(end) - parseTime(start)
    }
  }

  // Create time slot string
  const createTimeSlot = (startMinutes, endMinutes) => {
    return `${minutesToTime(startMinutes)}-${minutesToTime(endMinutes)}`
  }

  // Auto-adjust time slots when one is edited
  const adjustTimeSlots = (editedIndex, newTimeSlot) => {
    const newTimeSlots = [...timeSlots]
    newTimeSlots[editedIndex] = newTimeSlot
    
    const editedSlot = parseTimeSlot(newTimeSlot)
    const newDuration = editedSlot.duration // Use the duration from the edited slot
    
    // Adjust all subsequent time slots using the new duration
    for (let i = editedIndex + 1; i < newTimeSlots.length; i++) {
      const prevSlot = parseTimeSlot(newTimeSlots[i - 1])
      
      // Start the next slot where the previous one ends
      const newStart = prevSlot.end
      const newEnd = newStart + newDuration // Use the new duration for all subsequent slots
      
      newTimeSlots[i] = createTimeSlot(newStart, newEnd)
    }
    
    return newTimeSlots
  }

  // Handle time slot editing
  const handleTimeSlotEdit = (index, newTimeSlot, autoAdjust = true) => {
    let adjustedSlots = [...timeSlots]
    adjustedSlots[index] = newTimeSlot
    
    // Only auto-adjust if the checkbox is checked
    if (autoAdjust) {
      adjustedSlots = adjustTimeSlots(index, newTimeSlot)
    }
    
    setTimeSlots(adjustedSlots)
    
    // Update schedule data with new time slots
    const newSchedule = { ...scheduleData }
    const oldSlot = timeSlots[index]
    
    days.forEach(day => {
      if (newSchedule[day] && newSchedule[day][oldSlot]) {
        const cellData = newSchedule[day][oldSlot]
        delete newSchedule[day][oldSlot]
        newSchedule[day][newTimeSlot] = cellData
      }
    })
    
    // Update all subsequent slots in schedule only if auto-adjust is enabled
    if (autoAdjust) {
      for (let i = index + 1; i < timeSlots.length; i++) {
        const oldSlotName = timeSlots[i]
        const newSlotName = adjustedSlots[i]
        
        if (oldSlotName !== newSlotName) {
          days.forEach(day => {
            if (newSchedule[day] && newSchedule[day][oldSlotName]) {
              const cellData = newSchedule[day][oldSlotName]
              delete newSchedule[day][oldSlotName]
              newSchedule[day][newSlotName] = cellData
            }
          })
        }
      }
    }
    
    setScheduleData(newSchedule)
    setEditingTimeSlot(null)
  }

  // Generate unique localStorage key for this timetable
  const getLocalStorageKey = () => {
    const actualData = timetableData || data
    if (actualData && actualData.branch && actualData.year && actualData.section) {
      return `timetable_draft_${actualData.branch}_${actualData.year}_${actualData.section}`
    }
    return null
  }

  // Save timetable data to localStorage
  const saveToLocalStorage = (scheduleData, timeSlots, days, timetableInfo) => {
    const key = getLocalStorageKey()
    if (key && (mode === 'edit' || isEditable)) {
      try {
        const dataToSave = {
          scheduleData,
          timeSlots,
          days,
          timetableInfo,
          lastModified: new Date().toISOString()
        }
        localStorage.setItem(key, JSON.stringify(dataToSave))
        console.log('Timetable data saved to localStorage:', key)
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }
    }
  }

  // Load timetable data from localStorage
  const loadFromLocalStorage = () => {
    const key = getLocalStorageKey()
    if (key && (mode === 'edit' || isEditable)) {
      try {
        const savedData = localStorage.getItem(key)
        if (savedData) {
          const parsedData = JSON.parse(savedData)
          console.log('Loaded timetable data from localStorage:', key, parsedData)
          return parsedData
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error)
      }
    }
    return null
  }

  // Clear localStorage for this timetable
  const clearLocalTimetableData = () => {
    const key = getLocalStorageKey()
    if (key) {
      try {
        localStorage.removeItem(key)
        console.log('Cleared localStorage for:', key)
        toast.success('Timetable data cleared from local storage')
      } catch (error) {
        console.error('Failed to clear localStorage:', error)
      }
    }
  }

  // Initialize data safely with localStorage integration
  const initializeData = () => {
    const actualData = timetableData || data
    
    // First, try to load from localStorage if in edit mode
    const savedData = loadFromLocalStorage()
    if (savedData && (mode === 'edit' || isEditable)) {
      // Restore from localStorage
      setTimeSlots(savedData.timeSlots || defaultTimeSlots)
      setDays(savedData.days || defaultDays)
      setTimetableInfo(savedData.timetableInfo || {
        year: actualData?.year || '',
        branch: actualData?.branch || '',
        section: actualData?.section || '',
        semester: actualData?.semester || '',
        academicYear: actualData?.academicYear || ''
      })
      
      toast.success('Restored unsaved changes from local storage')
      return savedData.scheduleData
    }
    
    if (actualData) {
      // Set timetable info
      setTimetableInfo({
        year: actualData.year || '',
        branch: actualData.branch || '',
        section: actualData.section || '',
        semester: actualData.semester || '',
        academicYear: actualData.academicYear || ''
      })

      // Get schedule data - handle both array and object formats
      let schedule = actualData.schedule || actualData.timetable || {}
      
      // If schedule is an array (backend format), convert to frontend format
      if (Array.isArray(schedule)) {
        const convertedSchedule = {}
        
        // Initialize empty schedule structure
        defaultDays.forEach(day => {
          convertedSchedule[day] = {}
          defaultTimeSlots.forEach(slot => {
            convertedSchedule[day][slot] = {
              subject: '',
              teacher: '',
              type: 'lecture',
              room: ''
            }
          })
        })
        
        // Populate with actual data
        schedule.forEach(slot => {
          if (slot.day && slot.timeSlot) {
            if (!convertedSchedule[slot.day]) {
              convertedSchedule[slot.day] = {}
            }
            
            convertedSchedule[slot.day][slot.timeSlot] = {
              subject: slot.subject?.acronym || slot.subject?.name || '',
              teacher: slot.teacher?.name || '',
              teacherId: slot.teacher?.id || null,
              teacherUsername: slot.teacher?.username || '',
              type: slot.type || 'lecture',
              room: slot.room || '',
              code: slot.subject?.code || '',
              name: slot.subject?.name || ''
            }
          }
        })
        
        // Extract unique days and time slots from the data
        const existingDays = [...new Set(schedule.map(slot => slot.day))].filter(Boolean)
        const existingTimeSlots = [...new Set(schedule.map(slot => slot.timeSlot))].filter(Boolean)
        
        if (existingDays.length > 0) setDays(existingDays)
        if (existingTimeSlots.length > 0) setTimeSlots(existingTimeSlots)
        
        return convertedSchedule
      }
      
      // Handle object format (legacy frontend format)
      if (Object.keys(schedule).length > 0) {
        const existingDays = Object.keys(schedule)
        const existingTimeSlots = existingDays.length > 0 
          ? Object.keys(schedule[existingDays[0]] || {})
          : defaultTimeSlots
        
        setDays(existingDays.length > 0 ? existingDays : defaultDays)
        setTimeSlots(existingTimeSlots.length > 0 ? existingTimeSlots : defaultTimeSlots)
        
        return schedule
      }
    }

    // Create empty schedule for new timetables
    const emptySchedule = {}
    days.forEach(day => {
      emptySchedule[day] = {}
      timeSlots.forEach(slot => {
        emptySchedule[day][slot] = {
          subject: '',
          teacher: '',
          type: 'lecture',
          room: ''
        }
      })
    })
    
    return emptySchedule
  }

  const [scheduleData, setScheduleData] = useState(() => initializeData())
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize schedule data only once when component mounts
  useEffect(() => {
    if (!isInitialized) {
      const newScheduleData = initializeData()
      setScheduleData(newScheduleData)
      setIsInitialized(true)
    }
  }, [isInitialized])

  // Auto-save to localStorage whenever scheduleData, timeSlots, or days change
  useEffect(() => {
    if (isInitialized && (mode === 'edit' || isEditable)) {
      saveToLocalStorage(scheduleData, timeSlots, days, timetableInfo)
    }
  }, [scheduleData, timeSlots, days, timetableInfo, isInitialized, mode, isEditable])

  // Update timetableInfo when data changes (but don't reset scheduleData)
  useEffect(() => {
    const actualData = timetableData || data
    console.log('useEffect for timetableInfo update:', { actualData, currentTimetableInfo: timetableInfo })
    
    if (actualData) {
      setTimetableInfo(prev => {
        const newTimetableInfo = {
          year: actualData.year || prev.year || '',
          branch: actualData.branch || prev.branch || '',
          section: actualData.section || prev.section || '',
          semester: actualData.semester || prev.semester || '',
          academicYear: actualData.academicYear || prev.academicYear || ''
        }
        
        console.log('Setting new timetableInfo:', newTimetableInfo)
        return newTimetableInfo
      })
    } else {
      // If no actualData, try to extract from URL or other sources
      const urlParams = new URLSearchParams(window.location.search)
      const yearFromUrl = urlParams.get('year')
      const branchFromUrl = urlParams.get('branch') 
      const sectionFromUrl = urlParams.get('section')
      
      if (yearFromUrl || branchFromUrl || sectionFromUrl) {
        setTimetableInfo(prev => ({
          ...prev,
          year: yearFromUrl || prev.year || '',
          branch: branchFromUrl || prev.branch || '',
          section: sectionFromUrl || prev.section || ''
        }))
      }
    }
  }, [data, timetableData])

  // Handle cell editing
  const handleCellClick = (day, timeSlot) => {
    if (isEditable || mode === 'edit' || mode === 'create') {
      const cellData = scheduleData[day]?.[timeSlot] || {
        subject: '',
        teacher: '',
        type: 'lecture',
        room: ''
      }
      setEditingCell({ day, timeSlot, data: cellData })
    }
  }

  const handleSaveCell = (cellData) => {
    console.log('handleSaveCell called with:', cellData)
    console.log('editingCell:', editingCell)
    console.log('current scheduleData:', scheduleData)
    
    const newSchedule = { ...scheduleData }
    if (!newSchedule[editingCell.day]) {
      newSchedule[editingCell.day] = {}
    }

    // Handle lunch - auto-fill entire row (all days for the current time slot)
    if (cellData.fillEntireRow && cellData.type === 'lunch') {
      // Fill all days for the current time slot with lunch
      days.forEach(day => {
        if (!newSchedule[day]) {
          newSchedule[day] = {}
        }
        newSchedule[day][editingCell.timeSlot] = {
          subject: 'LUNCH',
          teacher: '',
          type: 'lunch',
          room: ''
        }
      })
      
      setScheduleData(newSchedule)
      setEditingCell(null)
      return
    }

    // Handle split-lab sessions (B1/B2) - NEW LOGIC
    if (cellData.type === 'split-lab' && cellData.parallelSessions) {
      const currentSlotIndex = timeSlots.indexOf(editingCell.timeSlot)
      const nextSlotIndex = currentSlotIndex + 1

      // Check if next slot is available
      if (nextSlotIndex < timeSlots.length) {
        const nextSlot = timeSlots[nextSlotIndex]
        
        // Check if next slot is empty or can be overwritten
        const nextSlotData = newSchedule[editingCell.day][nextSlot]
        const isNextSlotEmpty = !nextSlotData || (!nextSlotData.subject && !nextSlotData.teacher)
        
        if (isNextSlotEmpty) {
          // Set current slot with split-lab data and merge info
          newSchedule[editingCell.day][editingCell.timeSlot] = {
            type: 'split-lab',
            parallelSessions: cellData.parallelSessions,
            isMerged: true,
            mergeRows: 2,
            isLabSession: true
          }
          
          // Set next slot as hidden (for rowspan effect)
          newSchedule[editingCell.day][nextSlot] = {
            type: 'split-lab-hidden',
            isHidden: true,
            isContinuation: true
          }
          
          console.log('Split lab session updated, new schedule:', newSchedule)
          setScheduleData(newSchedule)
          setEditingCell(null)
          return
        } else {
          toast.error('Next time slot is not available for split lab session')
          return
        }
      } else {
        toast.error('Cannot schedule split lab session - no next time slot available')
        return
      }
    }

    // Handle regular lab sessions with 2-hour duration
    if (cellData.isLabSession && cellData.requiresMultipleSlots && cellData.type !== 'split-lab') {
      const currentSlotIndex = timeSlots.indexOf(editingCell.timeSlot)
      const nextSlotIndex = currentSlotIndex + 1

      // Check if next slot is available
      if (nextSlotIndex < timeSlots.length) {
        const nextSlot = timeSlots[nextSlotIndex]
        
        // Check if next slot is empty or can be overwritten
        const nextSlotData = newSchedule[editingCell.day][nextSlot]
        const isNextSlotEmpty = !nextSlotData || (!nextSlotData.subject && !nextSlotData.teacher)
        
        if (isNextSlotEmpty) {
          // Set current slot
          newSchedule[editingCell.day][editingCell.timeSlot] = {
            subject: cellData.subject,
            teacher: cellData.teacher,
            teacherId: cellData.teacherId,
            teacherUsername: cellData.teacherUsername,
            type: cellData.type,
            room: cellData.room,
            code: cellData.code,
            name: cellData.name
          }
          
          // Set next slot as continuation
          newSchedule[editingCell.day][nextSlot] = {
            subject: `${cellData.subject} (Cont.)`,
            teacher: cellData.teacher,
            teacherId: cellData.teacherId,
            teacherUsername: cellData.teacherUsername,
            type: cellData.type,
            room: cellData.room,
            code: cellData.code,
            name: cellData.name,
            isContinuation: true
          }
          
          console.log('Lab session updated, new schedule:', newSchedule)
          setScheduleData(newSchedule)
          setEditingCell(null)
          return
        } else {
          toast.error('Next time slot is not available for lab session')
          return
        }
      } else {
        toast.error('Cannot schedule lab session - no next time slot available')
        return
      }
    }

    // Regular cell update - ensure all data is preserved
    const updatedCellData = {
      subject: cellData.subject || '',
      teacher: cellData.teacher || '',
      teacherId: cellData.teacherId || null,
      teacherUsername: cellData.teacherUsername || '',
      type: cellData.type || 'lecture',
      room: cellData.room || '',
      code: cellData.code || '',
      name: cellData.name || cellData.subject || ''
    }
    
    console.log('Updating cell with data:', updatedCellData)
    newSchedule[editingCell.day][editingCell.timeSlot] = updatedCellData
    
    console.log('New schedule after update:', newSchedule)
    
    // Update the schedule data immediately to reflect changes in the grid
    setScheduleData(newSchedule)
    setEditingCell(null)
    
    // Ensure timetableInfo has the required fields from data prop
    const actualData = timetableData || data
    if (actualData && (!timetableInfo.semester || !timetableInfo.academicYear)) {
      setTimetableInfo(prev => ({
        ...prev,
        year: actualData.year || prev.year,
        branch: actualData.branch || prev.branch,
        section: actualData.section || prev.section,
        semester: actualData.semester || prev.semester,
        academicYear: actualData.academicYear || prev.academicYear
      }))
    }
    
    console.log('Cell update completed')
  }

  // Add/Remove time slots with history tracking
  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1]
    const lastSlotParsed = parseTimeSlot(lastSlot)
    const newStart = lastSlotParsed.end
    const newEnd = newStart + 60 // Default 1 hour duration
    const newSlot = createTimeSlot(newStart, newEnd)
    
    const newTimeSlots = [...timeSlots, newSlot]
    setTimeSlots(newTimeSlots)
    
    // Add empty cells for new time slot
    const newSchedule = { ...scheduleData }
    days.forEach(day => {
      if (!newSchedule[day]) newSchedule[day] = {}
      newSchedule[day][newSlot] = {
        subject: '',
        teacher: '',
        type: 'lecture',
        room: ''
      }
    })
    setScheduleData(newSchedule)
  }

  const removeTimeSlot = (slotToRemove) => {
    if (timeSlots.length <= 1) return
    
    // Store deleted slot with its data for restoration
    const deletedSlotData = {
      slot: slotToRemove,
      data: {},
      timestamp: Date.now()
    }
    
    days.forEach(day => {
      if (scheduleData[day] && scheduleData[day][slotToRemove]) {
        deletedSlotData.data[day] = scheduleData[day][slotToRemove]
      }
    })
    
    setDeletedTimeSlots(prev => [...prev, deletedSlotData])
    
    const removedIndex = timeSlots.indexOf(slotToRemove)
    const newTimeSlots = timeSlots.filter(slot => slot !== slotToRemove)
    
    // Auto-adjust subsequent time slots to prevent gaps
    if (removedIndex < newTimeSlots.length) {
      // Get the previous slot's end time (or start from the removed slot's start time)
      let adjustStartTime
      if (removedIndex > 0) {
        const prevSlot = parseTimeSlot(newTimeSlots[removedIndex - 1])
        adjustStartTime = prevSlot.end
      } else {
        // If removing the first slot, use the removed slot's start time
        const removedSlot = parseTimeSlot(slotToRemove)
        adjustStartTime = removedSlot.start
      }
      
      // Adjust all subsequent slots
      for (let i = removedIndex; i < newTimeSlots.length; i++) {
        const currentSlot = parseTimeSlot(newTimeSlots[i])
        const newEnd = adjustStartTime + currentSlot.duration
        const adjustedSlot = createTimeSlot(adjustStartTime, newEnd)
        
        // Update the slot name in the array
        const oldSlotName = newTimeSlots[i]
        newTimeSlots[i] = adjustedSlot
        
        // Update schedule data with new slot name
        const newSchedule = { ...scheduleData }
        days.forEach(day => {
          if (newSchedule[day] && newSchedule[day][oldSlotName]) {
            const cellData = newSchedule[day][oldSlotName]
            delete newSchedule[day][oldSlotName]
            newSchedule[day][adjustedSlot] = cellData
          }
        })
        setScheduleData(newSchedule)
        
        adjustStartTime = newEnd
      }
    }
    
    setTimeSlots(newTimeSlots)
    
    // Remove cells for deleted time slot
    const newSchedule = { ...scheduleData }
    days.forEach(day => {
      if (newSchedule[day]) {
        delete newSchedule[day][slotToRemove]
      }
    })
    setScheduleData(newSchedule)
  }

  // Restore deleted time slot
  const restoreTimeSlot = (deletedSlotData) => {
    const { slot, data } = deletedSlotData
    
    // Find appropriate position to insert the slot
    const slotTime = parseTimeSlot(slot)
    let insertIndex = timeSlots.length
    
    for (let i = 0; i < timeSlots.length; i++) {
      const currentSlotTime = parseTimeSlot(timeSlots[i])
      if (slotTime.start < currentSlotTime.start) {
        insertIndex = i
        break
      }
    }
    
    const newTimeSlots = [...timeSlots]
    newTimeSlots.splice(insertIndex, 0, slot)
    setTimeSlots(newTimeSlots)
    
    // Restore data
    const newSchedule = { ...scheduleData }
    days.forEach(day => {
      if (!newSchedule[day]) newSchedule[day] = {}
      newSchedule[day][slot] = data[day] || {
        subject: '',
        teacher: '',
        type: 'lecture',
        room: ''
      }
    })
    setScheduleData(newSchedule)
    
    // Remove from deleted slots
    setDeletedTimeSlots(prev => prev.filter(item => item.timestamp !== deletedSlotData.timestamp))
  }

  // Add/Remove days
  const addDay = () => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const availableDays = dayNames.filter(day => !days.includes(day))
    
    if (availableDays.length === 0) return
    
    const newDay = availableDays[0]
    const newDays = [...days, newDay]
    setDays(newDays)
    
    // Add empty cells for new day
    const newSchedule = { ...scheduleData }
    newSchedule[newDay] = {}
    timeSlots.forEach(slot => {
      newSchedule[newDay][slot] = {
        subject: '',
        teacher: '',
        type: 'lecture',
        room: ''
      }
    })
    setScheduleData(newSchedule)
  }

  const removeDay = (dayToRemove) => {
    if (days.length <= 1) return
    
    const newDays = days.filter(day => day !== dayToRemove)
    setDays(newDays)
    
    // Remove day from schedule
    const newSchedule = { ...scheduleData }
    delete newSchedule[dayToRemove]
    setScheduleData(newSchedule)
  }

  // Utility functions
  const clearTimetable = () => {
    if (window.confirm('Are you sure you want to clear the entire timetable? This will also remove any unsaved changes from local storage.')) {
      const emptySchedule = {}
      days.forEach(day => {
        emptySchedule[day] = {}
        timeSlots.forEach(slot => {
          emptySchedule[day][slot] = {
            subject: '',
            teacher: '',
            type: 'lecture',
            room: ''
          }
        })
      })
      setScheduleData(emptySchedule)
      
      // Clear localStorage when explicitly clearing timetable
      clearLocalTimetableData()
    }
  }

  // Validate timetable data before saving
  const validateTimetableData = () => {
    const errors = []
    
    days.forEach(day => {
      timeSlots.forEach(slot => {
        const cellData = scheduleData[day]?.[slot]
        if (cellData && (cellData.subject || cellData.teacher)) {
          // Skip validation for special entries
          if (!isSpecialEntry(cellData.subject, cellData.type)) {
            if (!cellData.subject) {
              errors.push(`Missing subject for ${day} ${slot}`)
            }
            if (!cellData.teacher) {
              errors.push(`Missing teacher for ${day} ${slot}`)
            }
          }
        }
      })
    })
    
    return errors
  }

  // Update the save function to use validation
   // Prepare schedule data for backend
  const handleSave = () => {
    const errors = validateTimetableData()
    
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`)
      return
    }

    // Prepare schedule data for backend
    const scheduleArray = []
    
    days.forEach(day => {
      timeSlots.forEach(timeSlot => {
        const cellData = scheduleData[day]?.[timeSlot]
        if (cellData && (cellData.subject || cellData.teacher || isSpecialEntry(cellData.subject, cellData.type))) {
          // Transform subject data to backend format
          const subjectData = {
            acronym: cellData.subject || '',
            code: cellData.code || '',
            name: cellData.name || cellData.subject || ''
          }

          // Transform teacher data to backend format - fix for special entries
          const teacherData = isSpecialEntry(cellData.subject, cellData.type) ? {
            id: null,
            name: '',
            username: ''
          } : {
            id: cellData.teacherId || null,
            name: cellData.teacher || '',
            username: cellData.teacherUsername || ''
          }

          scheduleArray.push({
            day,
            timeSlot,
            subject: subjectData,
            teacher: teacherData,
            type: cellData.type || 'lecture',
            room: cellData.room || ''
          })
        }
      })
    })

    const timetableToSave = {
      year: timetableInfo.year,
      branch: timetableInfo.branch,
      section: timetableInfo.section,
      semester: timetableInfo.semester,
      academicYear: timetableInfo.academicYear,
      schedule: scheduleArray
    }

    if (onSave) {
      // Clear localStorage after successful save
      const originalOnSave = onSave
      const enhancedOnSave = (data) => {
        const result = originalOnSave(data)
        // Clear localStorage after save (whether sync or async)
        if (result && typeof result.then === 'function') {
          // If onSave returns a promise
          result.then(() => {
            clearLocalTimetableData()
          }).catch(() => {
            // Keep localStorage if save failed
            console.log('Save failed, keeping localStorage data')
          })
        } else {
          // If onSave is synchronous, clear immediately
          clearLocalTimetableData()
        }
        return result
      }
      enhancedOnSave(timetableToSave)
    }
  }

  const handlePublish = async () => {
    // Validate timetable before publishing
    const validation = validateTimetable()
    if (!validation.isValid) {
      // Show detailed error messages
      const errorMessage = validation.errors.join(', ')
      toast.error(`Cannot publish timetable: ${errorMessage}`)
      return
    }

    // Get the timetable ID from the data
    const timetableId = (timetableData?.id || timetableData?._id || data?.id || data?._id)
    
    if (!timetableId) {
      toast.error('Please save the timetable first before publishing')
      return
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token')
    if (!token) {
      toast.error('Please login to publish timetables')
      return
    }

    try {
      // Transform schedule data from frontend format to backend format
      const scheduleArray = []
      
      days.forEach(day => {
        timeSlots.forEach(timeSlot => {
          const cellData = scheduleData[day]?.[timeSlot]
          if (cellData && (cellData.subject || cellData.teacher || isSpecialEntry(cellData.subject, cellData.type))) {
            // Transform subject data to backend format
            const subjectData = {
              acronym: cellData.subject || '',
              code: cellData.code || '',
              name: cellData.name || cellData.subject || ''
            }

            // Transform teacher data to backend format - ensure proper structure
            const teacherData = isSpecialEntry(cellData.subject, cellData.type) ? {
              id: null,
              name: '',
              username: ''
            } : {
              id: cellData.teacherId || null,
              name: cellData.teacher || '',
              username: cellData.teacherUsername || ''
            }

            scheduleArray.push({
              day,
              timeSlot,
              subject: subjectData,
              teacher: teacherData,
              type: cellData.type || 'lecture',
              room: cellData.room || ''
            })
          }
        })
      })

      const publishData = {
        isPublished: true
      }
      
      console.log('Publishing timetable with ID:', timetableId, 'and data:', publishData)
      
      if (onPublish) {
        // Call the parent's publish handler
        await onPublish({
          id: timetableId,
          ...timetableInfo,
          schedule: scheduleArray,
          isPublished: true,
          publishedAt: new Date().toISOString()
        })
        
        // Clear localStorage after successful publish
        clearLocalTimetableData()
      }
    } catch (error) {
      console.error('Error publishing timetable:', error)
      toast.error('Failed to publish timetable')
    }
  }

  // Add validation function
  const validateTimetable = () => {
    // Get data from multiple sources to ensure we have the information
    const actualData = timetableData || data
    
    // Try to get the required fields from multiple sources
    let year = timetableInfo.year || actualData?.year || ''
    let branch = timetableInfo.branch || actualData?.branch || ''
    let section = timetableInfo.section || actualData?.section || ''
    
    // If still empty, try to extract from URL or page title
    if (!year || !branch || !section) {
      const urlParams = new URLSearchParams(window.location.search)
      year = year || urlParams.get('year') || ''
      branch = branch || urlParams.get('branch') || ''
      section = section || urlParams.get('section') || ''
      
      // Try to extract from page title or header
      const pageTitle = document.title
      const headerText = document.querySelector('h2')?.textContent || ''
      
      // Look for patterns like "3rd Year cse A" in the title
      if (!year && (pageTitle.includes('3rd Year') || headerText.includes('3rd Year'))) {
        year = '3rd Year'
      }
      if (!branch && (pageTitle.includes('cse') || headerText.includes('cse'))) {
        branch = 'cse'
      }
      if (!section && (pageTitle.includes(' A') || headerText.includes(' A'))) {
        section = 'A'
      }
    }
    
    console.log('Validation check:', { 
      timetableInfo, 
      actualData, 
      year, 
      branch, 
      section 
    })

    const errors = []
    
    // Only require the most basic fields for identification
    if (!year || year.trim() === '') {
      errors.push('Year is required')
    }
    if (!branch || branch.trim() === '') {
      errors.push('Branch is required')
    }
    if (!section || section.trim() === '') {
      errors.push('Section is required')
    }
    
    // If validation passes, update timetableInfo with the found values
    if (errors.length === 0) {
      setTimetableInfo(prev => ({
        ...prev,
        year: year || prev.year,
        branch: branch || prev.branch,
        section: section || prev.section
      }))
    }
    
    console.log('Validation result:', { isValid: errors.length === 0, errors })
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const handleExportPDF = () => {
    // Import the PDF export utility
    import('../utils/pdfExport').then(({ exportToPDF }) => {
      const timetableData = {
        year: timetableInfo.year || 'Unknown Year',
        branch: timetableInfo.branch || 'Unknown Branch', 
        section: timetableInfo.section || 'Unknown Section',
        schedule: scheduleData,
        timeSlots: timeSlots,
        days: days,
        semester: timetableInfo.semester || '',
        academicYear: timetableInfo.academicYear || new Date().getFullYear()
      }
      
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

  // Get cell display content
  const getCellContent = (day, timeSlot) => {
    const cellData = scheduleData[day]?.[timeSlot]
    console.log(`getCellContent for ${day} ${timeSlot}:`, cellData)
    
    if (!cellData || (!cellData.subject && !cellData.teacher && !cellData.parallelSessions)) {
      return { isEmpty: true }
    }

    // Handle split-lab with parallel sessions
    if (cellData.type === 'split-lab' && cellData.parallelSessions) {
      return {
        isEmpty: false,
        type: 'split-lab',
        parallelSessions: cellData.parallelSessions,
        isMerged: true,
        mergeRows: 2
      }
    }

    return {
      isEmpty: false,
      subject: cellData.subject || '',
      teacher: cellData.teacher || '',
      type: cellData.type || 'lecture',
      room: cellData.room || '',
      code: cellData.code || '',
      duration: cellData.duration || 1,
      isFirstSlot: cellData.isFirstSlot,
      isContinuation: cellData.isContinuation
    }
  }

  // Special entries that don't require teacher/subject validation
  const specialEntries = ['lunch', 'break', 'library', 'mini project', 'mentor']

  // Check if an entry is a special entry
  const isSpecialEntry = (subject, type) => {
    const subjectLower = (subject || '').toLowerCase()
    const typeLower = (type || '').toLowerCase()
    
    return specialEntries.some(entry => 
      subjectLower.includes(entry) || typeLower.includes(entry)
    )
  }

  // Get cell styling based on type
  const getCellStyling = (type, subject) => {
    const typeLower = (type || '').toLowerCase()
    const subjectLower = (subject || '').toLowerCase()
    
    if (typeLower === 'lab' || subjectLower.includes('lab')) {
      return { bgColor: 'bg-blue-50 border-blue-200 text-blue-800' }
    }
    if (typeLower === 'lunch' || subjectLower.includes('lunch')) {
      return { bgColor: 'bg-orange-50 border-orange-200 text-orange-800' }
    }
    if (typeLower === 'break' || subjectLower.includes('break')) {
      return { bgColor: 'bg-gray-50 border-gray-200 text-gray-600' }
    }
    if (typeLower === 'library' || subjectLower.includes('library')) {
      return { bgColor: 'bg-green-50 border-green-200 text-green-800' }
    }
    if (typeLower === 'mini project' || subjectLower.includes('mini project')) {
      return { bgColor: 'bg-purple-50 border-purple-200 text-purple-800' }
    }
    if (typeLower === 'mentor' || subjectLower.includes('mentor')) {
      return { bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-800' }
    }
    
    return { bgColor: 'bg-white border-gray-200 text-gray-800' }
  }

  // Render loading state
  if (!scheduleData && (data || timetableData)) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading timetable...</p>
        </div>
      </div>
    )
  }

  // Time Slot Edit Modal Component
  const TimeSlotEditModal = ({ isOpen, onClose, onSave, initialTimeSlot }) => {
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [autoAdjust, setAutoAdjust] = useState(true)

    // Convert 12-hour format to 24-hour format for HTML time input
    const convertTo24Hour = (time12h) => {
      if (!time12h) return ''
      
      const [time, modifier] = time12h.split(' ')
      let [hours, minutes] = time.split(':')
      
      if (hours === '12') {
        hours = '00'
      }
      
      if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`
    }

    // Convert 24-hour format to 12-hour format
    const convertTo12Hour = (time24h) => {
      if (!time24h) return ''
      
      const [hours, minutes] = time24h.split(':')
      const hour = parseInt(hours, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      
      return `${displayHour}:${minutes} ${ampm}`
    }

    useEffect(() => {
      if (initialTimeSlot) {
        const [start, end] = initialTimeSlot.split('-')
        setStartTime(convertTo24Hour(start.trim()))
        setEndTime(convertTo24Hour(end.trim()))
      }
    }, [initialTimeSlot])

    const handleSubmit = (e) => {
      e.preventDefault()
      if (startTime && endTime) {
        // Convert back to 12-hour format for display
        const start12h = convertTo12Hour(startTime)
        const end12h = convertTo12Hour(endTime)
        const newTimeSlot = `${start12h}-${end12h}`
        
        // Pass the autoAdjust setting to the parent component
        onSave(newTimeSlot, autoAdjust)
      }
    }

    if (!isOpen) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Edit Time Slot</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {startTime && `Display: ${convertTo12Hour(startTime)}`}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {endTime && `Display: ${convertTo12Hour(endTime)}`}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoAdjust"
                checked={autoAdjust}
                onChange={(e) => setAutoAdjust(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoAdjust" className="text-sm text-gray-700">
                Auto-adjust subsequent time slots
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {mode === 'create' ? 'Create New Timetable' : 'Timetable'}
              </h2>
              <p className="text-blue-100">
                {timetableInfo.year && timetableInfo.branch && timetableInfo.section
                  ? `${timetableInfo.year} - ${timetableInfo.branch.toUpperCase()} - Section ${timetableInfo.section}${timetableInfo.semester ? ` - Semester ${timetableInfo.semester}` : ''}${timetableInfo.academicYear ? ` - ${timetableInfo.academicYear}` : ''}`
                  : 'Configure timetable details'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {(isEditable || mode === 'edit' || mode === 'create') && (
              <>
                <button
                  onClick={clearTimetable}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Clear Timetable"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </>
            )}
            
            {showPDFExport && (
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            )}

            {onPublish && (isEditable || mode === 'edit' || mode === 'create') && (
              <button
                onClick={handlePublish}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center space-x-2"
                disabled={!validateTimetable().isValid}
              >
                <Share className="w-4 h-4" />
                <span>Publish</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timetable Info Form (for create mode) */}
      {mode === 'create' && (
        <div className="p-6 bg-gray-50 border-b">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={timetableInfo.year}
              onChange={(e) => setTimetableInfo(prev => ({ ...prev, year: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select Year</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <select
              value={timetableInfo.branch}
              onChange={(e) => setTimetableInfo(prev => ({ ...prev, branch: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select Branch</option>
              <option value="cse">Computer Science</option>
              <option value="ece">Electronics</option>
              <option value="mech">Mechanical</option>
              <option value="civil">Civil</option>
              <option value="eee">Electrical</option>
              <option value="it">Information Technology</option>
            </select>
            <select
              value={timetableInfo.section}
              onChange={(e) => setTimetableInfo(prev => ({ ...prev, section: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
            <select
              value={timetableInfo.semester}
              onChange={(e) => setTimetableInfo(prev => ({ ...prev, semester: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Select Semester</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
            <input
              type="text"
              placeholder="Academic Year (e.g., 2024-25)"
              value={timetableInfo.academicYear}
              onChange={(e) => setTimetableInfo(prev => ({ ...prev, academicYear: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Controls */}
      {(isEditable || mode === 'edit' || mode === 'create') && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Time Slots:</span>
              <button
                onClick={addTimeSlot}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="Add Time Slot"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Days:</span>
              <button
                onClick={addDay}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="Add Day"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Restore deleted time slots */}
            {deletedTimeSlots.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Restore:</span>
                <div className="flex space-x-1">
                  {deletedTimeSlots.slice(-3).map((deletedSlot, index) => (
                    <button
                      key={deletedSlot.timestamp}
                      onClick={() => restoreTimeSlot(deletedSlot)}
                      className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded flex items-center space-x-1"
                      title={`Restore ${deletedSlot.slot}`}
                    >
                      <Undo2 className="w-3 h-3" />
                      <span>{deletedSlot.slot}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Click on any cell to edit • Use controls to add/remove rows and columns • Click time slots to edit timings
            </div>
          </div>
        </div>
      )}

      {/* Timetable Grid */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop Grid */}
        <div className="hidden md:block overflow-x-auto">
          <div className="min-w-max">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-gray-100 p-2 text-sm font-semibold text-center min-w-[120px]">
                    Time / Day
                  </th>
                  {days.map(day => (
                    <th key={day} className="border border-gray-300 bg-gray-100 p-2 text-sm font-semibold text-center min-w-[150px] relative">
                      {day}
                      {(isEditable || mode === 'edit' || mode === 'create') && days.length > 1 && (
                        <button
                          onClick={() => removeDay(day)}
                          className="absolute top-1 right-1 p-1 text-red-500 hover:bg-red-100 rounded"
                          title={`Remove ${day}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot, rowIndex) => {
                  // Check if this row should be skipped (hidden continuation of split-lab)
                  const shouldSkipRow = days.some(day => {
                    const cellData = scheduleData[day]?.[timeSlot]
                    return cellData?.isHidden || cellData?.type === 'split-lab-continuation'
                  })

                  if (shouldSkipRow) return null

                  return (
                    <tr key={timeSlot}>
                      <td className="border border-gray-300 bg-gray-50 p-2 text-xs font-medium text-center relative">
                        <div className="flex items-center justify-center space-x-1">
                          <span>{timeSlot}</span>
                          {(isEditable || mode === 'edit' || mode === 'create') && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => setEditingTimeSlot({ index: rowIndex, timeSlot })}
                                className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                                title="Edit Time Slot"
                              >
                                <Edit className="w-3 h-3" />
                              </button>
                              {timeSlots.length > 1 && (
                                <button
                                  onClick={() => removeTimeSlot(timeSlot)}
                                  className="p-1 text-red-500 hover:bg-red-100 rounded"
                                  title="Remove Time Slot"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      {days.map(day => {
                        const cellContent = getCellContent(day, timeSlot)
                        const cellStyling = getCellStyling(cellContent.type)
                        
                        // Skip rendering if this cell is hidden (continuation of split-lab)
                        if (cellContent.isHidden) return null
                        
                        return (
                          <td
                            key={`${day}-${timeSlot}`}
                            className={`border border-gray-300 p-1 text-xs cursor-pointer transition-colors hover:bg-gray-50 ${
                              cellContent.type === 'split-lab' ? 'bg-violet-50 border-violet-200' : cellStyling.bgColor
                            }`}
                            rowSpan={cellContent.isMerged ? cellContent.mergeRows : 1}
                            onClick={() => (isEditable || mode === 'edit' || mode === 'create') && handleCellClick(day, timeSlot)}
                            style={{
                              verticalAlign: 'middle',
                              ...(cellContent.isMerged && {
                                borderRadius: '6px',
                                backgroundColor: '#f5f3ff',
                                border: '1px solid #c4b5fd'
                              })
                            }}
                          >
                            <div className="min-h-[60px] flex flex-col justify-center items-center text-center">
                              {cellContent.isEmpty ? (
                                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                  Click to add
                                </div>
                              ) : (
                                ['lunch', 'break', 'library', 'mini project', 'mentor'].includes(cellContent.type) ? (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="font-bold text-center text-gray-800">
                                      {cellContent.subject || cellContent.type.toUpperCase()}
                                    </span>
                                  </div>
                                ) : cellContent.type === 'split-lab' && cellContent.parallelSessions ? (
                                  <div className="flex flex-col text-sm p-2 space-y-2">
                                    {cellContent.parallelSessions.map((session, idx) => (
                                      <div key={idx} className="py-1 border-b border-violet-200 last:border-b-0">
                                        <div className="font-semibold text-violet-700">
                                          {session.subject} LAB ({session.batch})
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {session.code} - {session.teacher}
                                        </div>
                                      </div>
                                    ))}
                                    <div className="text-xs mt-1 text-gray-500 italic">
                                      Room: {cellContent.parallelSessions.map(s => s.room).filter(Boolean).join(' & ') || 'TBD'}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="p-2 h-full flex flex-col justify-center">
                                    <div className="font-medium text-sm text-gray-900 truncate">
                                      {cellContent.subject}
                                    </div>
                                    {cellContent.code && (
                                      <div className="text-xs text-gray-500 truncate">
                                        {cellContent.code}
                                      </div>
                                    )}
                                    {cellContent.teacher && (
                                      <div className="text-xs text-gray-600 truncate">
                                        {cellContent.teacher}
                                      </div>
                                    )}
                                    {cellContent.room && (
                                      <div className="text-xs text-gray-500 truncate">
                                        📍 {cellContent.room}
                                      </div>
                                    )}
                                    {cellContent.duration === 2 && (
                                      <div className="text-xs text-blue-600 font-medium">
                                        {cellContent.isFirstSlot ? '2hr Lab' : 'Cont.'}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4 p-4">
          {days.map(day => (
            <div key={day} className="bg-white rounded-lg shadow-sm border">
              <div className="bg-gray-100 px-4 py-3 rounded-t-lg flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{day}</h3>
                {(isEditable || mode === 'edit' || mode === 'create') && days.length > 1 && (
                  <button
                    onClick={() => removeDay(day)}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                    title={`Remove ${day}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="divide-y divide-gray-200">
                {timeSlots.map((timeSlot, index) => {
                  const cellContent = getCellContent(day, timeSlot)
                  const cellStyling = getCellStyling(cellContent.type)
                  
                  return (
                    <div
                      key={timeSlot}
                      className={`p-3 ${cellStyling.bgColor} ${(isEditable || mode === 'edit' || mode === 'create') ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => (isEditable || mode === 'edit' || mode === 'create') && handleCellClick(day, timeSlot)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">{timeSlot}</span>
                        {(isEditable || mode === 'edit' || mode === 'create') && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingTimeSlot({ index, timeSlot })
                              }}
                              className="p-1 text-blue-500 hover:bg-blue-100 rounded"
                              title="Edit Time Slot"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            {timeSlots.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeTimeSlot(timeSlot)
                                }}
                                className="p-1 text-red-500 hover:bg-red-100 rounded"
                                title="Remove Time Slot"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-center">
                        {cellContent.isEmpty ? (
                          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Tap to add class
                          </div>
                        ) : (
                          ['lunch', 'break', 'library', 'mini project', 'mentor'].includes(cellContent.type) ? (
                            <div className="h-full flex items-center justify-center">
                              <span className="font-bold text-center text-gray-800">
                                {cellContent.subject || cellContent.type.toUpperCase()}
                              </span>
                            </div>
                          ) : (
                            <div className="p-2 h-full flex flex-col justify-center">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {cellContent.subject}
                              </div>
                              {cellContent.code && (
                                <div className="text-xs text-gray-500 truncate">
                                  {cellContent.code}
                                </div>
                              )}
                              {cellContent.teacher && (
                                <div className="text-xs text-gray-600 truncate">
                                  {cellContent.teacher}
                                </div>
                              )}
                              {cellContent.room && (
                                <div className="text-xs text-gray-500 truncate">
                                  📍 {cellContent.room}
                                </div>
                              )}
                              {cellContent.duration === 2 && (
                                <div className="text-xs text-blue-600 font-medium">
                                  {cellContent.isFirstSlot ? '2hr Lab' : 'Cont.'}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {editingCell && (
        <EditModal
          isOpen={!!editingCell}
          onClose={() => setEditingCell(null)}
          onSave={handleSaveCell}
          initialData={editingCell.data}
          timeSlot={editingCell.timeSlot}
          day={editingCell.day}
          cellInfo={editingCell}
          data={data}
          timetableData={timetableData}
        />
      )}

      {/* Time Slot Edit Modal */}
      {editingTimeSlot && (
        <TimeSlotEditModal
          isOpen={!!editingTimeSlot}
          onClose={() => setEditingTimeSlot(null)}
          onSave={(newTimeSlot, autoAdjust) => handleTimeSlotEdit(editingTimeSlot.index, newTimeSlot, autoAdjust)}
          initialTimeSlot={editingTimeSlot.timeSlot}
        />
      )}
    </div>
  )
}

export default TimetableGrid