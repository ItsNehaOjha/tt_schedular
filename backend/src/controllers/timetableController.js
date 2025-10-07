import { validationResult } from 'express-validator'
import Timetable from '../models/Timetable.js'
import User from '../models/User.js'
import { AppError } from '../utils/errorHandler.js'
import { asyncHandler } from '../utils/errorHandler.js'
import { createTimetableNotification } from './notificationController.js'

// @desc    Get all timetables (for coordinators)
// @route   GET /api/timetable
// @access  Private (Coordinator only)
export const getTimetables = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, year, branch, section, isPublished } = req.query

  const query = {}
  if (year) query.year = year
  if (branch) query.branch = branch
  if (section) query.section = section
  if (isPublished !== undefined) query.isPublished = isPublished === 'true'

  const timetables = await Timetable.find(query)
    .populate('createdBy', 'username firstName lastName')
    .populate('lastModifiedBy', 'username firstName lastName')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  const total = await Timetable.countDocuments(query)

  res.status(200).json({
    success: true,
    count: timetables.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: timetables
  })
})

// @desc    Get timetable by branch and section (public access)
// @route   GET /api/timetable/:branch/:section
// @access  Public
export const getTimetableByBranchSection = asyncHandler(async (req, res, next) => {
  const { branch, section } = req.params
  const { year } = req.query

  if (!year) {
    return next(new AppError('Year parameter is required', 400))
  }

  // Map numeric year to full year format for database query
  const yearMapping = {
    '1': '1st Year',
    '2': '2nd Year', 
    '3': '3rd Year',
    '4': '4th Year'
  }
  
  const mappedYear = yearMapping[year] || year

  // Debug: Log the search parameters
  console.log('🔍 Searching for timetable with parameters:', {
    year: mappedYear,
    branch,
    section,
    isPublished: true
  })

  const timetable = await Timetable.findOne({
    year: mappedYear,
    branch,
    section,
    isPublished: true
  }).populate('createdBy', 'username firstName lastName')

  if (!timetable) {
    console.log('❌ No published timetable found with the specified criteria')
    return next(new AppError('No published timetable found for this class', 404))
  }

  console.log('✅ Found timetable:', {
    id: timetable._id,
    year: timetable.year,
    branch: timetable.branch,
    section: timetable.section,
    isPublished: timetable.isPublished
  })

  res.status(200).json({
    success: true,
    data: timetable
  })
})

// @desc    View timetable (public access for students)
// @route   GET /api/timetable/view?year=2&branch=CSE&section=A
// @access  Public
export const viewTimetable = asyncHandler(async (req, res, next) => {
  const { year, branch, section } = req.query

  if (!year || !branch || !section) {
    return next(new AppError('Year, branch, and section are required', 400))
  }

  // Map numeric year to full year format for database query
  const yearMapping = {
    '1': '1st Year',
    '2': '2nd Year', 
    '3': '3rd Year',
    '4': '4th Year'
  }
  
  const mappedYear = yearMapping[year] || year

  const timetable = await Timetable.findOne({ 
    year: mappedYear, 
    branch: branch.toLowerCase(), 
    section: section.toUpperCase(), 
    isPublished: true 
  }).populate('createdBy', 'username firstName lastName')

  if (!timetable) {
    return next(new AppError('No published timetable found for this class', 404))
  }

  res.status(200).json({ 
    success: true, 
    data: timetable 
  })
})

// @desc    Get teacher's timetable
// @route   GET /api/timetable/teacher/:id
// @access  Public
export const getTeacherTimetable = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  // Check if teacher exists
  const teacher = await User.findById(id)
  if (!teacher) {
    return next(new AppError('Teacher not found', 404))
  }

  // Find all timetables where this teacher is assigned
  const timetables = await Timetable.find({
    'schedule.teacher.id': id,
    isPublished: true
  }).populate('createdBy', 'username firstName lastName')

  // Extract teacher's schedule from all timetables
  const teacherSchedule = []
  
  timetables.forEach(timetable => {
    timetable.schedule.forEach(slot => {
      if (slot.teacher.id && slot.teacher.id.toString() === id) {
        teacherSchedule.push({
          day: slot.day,
          timeSlot: slot.timeSlot,
          subject: slot.subject,
          type: slot.type,
          room: slot.room,
          class: `${timetable.year} ${timetable.branch} ${timetable.section}`,
          timetableId: timetable._id,
          academicYear: timetable.academicYear
        })
      }
    })
  })

  // Sort by day and time
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  teacherSchedule.sort((a, b) => {
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    if (dayDiff !== 0) return dayDiff
    return a.timeSlot.localeCompare(b.timeSlot)
  })

  res.status(200).json({
    success: true,
    count: teacherSchedule.length,
    data: teacherSchedule,
    teacher: {
      id: teacher._id,
      name: teacher.displayName || `${teacher.firstName} ${teacher.lastName}`.trim(),
      username: teacher.username
    }
  })
})

