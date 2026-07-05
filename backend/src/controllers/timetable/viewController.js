import jwt from 'jsonwebtoken'
import Timetable from '../../models/Timetable.js'
import User from '../../models/User.js'
import { AppError, asyncHandler } from '../../utils/errorHandler.js'

// GET TIMETABLE BY BRANCH + SECTION (for Students)
export const getTimetableByBranchSection = asyncHandler(async (req, res, next) => {
  const { branch, section } = req.params
  const { year, semester, academicYear } = req.query

  const query = {
    year,
    branch: branch.toUpperCase(),
    section: section.toUpperCase(),
    isPublished: true
  }

  if (semester) {
    query.semester = Number(semester)
  }
  if (academicYear) {
    query.academicYear = academicYear
  }

  const timetable = await Timetable.findOne(query)
    .sort({ academicYear: -1, semester: -1, updatedAt: -1 })
    .populate('createdBy', 'username firstName lastName')

  if (!timetable) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'No published timetable yet'
    });
  }

  const days = [...new Set(timetable.schedule.map(s => s.day))].filter(Boolean)
  const timeSlots = [...new Set(timetable.schedule.map(s => s.timeSlot))].filter(Boolean)

  res.status(200).json({
    success: true,
    data: { ...timetable.toObject(), days, timeSlots }
  })
})

// VIEW TIMETABLE (by Query Params with Coordinator Draft bypass support)
export const viewTimetable = asyncHandler(async (req, res, next) => {
  const { year, branch, section, semester, academicYear } = req.query

  if (!year || !branch || !section || !semester || !academicYear) {
    return next(new AppError('Year, branch, section, semester, and academic year are required', 400))
  }

  const yearMapping = {
    '1': '1st Year',
    '2': '2nd Year',
    '3': '3rd Year',
    '4': '4th Year'
  }
  const mappedYear = yearMapping[year] || year

  let isCoordinator = false
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.id)
      if (user && user.role === 'coordinator' && user.isActive) {
        isCoordinator = true
      }
    } catch (err) {
      // Ignore token verification errors to fall back to public published-only queries
    }
  }

  const query = {
    year: mappedYear,
    branch: branch.toUpperCase(),
    section: section.toUpperCase(),
    semester: Number(semester),
    academicYear
  }

  if (!isCoordinator) {
    query.isPublished = true
  }

  const timetable = await Timetable.findOne(query).populate('createdBy', 'username firstName lastName')

  if (!timetable) {
    return res.status(200).json({
      success: true,
      data: null,
      message: 'No published timetable yet'
    });
  }

  const days = [...new Set(timetable.schedule.map(s => s.day))].filter(Boolean)
  const timeSlots = [...new Set(timetable.schedule.map(s => s.timeSlot))].filter(Boolean)

  res.status(200).json({
    success: true,
    data: { ...timetable.toObject(), days, timeSlots }
  })
})

// GET TIMETABLE BY CLASS (for Coordinators)
export const getTimetableByClass = asyncHandler(async (req, res, next) => {
  const { year, branch, section, semester, academicYear } = req.query
  if (!year || !branch || !section || !semester || !academicYear) {
    return next(new AppError('Year, branch, section, semester, and academic year are required', 400))
  }

  const timetable = await Timetable.findOne({
    year,
    branch: branch.toUpperCase(),
    section: section.toUpperCase(),
    semester: Number(semester),
    academicYear
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
