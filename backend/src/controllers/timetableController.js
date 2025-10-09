// backend/controllers/timetableController.js
import { validationResult } from 'express-validator'
import Timetable from '../models/Timetable.js'
import User from '../models/User.js'
import { AppError, asyncHandler } from '../utils/errorHandler.js'
import { createTimetableNotification } from './notificationController.js'

/* ============================================================
   🟢 GET ALL TIMETABLES (for Coordinators)
   Route: GET /api/timetable
   Access: Private (Coordinator)
============================================================ */
export const getTimetables = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, year, branch, section, isPublished } = req.query

  const query = {}
  if (year) query.year = year
  if (branch) query.branch = branch
  if (section) query.section = section
  if (isPublished !== undefined) query.isPublished = isPublished === 'true'

  const sortOrder = { isPublished: -1, updatedAt: -1, createdAt: -1 }

  const timetables = await Timetable.find(query)
    .populate('createdBy', 'username firstName lastName')
    .populate('lastModifiedBy', 'username firstName lastName')
    .sort(sortOrder)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))

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

/* ============================================================
   🟢 GET TIMETABLE BY BRANCH + SECTION (for Students)
   Route: GET /api/timetable/:branch/:section?year=3rd%20Year
   Access: Public
============================================================ */
export const getTimetableByBranchSection = asyncHandler(async (req, res, next) => {
  const { branch, section } = req.params
  const { year } = req.query

  if (!year) return next(new AppError('Year parameter is required', 400))

  const timetable = await Timetable.findOne({
    year,
    branch: branch.toUpperCase(),
    section: section.toUpperCase(),
    isPublished: true
  }).populate('createdBy', 'username firstName lastName')

  if (!timetable) return next(new AppError('No published timetable found for this class', 404))

  const days = [...new Set(timetable.schedule.map(s => s.day))].filter(Boolean)
  const timeSlots = [...new Set(timetable.schedule.map(s => s.timeSlot))].filter(Boolean)

  res.status(200).json({
    success: true,
    data: { ...timetable.toObject(), days, timeSlots }
  })
})

/* ============================================================
   🟢 VIEW TIMETABLE (by Query Params)
   Route: GET /api/timetable/view?year=3&branch=CSE&section=A
   Access: Public
============================================================ */
export const viewTimetable = asyncHandler(async (req, res, next) => {
  const { year, branch, section } = req.query

  if (!year || !branch || !section) {
    return next(new AppError('Year, branch, and section are required', 400))
  }

  const yearMapping = {
    '1': '1st Year',
    '2': '2nd Year',
    '3': '3rd Year',
    '4': '4th Year'
  }
  const mappedYear = yearMapping[year] || year

  const timetable = await Timetable.findOne({
    year: mappedYear,
    branch: branch.toUpperCase(),
    section: section.toUpperCase(),
    isPublished: true
  }).populate('createdBy', 'username firstName lastName')

  if (!timetable) return next(new AppError('No published timetable found for this class', 404))

  const days = [...new Set(timetable.schedule.map(s => s.day))].filter(Boolean)
  const timeSlots = [...new Set(timetable.schedule.map(s => s.timeSlot))].filter(Boolean)

  res.status(200).json({
    success: true,
    data: { ...timetable.toObject(), days, timeSlots }
  })
})

/* ============================================================
   🟢 GET TEACHER TIMETABLE
   Route: GET /api/timetable/teacher/:id
   Access: Public or Protected
============================================================ */
export const getTeacherTimetable = asyncHandler(async (req, res, next) => {
  const { id } = req.params

  const teacher = await User.findById(id)
  if (!teacher) return next(new AppError('Teacher not found', 404))

  const timetables = await Timetable.find({
    'schedule.teacher.id': id,
    isPublished: true
  }).populate('createdBy', 'username firstName lastName')

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
          class: `${timetable.year} ${timetable.branch.toUpperCase()} ${timetable.section}`,
          timetableId: timetable._id,
          academicYear: timetable.academicYear
        })
      }
    })
  })

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

/* ============================================================
   🟢 GET TIMETABLE BY CLASS (for Coordinators)
   Route: GET /api/timetable/class?year=3rd&branch=CSE&section=A
   Access: Private (Coordinator)
============================================================ */
export const getTimetableByClass = asyncHandler(async (req, res, next) => {
  const { year, branch, section } = req.query
  if (!year || !branch || !section) {
    return next(new AppError('Year, branch, and section are required', 400))
  }

  const timetable = await Timetable.findOne({
    year,
    branch: branch.toUpperCase(),
    section: section.toUpperCase()
  })
    .sort({ updatedAt: -1 })
    .populate('createdBy', 'username firstName lastName')

  if (!timetable) return next(new AppError('Timetable not found', 404))

  const days = [...new Set(timetable.schedule.map(s => s.day))].filter(Boolean)
  const timeSlots = [...new Set(timetable.schedule.map(s => s.timeSlot))].filter(Boolean)

  res.status(200).json({
    success: true,
    data: { ...timetable.toObject(), days, timeSlots }
  })
})

