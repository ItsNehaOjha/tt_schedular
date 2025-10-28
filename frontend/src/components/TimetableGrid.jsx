// frontend/src/components/TimetableGrid.jsx
  import React, { useState, useEffect, useMemo } from 'react'
  import { ArrowLeft, RotateCcw, Minus, Plus, Download, Save, Undo2, Share, X, Edit,Trash2 } from 'lucide-react'
  import { motion } from 'framer-motion'
  import EditModal from "../components/EditModal";
  import toast from 'react-hot-toast'

  const TimetableGrid = ({ onBack, onSave, onPublish, data, timetableData, mode, isEditable, showPDFExport = false, savedTimetableId = null, isPublished = false }) => {
    const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const defaultTimeSlots = ['08:50-09:40', '09:40-10:30', '10:30-11:20', '11:20-12:10', '12:10-13:00', '13:00-13:50', '13:50-14:40', '14:40-15:30', '15:30-16:20']

    // State management
    const [editingCell, setEditingCell] = useState(null)
    const [editingTimeSlot, setEditingTimeSlot] = useState(null) // { index, timeSlot } or null
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

    // We'll initialize scheduleData as an empty schedule, then populate on mount (safe)
    const createEmptySchedule = (daysArr = defaultDays, slotsArr = defaultTimeSlots) => {
      const empty = {}
      daysArr.forEach(d => {
        empty[d] = {}
        slotsArr.forEach(s => {
          empty[d][s] = {
            subject: '',
            teacher: '',
            type: 'lecture',
            room: ''
          }
        })
      })
      return empty
    }

    const [scheduleData, setScheduleData] = useState(() => createEmptySchedule(defaultDays, defaultTimeSlots))
    const [isInitialized, setIsInitialized] = useState(false)

    // ---------- Time parsing utils (unchanged logic) ----------
    const parseTime = (timeStr) => {
      const cleanTime = timeStr.replace(/\s*(AM|PM)\s*/i, '')
      const [hours, minutes] = cleanTime.split(':').map(Number)
      const isPM = /PM/i.test(timeStr)
      const isAM = /AM/i.test(timeStr)

      let adjustedHours = hours
      if (isPM && hours !== 12) adjustedHours = hours + 12
      else if (isAM && hours === 12) adjustedHours = 0

      return adjustedHours * 60 + minutes
    }

    const minutesToTime = (minutes) => {
      const hours24 = Math.floor(minutes / 60)
      const mins = minutes % 60
      let hours12 = hours24 % 12
      if (hours12 === 0) hours12 = 12
      const ampm = hours24 >= 12 ? 'PM' : 'AM'
      return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`
    }

    const parseTimeSlot = (slot) => {
      const [start, end] = slot.split('-')
      return {
        start: parseTime(start),
        end: parseTime(end),
        duration: parseTime(end) - parseTime(start)
      }
    }

    const createTimeSlot = (startMinutes, endMinutes) => `${minutesToTime(startMinutes)}-${minutesToTime(endMinutes)}`

    // Auto-adjust logic preserved
    const adjustTimeSlots = (editedIndex, newTimeSlot) => {
      const newTimeSlots = [...timeSlots]
      newTimeSlots[editedIndex] = newTimeSlot

      const editedSlot = parseTimeSlot(newTimeSlot)
      const newDuration = editedSlot.duration

      for (let i = editedIndex + 1; i < newTimeSlots.length; i++) {
        const prevSlot = parseTimeSlot(newTimeSlots[i - 1])
        const newStart = prevSlot.end
        const newEnd = newStart + newDuration
        newTimeSlots[i] = createTimeSlot(newStart, newEnd)
      }
      return newTimeSlots
    }

    // ---------- LocalStorage helpers ----------
    const getLocalStorageKey = () => {
      const actualData = timetableData || data
      if (actualData && actualData.branch && actualData.year && actualData.section) {
        return `timetable_draft_${actualData.branch}_${actualData.year}_${actualData.section}`
      }
      return null
    }

    const saveToLocalStorage = (scheduleDataArg, timeSlotsArg, daysArg, timetableInfoArg) => {
      const key = getLocalStorageKey()
      if (key && (mode === 'edit' || isEditable)) {
        try {
          const dataToSave = {
            scheduleData: scheduleDataArg,
            timeSlots: timeSlotsArg,
            days: daysArg,
            timetableInfo: timetableInfoArg,
            lastModified: new Date().toISOString()
          }
          localStorage.setItem(key, JSON.stringify(dataToSave))
          console.log('Timetable data saved to localStorage:', key)
        } catch (error) {
          console.error('Failed to save to localStorage:', error)
        }
      }
    }

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

    // ---------- Initialization on mount (SAFE: no setState during render) ----------
    useEffect(() => {
      const actualData = timetableData || data
      const saved = loadFromLocalStorage()

      if (saved && (mode === 'edit' || isEditable)) {
        // restore saved draft
        setTimeSlots(saved.timeSlots || defaultTimeSlots)
        setDays(saved.days || defaultDays)
        setTimetableInfo(saved.timetableInfo || {
          year: actualData?.year || '',
          branch: actualData?.branch || '',
          section: actualData?.section || '',
          semester: actualData?.semester || '',
          academicYear: actualData?.academicYear || ''
        })
        setScheduleData(saved.scheduleData || createEmptySchedule(saved.days || defaultDays, saved.timeSlots || defaultTimeSlots))
        toast.success('Restored unsaved changes from local storage')
        setIsInitialized(true)
        return
      }

      if (actualData) {
        // populate timetableInfo
        setTimetableInfo({
          year: actualData.year || '',
          branch: actualData.branch || '',
          section: actualData.section || '',
          semester: actualData.semester || '',
          academicYear: actualData.academicYear || ''
        })

        // normalize schedule formats
        let schedule = actualData.schedule || actualData.timetable || {}

        if (Array.isArray(schedule)) {
          const convertedSchedule = {}
          // start with defaults
          const inferredDays = []
          const inferredSlots = []
          schedule.forEach(slot => {
            if (slot.day && slot.timeSlot) {
              inferredDays.push(slot.day)
              inferredSlots.push(slot.timeSlot)
            }
          })
          const uniqDays = [...new Set(inferredDays)].filter(Boolean)
          const uniqSlots = [...new Set(inferredSlots)].filter(Boolean)

          const baseDays = uniqDays.length ? uniqDays : defaultDays
          const baseSlots = uniqSlots.length ? uniqSlots : defaultTimeSlots

          baseDays.forEach(d => {
            convertedSchedule[d] = {}
            baseSlots.forEach(s => {
              convertedSchedule[d][s] = {
                subject: '',
                teacher: '',
                type: 'lecture',
                room: ''
              }
            })
          })

          schedule.forEach(slot => {
            if (slot.day && slot.timeSlot) {
              convertedSchedule[slot.day] = convertedSchedule[slot.day] || {}
              convertedSchedule[slot.day][slot.timeSlot] = {
                subject: slot.subject?.acronym || slot.subject?.name || '',
                teacher: slot.teacher?.name || '',
                teacherId: slot.teacher?.id || null,
                isLabSession: slot.type === 'lab',
                requiresMultipleSlots: slot.type === 'lab', 
                type: slot.type || 'lecture',
                room: slot.room || '',
                code: slot.subject?.code || '',
                name: slot.subject?.name || ''
              }
            }
          })

          setDays(baseDays)
          setTimeSlots(baseSlots)
          setScheduleData(convertedSchedule)
          setIsInitialized(true)
          return
        }

        // object format
        if (Object.keys(schedule).length > 0) {
          const existingDays = Object.keys(schedule)
          const existingTimeSlots = existingDays.length > 0 ? Object.keys(schedule[existingDays[0]] || {}) : defaultTimeSlots
          setDays(existingDays.length > 0 ? existingDays : defaultDays)
          setTimeSlots(existingTimeSlots.length > 0 ? existingTimeSlots : defaultTimeSlots)
          setScheduleData(schedule)
          setIsInitialized(true)
          return
        }
      }

      // default new timetable
      setDays(defaultDays)
      setTimeSlots(defaultTimeSlots)
      setScheduleData(createEmptySchedule(defaultDays, defaultTimeSlots))
      setIsInitialized(true)
    }, []) // run once

    // Auto-save to localStorage whenever scheduleData, timeSlots, days, or timetableInfo change (after init)
    useEffect(() => {
      if (isInitialized && (mode === 'edit' || isEditable)) {
        saveToLocalStorage(scheduleData, timeSlots, days, timetableInfo)
      }
    }, [scheduleData, timeSlots, days, timetableInfo, isInitialized, mode, isEditable])

    // ---------- Cell editing ----------
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
    // 🗑️ Clears a single timetable cell
const handleClearCell = (day, timeSlot) => {
  const newSchedule = { ...scheduleData }
  if (!newSchedule[day]) return
  const currentCell = newSchedule[day][timeSlot]

  // If it's a lab → also clear continuation slot
  if (currentCell?.type === 'lab' || currentCell?.isLabSession) {
    const currentIndex = timeSlots.indexOf(timeSlot)
    const nextSlot = timeSlots[currentIndex + 1]
    if (nextSlot && newSchedule[day][nextSlot]?.isContinuation) {
      newSchedule[day][nextSlot] = { subject: '', teacher: '', type: 'lecture', room: '' }
    }
  }

  newSchedule[day][timeSlot] = { subject: '', teacher: '', type: 'lecture', room: '' }
  setScheduleData(newSchedule)
  toast.success('Cell cleared successfully')
}


    const handleSaveCell = (cellData) => {
      const newSchedule = { ...scheduleData }
      if (!newSchedule[editingCell.day]) newSchedule[editingCell.day] = {}

      // special behaviors preserved...
      if (cellData.fillEntireRow && cellData.type === 'lunch') {
        days.forEach(day => {
          if (!newSchedule[day]) newSchedule[day] = {}
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

      // split-lab logic - fixed to occupy exactly 2 consecutive slots
      // 🧩 Split-lab logic – display both B1 & B2 visibly, no hidden rows
if (cellData.type === 'split-lab' && Array.isArray(cellData.parallelSessions)) {
  const currentSlotIndex = timeSlots.indexOf(editingCell.timeSlot)
  const nextSlotIndex = currentSlotIndex + 1
  if (nextSlotIndex >= timeSlots.length) {
    toast.error("No next slot available for split lab")
    return
  }

  const nextSlot = timeSlots[nextSlotIndex]
  const nextSlotData = newSchedule[editingCell.day][nextSlot]
  const isNextSlotEmpty = !nextSlotData || (!nextSlotData.subject && !nextSlotData.teacher)

  if (!isNextSlotEmpty) {
    toast.error("Next slot is not empty — cannot place split lab here")
    return
  }

  const [batch1, batch2] = cellData.parallelSessions

  // ✅ First batch (B1)
  newSchedule[editingCell.day][editingCell.timeSlot] = {
    ...batch1,
    type: "split-lab",
    batch: batch1.batch || "B1",
    color: "#ede9fe", // violet tint
    sameGroup: true
  }

  // ✅ Second batch (B2)
  newSchedule[editingCell.day][nextSlot] = {
    ...batch2,
    type: "split-lab",
    batch: batch2.batch || "B2",
    color: "#ede9fe",
    sameGroup: true
  }

  setScheduleData(newSchedule)
  setEditingCell(null)
  return
}


      // multi-slot lab (2-hour) - fixed to occupy exactly 2 consecutive slots
      if (cellData.isLabSession && cellData.requiresMultipleSlots && cellData.type !== 'split-lab') {
        const currentSlotIndex = timeSlots.indexOf(editingCell.timeSlot)
        const nextSlotIndex = currentSlotIndex + 1
        if (nextSlotIndex < timeSlots.length) {
          const nextSlot = timeSlots[nextSlotIndex]
          const nextSlotData = newSchedule[editingCell.day][nextSlot]
          const isNextSlotEmpty = !nextSlotData || (!nextSlotData.subject && !nextSlotData.teacher)
          if (isNextSlotEmpty) {
            // Set the current slot with lab data
            newSchedule[editingCell.day][editingCell.timeSlot] = {
              subject: cellData.subject,
              teacher: cellData.teacher,
              teacherId: cellData.teacherId || null,
              type: cellData.type,
              room: cellData.room,
              code: cellData.code,
              name: cellData.name,
              // Mark as first slot for styling
            }
            // Mark the next slot as continuation
            newSchedule[editingCell.day][nextSlot] = {
              subject: `${cellData.subject} (Cont.)`,
              teacher: cellData.teacher,
              teacherId: cellData.teacherId || null,
              type: cellData.type,
              room: cellData.room,
              code: cellData.code,
              name: cellData.name,
              isContinuation: true,
              // Hide this slot as it's part of the merged cell
            }

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

      // regular update
      const updatedCellData = {
        subject: cellData.subject || '',
        teacher: cellData.teacher || '',
        teacherId: cellData.teacherId || null,
        type: cellData.type || 'lecture',
        room: cellData.room || '',
        code: cellData.code || '',
        name: cellData.name || cellData.subject || ''
      }


      newSchedule[editingCell.day][editingCell.timeSlot] = updatedCellData
      setScheduleData(newSchedule)
      setEditingCell(null)

      // if timetableInfo missing semester/academicYear, we copy from incoming backend data if available
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
    }

    // ---------- Time slot add/remove/restore (kept your original logic) ----------
    const handleTimeSlotEdit = (index, newTimeSlot, autoAdjust = true) => {
      let adjustedSlots = [...timeSlots]
      adjustedSlots[index] = newTimeSlot

      if (autoAdjust) adjustedSlots = adjustTimeSlots(index, newTimeSlot)

      // Replace timeSlots array
      setTimeSlots(adjustedSlots)

      // Update schedule keys (safe)
      const newSchedule = { ...scheduleData }
      const oldSlot = timeSlots[index]

      days.forEach(day => {
        if (newSchedule[day] && newSchedule[day][oldSlot]) {
          const cellData = newSchedule[day][oldSlot]
          delete newSchedule[day][oldSlot]
          newSchedule[day][newTimeSlot] = cellData
        }
      })

      // update subsequent mapped slots on autoAdjust
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

    const addTimeSlot = () => {
      const lastSlot = timeSlots[timeSlots.length - 1]
      const lastSlotParsed = parseTimeSlot(lastSlot)
      const newStart = lastSlotParsed.end
      const newEnd = newStart + 50 // Changed from 60 to 50 minutes
      const newSlot = createTimeSlot(newStart, newEnd)
      const newTimeSlots = [...timeSlots, newSlot]
      setTimeSlots(newTimeSlots)
      const newSchedule = { ...scheduleData }
      days.forEach(day => {
        if (!newSchedule[day]) newSchedule[day] = {}
        newSchedule[day][newSlot] = { subject: '', teacher: '', type: 'lecture', room: '' }
      })
      setScheduleData(newSchedule)
    }

    const removeTimeSlot = (slotToRemove) => {
      if (timeSlots.length <= 1) return
      const deletedSlotData = { slot: slotToRemove, data: {}, timestamp: Date.now() }
      days.forEach(day => {
        if (scheduleData[day] && scheduleData[day][slotToRemove]) {
          deletedSlotData.data[day] = scheduleData[day][slotToRemove]
        }
      })
      setDeletedTimeSlots(prev => [...prev, deletedSlotData])
      const removedIndex = timeSlots.indexOf(slotToRemove)
      const newTimeSlots = timeSlots.filter(slot => slot !== slotToRemove)

      if (removedIndex < newTimeSlots.length) {
        let adjustStartTime
        if (removedIndex > 0) {
          const prevSlot = parseTimeSlot(newTimeSlots[removedIndex - 1])
          adjustStartTime = prevSlot.end
        } else {
          const removedSlot = parseTimeSlot(slotToRemove)
          adjustStartTime = removedSlot.start
        }

        for (let i = removedIndex; i < newTimeSlots.length; i++) {
          const currentSlot = parseTimeSlot(newTimeSlots[i])
          const newEnd = adjustStartTime + currentSlot.duration
          const adjustedSlot = createTimeSlot(adjustStartTime, newEnd)
          const oldSlotName = newTimeSlots[i]
          newTimeSlots[i] = adjustedSlot

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
      const newSchedule = { ...scheduleData }
      days.forEach(day => {
        if (newSchedule[day]) {
          delete newSchedule[day][slotToRemove]
        }
      })
      setScheduleData(newSchedule)
    }

    const restoreTimeSlot = (deletedSlotData) => {
      const { slot, data } = deletedSlotData
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

      const newSchedule = { ...scheduleData }
      days.forEach(day => {
        if (!newSchedule[day]) newSchedule[day] = {}
        newSchedule[day][slot] = data[day] || { subject: '', teacher: '', type: 'lecture', room: '' }
      })
      setScheduleData(newSchedule)
      setDeletedTimeSlots(prev => prev.filter(item => item.timestamp !== deletedSlotData.timestamp))
    }

    const addDay = () => {
      const orderedDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const availableDays = orderedDayNames.filter(day => !days.includes(day))
      if (availableDays.length === 0) return
      
      // Find the first available day in the ordered list
      const newDay = availableDays[0]
      
      // Create a new array with all days (current + new) and sort according to the ordered list
      const unsortedDays = [...days, newDay]
      const newDays = unsortedDays.sort((a, b) => {
        return orderedDayNames.indexOf(a) - orderedDayNames.indexOf(b)
      })
      
      setDays(newDays)
      const newSchedule = { ...scheduleData }
      newSchedule[newDay] = {}
      timeSlots.forEach(slot => newSchedule[newDay][slot] = { subject: '', teacher: '', type: 'lecture', room: '' })
      setScheduleData(newSchedule)
    }

    const removeDay = (dayToRemove) => {
      if (days.length <= 1) return
      const newDays = days.filter(day => day !== dayToRemove)
      setDays(newDays)
      const newSchedule = { ...scheduleData }
      delete newSchedule[dayToRemove]
      setScheduleData(newSchedule)
    }

    // ---------- Validation (PURE) ----------
    const validateTimetable = () => {
      const actualData = timetableData || data
      let year = timetableInfo.year || actualData?.year || ''
      let branch = timetableInfo.branch || actualData?.branch || ''
      let section = timetableInfo.section || actualData?.section || ''

      if (!year || !branch || !section) {
        const urlParams = new URLSearchParams(window.location.search)
        year = year || urlParams.get('year') || ''
        branch = branch || urlParams.get('branch') || ''
        section = section || urlParams.get('section') || ''
        const pageTitle = document.title
        const headerText = document.querySelector('h2')?.textContent || ''
        if (!year && (pageTitle.includes('3rd Year') || headerText.includes('3rd Year'))) year = '3rd Year'
        if (!branch && (pageTitle.toUpperCase().includes('CSE') || headerText.toUpperCase().includes('CSE'))) branch = 'CSE'
        if (!section && (pageTitle.includes(' A') || headerText.includes(' A'))) section = 'A'
      }

      const errors = []
      if (!year || year.trim() === '') errors.push('Year is required')
      if (!branch || branch.trim() === '') errors.push('Branch is required')
      if (!section || section.trim() === '') errors.push('Section is required')

      return { isValid: errors.length === 0, errors, year, branch, section }
    }

    // Memoize validation so we don't recompute every render or trigger side-effects
    const validation = useMemo(() => validateTimetable(), [timetableInfo, data, timetableData])

    // ---------- Save & Publish handlers ----------
    const isSpecialEntry = (subject, type) => {
      const specialEntries = ['lunch', 'break', 'library', 'mini project', 'mentor']
      const subjectLower = (subject || '').toLowerCase()
      const typeLower = (type || '').toLowerCase()
      return specialEntries.some(entry => subjectLower.includes(entry) || typeLower.includes(entry))
    }

    const validateTimetableData = () => {
      const errors = []
      days.forEach(day => {
        timeSlots.forEach(slot => {
          const cellData = scheduleData[day]?.[slot]
          if (cellData && (cellData.subject || cellData.teacher)) {
            if (!isSpecialEntry(cellData.subject, cellData.type)) {
              if (!cellData.subject) errors.push(`Missing subject for ${day} ${slot}`)
              if (!cellData.teacher) errors.push(`Missing teacher for ${day} ${slot}`)
            }
          }
        })
      })
      return errors
    }

    const handleSave = () => {
      const errors = validateTimetableData()
      if (errors.length > 0) {
        toast.error(`Please fix the following errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`)
        return
      }

      const scheduleArray = []
      days.forEach(day => {
        timeSlots.forEach(timeSlot => {
          const cellData = scheduleData[day]?.[timeSlot]
          if (cellData && (cellData.subject || cellData.teacher || isSpecialEntry(cellData.subject, cellData.type))) {
            const subjectData = { acronym: cellData.subject || '', code: cellData.code || '', name: cellData.name || cellData.subject || '' }
            const teacherData = isSpecialEntry(cellData.subject, cellData.type)
                ? { id: null, name: '' }
                : { id: cellData.teacherId || null, name: cellData.teacher || '' }
            scheduleArray.push({ day, timeSlot, subject: subjectData, teacher: teacherData, type: cellData.type || 'lecture', room: cellData.room || '' })
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
        const originalOnSave = onSave
        const enhancedOnSave = (dataArg) => {
          const result = originalOnSave(dataArg)
          if (result && typeof result.then === 'function') {
            result.then(() => clearLocalTimetableData()).catch(() => console.log('Save failed, keeping localStorage data'))
          } else if (result && typeof result === 'object') {
            // synchronous return of saved object
            clearLocalTimetableData()
          }
          return result
        }
        // return value intentionally not awaited here; parent will handle navigation
        return enhancedOnSave(timetableToSave)
      }
    }

    const handlePublish = async () => {
      if (!validation.isValid) {
        const errorMessage = validation.errors.join(', ')
        toast.error(`Cannot publish timetable: ${errorMessage}`)
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Please login to publish timetables')
        return
      }

      try {
        const scheduleArray = []
        days.forEach(day => {
          timeSlots.forEach(timeSlot => {
            const cellData = scheduleData[day]?.[timeSlot]
            if (cellData && (cellData.subject || cellData.teacher || isSpecialEntry(cellData.subject, cellData.type))) {
              const subjectData = { acronym: cellData.subject || '', code: cellData.code || '', name: cellData.name || cellData.subject || '' }
              const teacherData = isSpecialEntry(cellData.subject, cellData.type)
                  ? { id: null, name: '' }
                  : { id: cellData.teacherId || null, name: cellData.teacher || '' }
              scheduleArray.push({ day, timeSlot, subject: subjectData, teacher: teacherData, type: cellData.type || 'lecture', room: cellData.room || '' })
            }
          })
        })

        if (onPublish) {
          // onPublish will handle create vs update
          await onPublish({
            ...timetableInfo,
            schedule: scheduleArray,
            isPublished: true,
            publishedAt: new Date().toISOString()
          })
          clearLocalTimetableData()
        }
      } catch (error) {
        console.error('Error publishing timetable:', error)
        toast.error('Failed to publish timetable')
      }
    }

    // ---------- PDF export ----------
    const handleExportPDF = () => {
      import('../utils/pdfExport').then(({ exportToPDF }) => {
        const timetableDataForPDF = {
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
          exportToPDF(timetableDataForPDF)
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

    // ---------- Render helpers ----------
    const getCellContent = (day, timeSlot) => {
      const cellData = scheduleData[day]?.[timeSlot]
      if (!cellData || (!cellData.subject && !cellData.teacher && !cellData.parallelSessions)) return { isEmpty: true }
      
      // Handle split-lab cells
      if (cellData.type === 'split-lab') {
  return {
    isEmpty: false,
    type: 'split-lab',
    subject: cellData.subject || '',
    teacher: cellData.teacher || '',
    code: cellData.code || '',
    room: cellData.room || '',
    batch: cellData.batch || '',
    sameGroup: true
  }
}

      
      // Handle regular lab cells with mergeRows
      if (cellData.type === 'lab' && cellData.isMerged) {
        return { 
          isEmpty: false, 
          subject: cellData.subject || '', 
          teacher: cellData.teacher || '', 
          type: cellData.type || 'lab', 
          room: cellData.room || '', 
          code: cellData.code || '', 
          isMerged: true,
          mergeRows: cellData.mergeRows || 2
        }
      }
      
      // Handle all other cell types
      return { 
        isEmpty: false, 
        subject: cellData.subject || '', 
        teacher: cellData.teacher || '', 
        type: cellData.type || 'lecture', 
        room: cellData.room || '', 
        code: cellData.code || '', 
        duration: cellData.duration || 1, 
        isFirstSlot: cellData.isFirstSlot, 
        isContinuation: cellData.isContinuation, 
        isHidden: cellData.isHidden,
        isMerged: cellData.isMerged,
        mergeRows: cellData.mergeRows
      }
    }

    const getCellStyling = (type, subject) => {
      const typeLower = (type || '').toLowerCase()
      const subjectLower = (subject || '').toLowerCase()
      if (typeLower === 'lab' || subjectLower.includes('lab')) return { bgColor: 'bg-blue-50 border-blue-200 text-blue-800' }
      if (typeLower === 'lunch' || subjectLower.includes('lunch')) return { bgColor: 'bg-orange-50 border-orange-200 text-orange-800' }
      if (typeLower === 'break' || subjectLower.includes('break')) return { bgColor: 'bg-gray-50 border-gray-200 text-gray-600' }
      if (typeLower === 'library' || subjectLower.includes('library')) return { bgColor: 'bg-green-50 border-green-200 text-green-800' }
      if (typeLower === 'mini project' || subjectLower.includes('mini project')) return { bgColor: 'bg-purple-50 border-purple-200 text-purple-800' }
      if (typeLower === 'mentor' || subjectLower.includes('mentor')) return { bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-800' }
      if (typeLower === 'split-lab' || subjectLower.includes('split-lab')) return { bgColor: 'bg-violet-50 border-violet-200 text-violet-800' }

      return { bgColor: 'bg-white border-gray-200 text-gray-800' }
    }

    // Loading indicator
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

    // ---------- Time Slot Edit Modal Component ----------
    const TimeSlotEditModal = ({ isOpen, onClose, onSave, initialTimeSlot, index }) => {
      const [startTime, setStartTime] = useState('')
      const [endTime, setEndTime] = useState('')
      const [autoAdjust, setAutoAdjust] = useState(true)

      const convertTo24Hour = (time12h) => {
        if (!time12h) return ''
        const [time, modifier] = time12h.split(' ')
        let [hours, minutes] = time.split(':')
        if (hours === '12') hours = '00'
        if (modifier === 'PM') hours = parseInt(hours, 10) + 12
        return `${hours.toString().padStart(2, '0')}:${minutes}`
      }

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
          const start12h = convertTo12Hour(startTime)
          const end12h = convertTo12Hour(endTime)
          const newTimeSlot = `${start12h}-${end12h}`
          onSave(index, newTimeSlot, autoAdjust)
        }
      }

      if (!isOpen) return null

      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Time Slot</h3>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                  <div className="text-xs text-gray-500 mt-1">{startTime && `Display: ${convertTo12Hour(startTime)}`}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                  <div className="text-xs text-gray-500 mt-1">{endTime && `Display: ${convertTo12Hour(endTime)}`}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="autoAdjust" checked={autoAdjust} onChange={(e) => setAutoAdjust(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="autoAdjust" className="text-sm text-gray-700">Auto-adjust subsequent time slots</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )
    }

    // ---------- UI render (kept your markup) ----------
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onBack && (<button onClick={onBack} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></button>)}
              <div>
                <h2 className="text-2xl font-bold">{mode === 'create' ? 'Create New Timetable' : 'Timetable'}</h2>
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
  onClick={() => {
    clearLocalTimetableData()
    // Reset in-memory data too (so grid instantly clears)
    setScheduleData(createEmptySchedule(days, timeSlots))
    toast.success('Timetable reset successfully!')
  }}
  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
  title="Clear Timetable"
>
  <RotateCcw className="w-5 h-5" />
</button>

                  <button onClick={handleSave} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2">
                    <Save className="w-4 h-4" /><span>Save</span>
                  </button>
                </>
              )}

              {showPDFExport && (
                <button onClick={handleExportPDF} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center space-x-2">
                  <Download className="w-4 h-4" /><span>PDF</span>
                </button>
              )}

              {onPublish && (
                // Show publish in edit/create/view when parent supplied onPublish (parent controls permissions)
                <button
                  onClick={handlePublish}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors flex items-center space-x-2"
                  disabled={!validation.isValid}
                  title={!validation.isValid ? 'Fix validation errors before publishing' : (isPublished ? 'Already published' : 'Publish timetable')}
                >
                  <Share className="w-4 h-4" /><span>{isPublished ? 'Published' : 'Publish'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timetable Info Form (create mode) */}
        {mode === 'create' && (
          <div className="p-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select value={timetableInfo.year} onChange={(e) => setTimetableInfo(prev => ({ ...prev, year: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" required>
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
              <select value={timetableInfo.branch} onChange={(e) => setTimetableInfo(prev => ({ ...prev, branch: e.target.value.toUpperCase() }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" required>
                <option value="">Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="CS">CS</option>
                    <option value="IT">IT</option>
                    <option value="EC">EC</option>
                    <option value="EE">EE</option>
                    <option value="ME">ME</option>
                    <option value="CE">CE</option>
                    <option value="MCA">MCA</option>
                    <option value="MBA">MBA</option>
              </select>
              <select value={timetableInfo.section} onChange={(e) => setTimetableInfo(prev => ({ ...prev, section: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" required>
                <option value="">Select Section</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
              <select value={timetableInfo.semester} onChange={(e) => setTimetableInfo(prev => ({ ...prev, semester: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white" required>
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
              <input type="text" placeholder="Academic Year (e.g., 2025-26)" value={timetableInfo.academicYear} onChange={(e) => setTimetableInfo(prev => ({ ...prev, academicYear: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
        )}

        {/* Controls */}
        {(isEditable || mode === 'edit' || mode === 'create') && (
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Time Slots:</span>
                <button onClick={addTimeSlot} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Add Time Slot"><Plus className="w-4 h-4" /></button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Days:</span>
                <button onClick={addDay} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Add Day"><Plus className="w-4 h-4" /></button>
              </div>

              {deletedTimeSlots.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Restore:</span>
                  <div className="flex space-x-1">
                    {deletedTimeSlots.slice(-3).map((deletedSlot) => (
                      <button key={deletedSlot.timestamp} onClick={() => restoreTimeSlot(deletedSlot)} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded flex items-center space-x-1" title={`Restore ${deletedSlot.slot}`}><Undo2 className="w-3 h-3" /><span>{deletedSlot.slot}</span></button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">Click on any cell to edit • Use controls to add/remove rows and columns • Click time slots to edit timings</div>
            </div>
          </div>
        )}

        {/* Timetable Grid (desktop + mobile kept as you had) */}
        <div className="flex-1 overflow-hidden">
          {/* Desktop Grid */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-max">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border border-gray-300 bg-gray-100 p-2 text-sm font-semibold text-center min-w-[120px]">Time / Day</th>
                    {days.map(day => (
                      <th key={day} className="border border-gray-300 bg-gray-100 p-2 text-sm font-semibold text-center min-w-[150px] relative">
                        {day}
                        {(isEditable || mode === 'edit' || mode === 'create') && days.length > 1 && (<button onClick={() => removeDay(day)} className="absolute top-1 right-1 p-1 text-red-500 hover:bg-red-100 rounded" title={`Remove ${day}`}><X className="w-3 h-3" /></button>)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((timeSlot, rowIndex) => {
                    // Handle shouldSkipRow logic for hidden cells
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
                                <button onClick={() => setEditingTimeSlot({ index: rowIndex, timeSlot })} className="p-1 text-blue-500 hover:bg-blue-100 rounded" title="Edit Time Slot"><Edit className="w-3 h-3" /></button>
                                {timeSlots.length > 1 && (<button onClick={() => removeTimeSlot(timeSlot)} className="p-1 text-red-500 hover:bg-red-100 rounded" title="Remove Time Slot"><Minus className="w-3 h-3" /></button>)}
                              </div>
                            )}
                          </div>
                        </td>

                        {days.map(day => {
                          const cellContent = getCellContent(day, timeSlot)
                          const cellStyling = getCellStyling(cellContent.type, cellContent.subject)
                          if (cellContent.isHidden) return null

                          return (
                            <td
  key={`${day}-${timeSlot}`}
  className={`relative border border-gray-300 p-1 text-xs cursor-pointer transition-colors hover:bg-gray-50 ${(cellContent.type === 'split-lab') ? 'bg-violet-50 border-violet-200' : cellStyling.bgColor}`}
  rowSpan={cellContent.isMerged ? cellContent.mergeRows : 1}
  onClick={() => (isEditable || mode === 'edit' || mode === 'create') && handleCellClick(day, timeSlot)}
  style={{ verticalAlign: 'middle', ...(cellContent.isMerged && { borderRadius: '6px', backgroundColor: '#f5f3ff', border: '1px solid #c4b5fd' }) }}
>

                              <div className="min-h-[60px] flex flex-col justify-center items-center text-center">
                                {/* Content rendering for all cell types */}
{cellContent.isEmpty ? (
  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
    Click to add
  </div>
) : (
  <div className="p-2 h-full flex flex-col justify-center items-center text-center relative">

    {/* Handle type-specific display */}
    {['lunch', 'break', 'library', 'mini project', 'mentor'].includes(cellContent.type) ? (
      <span className="font-bold text-gray-800">
        {cellContent.subject || cellContent.type.toUpperCase()}
      </span>
   ) : cellContent.type === 'split-lab' ? (
  <div className="p-2 h-full flex flex-col justify-center items-center text-center space-y-1">
    <div className="font-semibold text-violet-800">
      {cellContent.batch ? `${cellContent.batch}: ${cellContent.subject}` : cellContent.subject}
    </div>
    {cellContent.code && (
      <div className="text-xs text-gray-500">{cellContent.code}</div>
    )}
    {cellContent.teacher && (
      <div className="text-xs text-gray-600">{cellContent.teacher}</div>
    )}
    {cellContent.room && (
      <div className="text-xs text-gray-500">📍 {cellContent.room}</div>
    )}
  </div>

    ) : (
      <>
        <div className="font-medium text-sm text-gray-900 truncate">{cellContent.subject}</div>
        {cellContent.code && <div className="text-xs text-gray-500 truncate">{cellContent.code}</div>}
        {cellContent.teacher && <div className="text-xs text-gray-600 truncate">{cellContent.teacher}</div>}
        {cellContent.room && <div className="text-xs text-gray-500 truncate">📍 {cellContent.room}</div>}
      </>
    )}

    

  </div>
)}


{/* 🗑️ Trash icon visible on all non-empty cell types */}
{!cellContent.isEmpty && (isEditable || mode === 'edit' || mode === 'create') && (
  <button
    onClick={(e) => { e.stopPropagation(); handleClearCell(day, timeSlot) }}
    className="absolute top-1 right-1 p-1 rounded hover:bg-red-100 text-red-500"
    title="Clear this cell"
  >
    <Trash2 className="w-3 h-3" />
  </button>
)}


                                {cellContent.duration === 2 && (
  <div className="text-xs text-blue-600 font-medium">
    {cellContent.isFirstSlot ? '2hr Lab' : 'Cont.'}
  </div>
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

          {/* Mobile view (kept your markup) */}
          <div className="md:hidden space-y-4 p-4">
            {days.map(day => (
              <div key={day} className="bg-white rounded-lg shadow-sm border">
                <div className="bg-gray-100 px-4 py-3 rounded-t-lg flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{day}</h3>
                  {(isEditable || mode === 'edit' || mode === 'create') && days.length > 1 && (<button onClick={() => removeDay(day)} className="p-1 text-red-500 hover:bg-red-100 rounded" title={`Remove ${day}`}><X className="w-4 h-4" /></button>)}
                </div>
                <div className="divide-y divide-gray-200">
                  {timeSlots.map((timeSlot, index) => {
                    const cellContent = getCellContent(day, timeSlot)
                    const cellStyling = getCellStyling(cellContent.type, cellContent.subject)
                    return (
                      <div key={timeSlot} className={`p-3 ${cellStyling.bgColor} ${(isEditable || mode === 'edit' || mode === 'create') ? 'cursor-pointer hover:bg-gray-50' : ''}`} onClick={() => (isEditable || mode === 'edit' || mode === 'create') && handleCellClick(day, timeSlot)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-600">{timeSlot}</span>
                          {(scheduleData[day]?.[timeSlot]?.subject || scheduleData[day]?.[timeSlot]?.teacher) &&
 (isEditable || mode === 'edit' || mode === 'create') && (
  <button
    onClick={(e) => { e.stopPropagation(); handleClearCell(day, timeSlot) }}
    className="p-1 rounded hover:bg-red-100 text-red-500"
    title="Clear this cell"
  >
    <Trash2 className="w-3 h-3" />
  </button>
)}

                          {/* {(isEditable || mode === 'edit' || mode === 'create') && (
                            <div className="flex space-x-1">
                              <button onClick={(e) => { e.stopPropagation(); setEditingTimeSlot({ index, timeSlot }) }} className="p-1 text-blue-500 hover:bg-blue-100 rounded" title="Edit Time Slot"><Edit className="w-3 h-3" /></button>
                              {timeSlots.length > 1 && (<button onClick={(e) => { e.stopPropagation(); removeTimeSlot(timeSlot) }} className="p-1 text-red-500 hover:bg-red-100 rounded" title="Remove Time Slot"><Minus className="w-3 h-3" /></button>)}
                            </div>
                          )} */}
                        </div>

                        <div className="text-center">
                         {/* Content rendering for all cell types */}
{cellContent.isEmpty ? (
  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
    Click to add
  </div>
) : (
  <div className="p-2 h-full flex flex-col justify-center items-center">
    {/* Handle type-specific display */}
    {['lunch', 'break', 'library', 'mini project', 'mentor'].includes(cellContent.type) ? (
      <span className="font-bold text-center text-gray-800">
        {cellContent.subject || cellContent.type.toUpperCase()}
      </span>
    ) : cellContent.type === 'split-lab' ? (
  <div className="p-2 h-full flex flex-col justify-center items-center text-center space-y-1">
    <div className="font-semibold text-violet-800">
      {cellContent.batch ? `${cellContent.batch}: ${cellContent.subject}` : cellContent.subject}
    </div>
    {cellContent.code && (
      <div className="text-xs text-gray-500">{cellContent.code}</div>
    )}
    {cellContent.teacher && (
      <div className="text-xs text-gray-600">{cellContent.teacher}</div>
    )}
    {cellContent.room && (
      <div className="text-xs text-gray-500">📍 {cellContent.room}</div>
    )}
  </div>

    ) : (
      <>
        <div className="font-medium text-sm text-gray-900 truncate">{cellContent.subject}</div>
        {cellContent.code && <div className="text-xs text-gray-500 truncate">{cellContent.code}</div>}
        {cellContent.teacher && <div className="text-xs text-gray-600 truncate">{cellContent.teacher}</div>}
        {cellContent.room && <div className="text-xs text-gray-500 truncate">📍 {cellContent.room}</div>}
      </>
    )}

    {/* 🗑️ Trash icon — shown for ALL non-empty cells */}
    {(isEditable || mode === 'edit' || mode === 'create') && (
      <button
        onClick={(e) => { e.stopPropagation(); handleClearCell(day, timeSlot) }}
        className="absolute top-1 right-1 p-1 rounded hover:bg-red-100 text-red-500"
        title="Clear this cell"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    )}
  </div>
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
        {editingCell && <EditModal isOpen={!!editingCell} onClose={() => setEditingCell(null)} onSave={handleSaveCell} initialData={editingCell.data} timeSlot={editingCell.timeSlot} day={editingCell.day} data={data} timetableData={timetableData} />}

        {/* Time Slot Edit Modal */}
        <TimeSlotEditModal isOpen={!!editingTimeSlot} onClose={() => setEditingTimeSlot(null)} onSave={handleTimeSlotEdit} initialTimeSlot={editingTimeSlot?.timeSlot} index={editingTimeSlot?.index} />
      </div>
    )
  }


  export default TimetableGrid
