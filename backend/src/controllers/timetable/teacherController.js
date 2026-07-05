import mongoose from 'mongoose';
import Timetable from '../../models/Timetable.js'
import User from '../../models/User.js'
import { AppError, asyncHandler } from '../../utils/errorHandler.js'

// GET TEACHER TIMETABLE (Flexible Matching)
export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const lookup = req.params.id || req.query.teacherId || req.query.id || req.query.name;
  if (!lookup) throw new AppError('Teacher ID or Name is required', 400);

  // 1) Find teacher by ID, teacherId, or name (Flexible)
  const teacher = await User.findOne({
    role: 'teacher',
    $or: [
      mongoose.isValidObjectId(lookup) ? { _id: lookup } : null,
      { teacherId: lookup },
      { normalizedName: new RegExp(lookup.toLowerCase(), 'i') },
      { displayName: new RegExp(lookup, 'i') }
    ].filter(Boolean)
  }).lean();

  if (!teacher) throw new AppError('Teacher not found', 404);

  // 2) Find ALL published timetables where teacher is present (Flexible matching in schedule)
  const { semester, academicYear } = req.query;
  const filter = {
    isPublished: true,
    $or: [
      { 'schedule.teacher.id': teacher._id },                // Match by MongoDB _id
      { 'schedule.teacherId': teacher.teacherId },          // Match by custom teacherId
      { 'schedule.teacher.name': new RegExp(teacher.firstName.split(' ')[0], 'i') } // Match by partial name (e.g. "Tushar")
    ]
  };

  if (semester) {
    filter.semester = Number(semester);
  }
  if (academicYear) {
    filter.academicYear = academicYear;
  }

  const tts = await Timetable.find(filter).sort({ publishedAt: -1, updatedAt: -1 }).lean();

  if (!tts.length) {
    return res.status(404).json({ success: false, message: 'No teaching schedule found' });
  }

  // 3) Extract matching schedule entries
  const entries = [];
  for (const tt of tts) {
    for (const s of tt.schedule || []) {
      const match =
        (s?.teacher?.id && String(s.teacher.id) === String(teacher._id)) ||
        (s?.teacher?.name && new RegExp(teacher.firstName.split(' ')[0], 'i').test(s.teacher.name)) ||
        (s?.teacherId && s.teacherId === teacher.teacherId);

      if (!match) continue;

      entries.push({
        timetableId: tt._id,
        academicYear: tt.academicYear,
        semester: tt.semester,
        branch: tt.branch,
        year: tt.year,
        section: tt.section,
        day: s.day,
        slotKey: s.slotKey || null,
        timeSlot: s.timeSlot || '',
        subject: s.subject?.name || s.subject?.acronym || '',
        class: `${tt.year} ${tt.branch} ${tt.section}`,
        room: s.room || '',
        type: s.type || 'lecture',
      });
    }
  }

  if (!entries.length) {
    return res.status(404).json({ success: false, message: 'No teaching schedule found' });
  }

  // 4) Build days and timeslot grid
  const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlotSet = [...new Set(entries.map(e => e.timeSlot))];
  const timeSlots = timeSlotSet;
  const days = DAY_ORDER.filter(d => entries.some(e => e.day === d));

  const scheduleGrid = {};
  for (const d of days) {
    scheduleGrid[d] = {};
    for (const t of timeSlots) scheduleGrid[d][t] = null;
  }

  for (const e of entries) {
    if (!scheduleGrid[e.day]) continue;
    const slot = e.timeSlot;
    if (!scheduleGrid[e.day][slot]) {
      scheduleGrid[e.day][slot] = e;
    } else {
      const existing = scheduleGrid[e.day][slot];
      if (Array.isArray(existing)) existing.push(e);
      else scheduleGrid[e.day][slot] = [existing, e];
    }
  }

  const latestAY = tts[0]?.academicYear || entries[0]?.academicYear || '';

  return res.json({
    success: true,
    data: {
      teacher: {
        id: String(teacher._id),
        name: teacher.displayName,
        department: teacher.department || '',
        teacherId: teacher.teacherId || '',
      },
      meta: {
        latestAcademicYear: latestAY,
        classes: [...new Set(entries.map(e => `${e.year} ${e.branch} ${e.section} (${e.academicYear})`))],
      },
      grid: { days, timeSlots, schedule: scheduleGrid },
      flat: entries,
    }
  });
});