/* ============================================================
   🟢 CREATE TIMETABLE
   Route: POST /api/timetable
   Access: Private (Coordinator)
============================================================ */
export const createTimetable = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400))

  const { year, branch, section, semester, academicYear, schedule } = req.body

  // --- Normalize branch and section casing before saving ---
  if (branch) req.body.branch = branch.toUpperCase();
  if (section) req.body.section = section.toUpperCase();

  const existing = await Timetable.findOne({ year, branch: req.body.branch, section: req.body.section })
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Timetable already exists. Use update endpoint to modify it.',
      data: existing,
      exists: true
    })
  }

  const processedSchedule = (schedule || []).map(slot => ({
    day: slot.day,
    timeSlot: slot.timeSlot,
    subject: {
      acronym: slot.subject?.acronym || slot.subject || '',
      code: slot.subject?.code || '',
      name: slot.subject?.name || slot.subject?.acronym || slot.subject || ''
    },
    teacher: {
      id: slot.teacher?.id || null,
      name: typeof slot.teacher === 'string' ? slot.teacher : slot.teacher?.name || '',
      username: slot.teacher?.username || ''
    },
    type: slot.type || 'lecture',
    room: slot.room || ''
  }))

  const timetable = await Timetable.create({
    year,
    branch: req.body.branch,
    section: req.body.section,
    semester,
    academicYear,
    schedule: processedSchedule,
    createdBy: req.user.id
  })

  await timetable.populate('createdBy', 'username firstName lastName')

  res.status(201).json({ success: true, data: timetable })
})

/* ============================================================
   🟢 UPDATE TIMETABLE
   Route: PUT /api/timetable/:id
   Access: Private (Coordinator)
============================================================ */
export const updateTimetable = asyncHandler(async (req, res, next) => {
  // ✅ Fix: Normalize branch/section before validation or update
  if (req.body.branch) req.body.branch = req.body.branch.toUpperCase().trim();
  if (req.body.section) req.body.section = req.body.section.toUpperCase().trim();

  let timetable = await Timetable.findById(req.params.id)
  if (!timetable) return next(new AppError('Timetable not found', 404))

  timetable = await Timetable.findByIdAndUpdate(
    req.params.id,
    { ...req.body, lastModifiedBy: req.user.id },
    { new: true, runValidators: true }
  ).populate('createdBy lastModifiedBy', 'username firstName lastName')

  res.status(200).json({ success: true, data: timetable })
})

/* ============================================================
   🟢 PUBLISH / UNPUBLISH TIMETABLE
   Route: PUT /api/timetable/:id/publish
   Access: Private (Coordinator)
============================================================ */
export const publishTimetable = asyncHandler(async (req, res, next) => {
  const { year, branch, section, semester, academicYear, schedule, isPublished } = req.body
  if (!year || !branch || !section || !semester || !academicYear)
    return next(new AppError('Missing class identifiers', 400))

  const filter = { year, branch: branch.toUpperCase(), section: section.toUpperCase(), semester, academicYear }
  const timetable = await Timetable.findOne(filter)

  const baseSet = {
    schedule,
    isPublished: !!isPublished,
    publishedAt: isPublished ? new Date() : null,
    lastModifiedBy: req.user._id,
    createdBy: req.user._id,
    updatedAt: new Date()
  }

  const update = { $set: baseSet }

  if (timetable) {
    update.$set.publishedVersion = (timetable.publishedVersion || 1) + 1
    update.$push = {
      revisionHistory: {
        version: update.$set.publishedVersion,
        updatedAt: new Date(),
        updatedBy: req.user._id
      }
    }
  }

  const updated = await Timetable.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    runValidators: true
  }).populate('createdBy lastModifiedBy', 'username firstName lastName')

  if (isPublished) {
    await createTimetableNotification(updated._id, 'timetable_published', req.user._id)
  }

  res.status(200).json({
    success: true,
    message: `Timetable ${isPublished ? 'published' : 'unpublished'} successfully`,
    data: updated
  })
})

/* ============================================================
   🟢 DELETE TIMETABLE
   Route: DELETE /api/timetable/:id
   Access: Private (Coordinator)
============================================================ */
export const deleteTimetable = asyncHandler(async (req, res, next) => {
  const timetable = await Timetable.findById(req.params.id)
  if (!timetable) return next(new AppError('Timetable not found', 404))

  await timetable.deleteOne()
  res.status(200).json({ success: true, message: 'Timetable deleted successfully' })
})

/* ============================================================
   🟢 GET TIMETABLE STATISTICS
   Route: GET /api/timetable/stats
   Access: Private (Coordinator)
============================================================ */
export const getTimetableStats = asyncHandler(async (req, res, next) => {
  const stats = await Timetable.aggregate([
    {
      $group: {
        _id: null,
        totalTimetables: { $sum: 1 },
        publishedTimetables: { $sum: { $cond: [{ $eq: ['$isPublished', true] }, 1, 0] } },
        draftTimetables: { $sum: { $cond: [{ $eq: ['$isPublished', false] }, 1, 0] } }
      }
    }
  ])

  const branchStats = await Timetable.aggregate([{ $group: { _id: '$branch', count: { $sum: 1 } } }])

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || { totalTimetables: 0, publishedTimetables: 0, draftTimetables: 0 },
      branchStats
    }
  })
})
