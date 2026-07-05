import Timetable from '../../models/Timetable.js'
import { AppError, asyncHandler } from '../../utils/errorHandler.js'

export const getBusyTeachersForSlot = asyncHandler(async (req, res) => {
  const { day } = req.query;
  const rawTime = req.query.timeSlot || req.query.slotKey || '';
  const {
    excludeBranch,
    excludeYear,
    excludeSection,
    excludeAcademicYear,
    excludeSemester
  } = req.query;
  
  if (!day || !rawTime) {
    throw new AppError('day and timeSlot are required', 400);
  }

  // Helpers to parse time into minutes (tolerant to AM/PM and spaces)
  const toMinutes = (t) => {
    if (!t) return null;
    const raw = String(t).trim();
    const hasAM = /\bAM\b/i.test(raw);
    const hasPM = /\bPM\b/i.test(raw);
    const clean = raw.replace(/\s*(AM|PM)\s*/gi, '');
    const [hStr, mStr] = clean.split(':');
    let h = Number(hStr);
    const m = Number(mStr || 0);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    if (hasPM && h !== 12) h += 12;
    if (hasAM && h === 12) h = 0;
    return h * 60 + m;
  };
  const parseRange = (range) => {
    if (!range || typeof range !== 'string' || !range.includes('-')) return null;
    const [start, end] = range.split('-').map(s => s.trim());
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (s == null || e == null || e <= s) return null;
    return { s, e };
  };
  const overlaps = (a, b) => a && b && Math.max(a.s, b.s) < Math.min(a.e, b.e);

  const qRange = parseRange(rawTime);
  if (!qRange) throw new AppError('Invalid timeSlot format. Expected HH:MM-HH:MM (AM/PM supported)', 400);

  // Load all timetables that contain the given day (case-insensitive)
  const timetables = await Timetable.find({ 'schedule.day': { $regex: new RegExp(`^${day}$`, 'i') } }, {
    year: 1,
    branch: 1,
    section: 1,
    schedule: 1
  }).lean();

  const busyMap = new Map();
  for (const tt of timetables) {
    // Skip the current class being edited to avoid self-clash detection
    if (excludeBranch && excludeYear && excludeSection) {
      const isSameClass = 
        String(tt.branch).toUpperCase() === String(excludeBranch).toUpperCase() &&
        String(tt.year) === String(excludeYear) &&
        String(tt.section).toUpperCase() === String(excludeSection).toUpperCase() &&
        (!excludeAcademicYear || String(tt.academicYear) === String(excludeAcademicYear)) &&
        (!excludeSemester || Number(tt.semester) === Number(excludeSemester));
      
      if (isSameClass) continue;
    }
    
    for (const slot of tt.schedule || []) {
      if (!slot?.day || !new RegExp(`^${day}$`, 'i').test(slot.day)) continue;
      if (!slot?.timeSlot) continue; // need a concrete time range
      const sRange = parseRange(String(slot.timeSlot));
      if (!sRange) continue;
      if (!overlaps(qRange, sRange)) continue;

      const teacherIdVal = (slot.teacher && (slot.teacher.id || slot.teacher._id)) ? String(slot.teacher.id || slot.teacher._id) : null;
      const teacherName = slot.teacher?.name || '';
      if (!teacherIdVal && !teacherName) continue;

      const key = teacherIdVal || `name:${teacherName}`;
      if (!busyMap.has(key)) {
        busyMap.set(key, {
          teacherId: teacherIdVal || '',
          teacherName,
          clashWith: {
            year: tt.year,
            branch: tt.branch,
            section: tt.section,
            timeSlot: slot.timeSlot
          }
        });
      }
    }
  }

  const busyTeachers = Array.from(busyMap.values());
  const busyTeacherIds = busyTeachers.map(t => t.teacherId || t.teacherName).filter(Boolean);
  
  // Also return detailed information for frontend display
  const busyTeachersDetails = busyTeachers.map(t => ({
    id: t.teacherId || t.teacherName,
    teacherId: t.teacherId,
    year: t.clashWith.year,
    branch: t.clashWith.branch,
    section: t.clashWith.section,
    timeSlot: t.clashWith.timeSlot,
    classLabel: `${t.clashWith.branch || ''} . ${t.clashWith.year || ''}${t.clashWith.branch || ''}${t.clashWith.section ? `-${t.clashWith.section}` : ''}`.trim()
  }));
  
  return res.json({ success: true, busyTeachers: busyTeacherIds, busyTeachersDetails });
});
