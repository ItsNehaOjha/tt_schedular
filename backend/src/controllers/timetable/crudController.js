import { validationResult } from 'express-validator'
import Timetable from '../../models/Timetable.js'
import Notification from '../../models/Notification.js'
import { AppError, asyncHandler } from '../../utils/errorHandler.js'
import { isTeacherBusy } from './helpers/busyTeacherUtils.js'
import { normalizeBranch } from '../../utils/branchHelper.js'

// GET ALL TIMETABLES
export const getTimetables = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, year, branch, section, isPublished, semester, academicYear, isDraft } = req.query

  const query = {}
  if (year) query.year = year
  if (branch) query.branch = branch
  if (section) query.section = section
  if (isPublished !== undefined) query.isPublished = isPublished === 'true'
  if (typeof isDraft !== 'undefined') query.isDraft = String(isDraft) === 'true'
  if (semester) query.semester = Number(semester)
  if (academicYear) query.academicYear = academicYear

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

// CREATE TIMETABLE
export const createTimetable = asyncHandler(async (req, res, next) => {
  if (req.body.branch) req.body.branch = normalizeBranch(req.body.branch);
  if (req.body.section) req.body.section = req.body.section.toUpperCase().trim();

  const errors = validationResult(req)
  if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400))

  const { year, branch, section, semester, academicYear, schedule } = req.body

  if (branch) req.body.branch = normalizeBranch(branch);
  if (section) req.body.section = section.toUpperCase();

  const existing = await Timetable.findOne({ 
    year, 
    branch: req.body.branch, 
    section: req.body.section,
    semester,
    academicYear
  })
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
    teacher: (() => {
      if (!slot.teacher) return { id: null, name: '', username: '' };
      if (typeof slot.teacher === 'string') return { id: null, name: slot.teacher, username: '' };
      return {
        id: slot.teacher.id || null,
        name: slot.teacher.name || '',
        username: slot.teacher.username || ''
      };
    })(),
    type: slot.type || 'lecture',
    room: slot.room || ''
  }))

  const conflicts = [];
  for (const s of processedSchedule) {
    const teacherKey = s?.teacher?.id || s?.teacher?.username;
    if (!teacherKey) continue;
    const busy = await isTeacherBusy(
      teacherKey,
      s.day,
      s.timeSlot,
      { treatDraftsAsBusy: true, busyAcademicYear: academicYear, busySemester: semester },
      req.body.section
    );
    if (busy) {
      conflicts.push({ day: s.day, timeSlot: s.timeSlot, teacher: s.teacher, reason: 'Teacher busy in another class' });
    }
  }
  if (conflicts.length) {
    return res.status(409).json({ success: false, message: 'Teacher clash detected across classes', conflicts });
  }

  const timetable = await Timetable.create({
    year,
    branch: req.body.branch,
    section: req.body.section,
    semester,
    academicYear,
    schedule: processedSchedule,
    createdBy: req.user?._id || null
  })

  await timetable.populate('createdBy', 'username firstName lastName')

  res.status(201).json({ success: true, data: timetable })
})

// UPDATE TIMETABLE
export const updateTimetable = asyncHandler(async (req, res, next) => {
  if (req.body.branch) req.body.branch = normalizeBranch(req.body.branch);
  if (req.body.section) req.body.section = req.body.section.toUpperCase().trim();

  let timetable = await Timetable.findById(req.params.id);
  if (!timetable) return next(new AppError('Timetable not found', 404));

  if (req.body.schedule) {
    req.body.schedule = req.body.schedule.map(slot => ({
      day: slot.day,
      timeSlot: slot.timeSlot,
      subject: {
        acronym: slot.subject?.acronym || slot.subject || '',
        code: slot.subject?.code || '',
        name: slot.subject?.name || slot.subject?.acronym || slot.subject || ''
      },
      teacher: (() => {
        if (!slot.teacher) return { id: null, name: '', username: '' };
        if (typeof slot.teacher === 'string') return { id: null, name: slot.teacher, username: '' };
        return {
          id: slot.teacher.id || null,
          name: slot.teacher.name || '',
          username: slot.teacher.username || ''
        };
      })(),
      type: slot.type || 'lecture',
      room: slot.room || ''
    }));
  }

  const classYear = req.body.year || timetable.year;
  const classBranch = (req.body.branch || timetable.branch || '').toUpperCase();
  const classSection = (req.body.section || timetable.section || '').toUpperCase();
  const classSem = req.body.semester ?? timetable.semester;
  const classAY = req.body.academicYear || timetable.academicYear;

  const scheduleToCheck = req.body.schedule || timetable.schedule || [];
  const updConflicts = [];
  for (const s of scheduleToCheck) {
    const teacherKey = s?.teacher?.id || s?.teacher?.username;
    if (!teacherKey) continue;
    const busy = await isTeacherBusy(
      teacherKey,
      s.day,
      s.timeSlot,
      { treatDraftsAsBusy: true, busyAcademicYear: classAY, busySemester: classSem },
      classSection
    );
    if (busy) {
      updConflicts.push({ day: s.day, timeSlot: s.timeSlot, teacher: s.teacher, reason: 'Teacher busy in another class' });
    }
  }
  if (updConflicts.length) {
    return res.status(409).json({ success: false, message: 'Teacher clash detected across classes', conflicts: updConflicts });
  }

  timetable = await Timetable.findByIdAndUpdate(
    req.params.id,
    { ...req.body, lastModifiedBy: req.user?.id || null },
    { new: true, runValidators: true }
  ).populate('createdBy lastModifiedBy', 'username firstName lastName');

  res.status(200).json({ success: true, data: timetable });
})

// DELETE TIMETABLE
export const deleteTimetable = asyncHandler(async (req, res, next) => {
  const timetable = await Timetable.findById(req.params.id)
  if (!timetable) return next(new AppError('Timetable not found', 404))

  // Delete all related notifications
  await Notification.deleteMany({ relatedTimetable: timetable._id })

  await timetable.deleteOne()
  res.status(200).json({ success: true, message: 'Timetable deleted successfully' })
})