// @desc    Create new timetable
// @route   POST /api/timetable
// @access  Private (Coordinator only)
export const createTimetable = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array())
    return next(new AppError(errors.array()[0].msg, 400))
  }

  const { year, branch, section, semester, academicYear, schedule } = req.body

  // Check if timetable already exists
  const existingTimetable = await Timetable.findOne({ year, branch, section })
  if (existingTimetable) {
    // Instead of throwing error, return the existing timetable with a message
    return res.status(200).json({
      success: true,
      message: 'Timetable already exists for this class. Use update endpoint to modify it.',
      data: existingTimetable,
      exists: true
    })
  }

  // Process schedule data to ensure proper format
  const processedSchedule = schedule.map(slot => ({
    day: slot.day,
    timeSlot: slot.timeSlot,
    subject: {
      acronym: slot.subject?.acronym || slot.subject || '',
      code: slot.subject?.code || '',
      name: slot.subject?.name || slot.subject?.acronym || slot.subject || ''
    },
    teacher: {
      id: slot.teacher?.id || null,
      name: typeof slot.teacher === 'string' ? slot.teacher : (slot.teacher?.name || ''),
      username: slot.teacher?.username || ''
    },
    type: slot.type || 'lecture',
    room: slot.room || ''
  }))

  const timetable = await Timetable.create({
    year,
    branch,
    section,
    semester,
    academicYear,
    schedule: processedSchedule,
    createdBy: req.user.id
  })

  await timetable.populate('createdBy', 'username firstName lastName')

  res.status(201).json({
    success: true,
    data: timetable
  })
})

// Add a new endpoint to get timetable by class details for coordinators
// @desc    Get timetable by class details (for coordinators)
// @route   GET /api/timetable/class?year=1&branch=cse&section=A
// @access  Private (Coordinator only)
export const getTimetableByClass = asyncHandler(async (req, res, next) => {
  const { year, branch, section } = req.query

  if (!year || !branch || !section) {
    return next(new AppError('Year, branch, and section are required', 400))
  }

  const timetable = await Timetable.findOne({
    year,
    branch,
    section
  }).populate('createdBy', 'username firstName lastName')

  if (!timetable) {
    return next(new AppError('Timetable not found', 404))
  }

  res.status(200).json({
    success: true,
    data: timetable
  })
})

// @desc    Update timetable
// @route   PUT /api/timetable/:id
// @access  Private (Coordinator only)
export const updateTimetable = asyncHandler(async (req, res, next) => {
  let timetable = await Timetable.findById(req.params.id)

  if (!timetable) {
    return next(new AppError('Timetable not found', 404))
  }

  // Update fields
  const updateFields = { ...req.body, lastModifiedBy: req.user.id }
  
  timetable = await Timetable.findByIdAndUpdate(
    req.params.id,
    updateFields,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy lastModifiedBy', 'username firstName lastName')

  res.status(200).json({
    success: true,
    data: timetable
  })
})

// @desc    Publish/Unpublish timetable
// @route   PUT /api/timetable/:id/publish
// @access  Private (Coordinator only)
export const publishTimetable = asyncHandler(async (req, res, next) => {
  const timetable = await Timetable.findById(req.params.id)

  if (!timetable) {
    return next(new AppError('Timetable not found', 404))
  }

  const { isPublished } = req.body

  timetable.isPublished = isPublished
  timetable.publishedAt = isPublished ? new Date() : null
  timetable.lastModifiedBy = req.user.id

  await timetable.save()

  // Create notification when timetable is published
  if (isPublished) {
    await createTimetableNotification(timetable._id, 'timetable_published', req.user.id)
  }

  res.status(200).json({
    success: true,
    message: `Timetable ${isPublished ? 'published' : 'unpublished'} successfully`,
    data: timetable
  })
})

// @desc    Delete timetable
// @route   DELETE /api/timetable/:id
// @access  Private (Coordinator only)
export const deleteTimetable = asyncHandler(async (req, res, next) => {
  const timetable = await Timetable.findById(req.params.id)

  if (!timetable) {
    return next(new AppError('Timetable not found', 404))
  }

  await timetable.deleteOne()

  res.status(200).json({
    success: true,
    message: 'Timetable deleted successfully'
  })
})

// @desc    Get timetable statistics
// @route   GET /api/timetable/stats
// @access  Private (Coordinator only)
export const getTimetableStats = asyncHandler(async (req, res, next) => {
  const stats = await Timetable.aggregate([
    {
      $group: {
        _id: null,
        totalTimetables: { $sum: 1 },
        publishedTimetables: {
          $sum: { $cond: [{ $eq: ['$isPublished', true] }, 1, 0] }
        },
        draftTimetables: {
          $sum: { $cond: [{ $eq: ['$isPublished', false] }, 1, 0] }
        }
      }
    }
  ])

  const branchStats = await Timetable.aggregate([
    {
      $group: {
        _id: '$branch',
        count: { $sum: 1 }
      }
    }
  ])

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || {
        totalTimetables: 0,
        publishedTimetables: 0,
        draftTimetables: 0
      },
      branchStats
    }
  })
})

