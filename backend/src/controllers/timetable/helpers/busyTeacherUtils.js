import Timetable from '../../../models/Timetable.js';

// Helpers to parse time into minutes
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

export const isTeacherBusy = async (teacherId, day, timeSlot, options = {}, excludeSection = null) => {
  if (!teacherId) return false;
  const { treatDraftsAsBusy = true, busyAcademicYear, busySemester } = options || {};

  const qRange = parseRange(timeSlot);
  if (!qRange) return false; // Invalid time range cannot clash

  // Find all timetables for this day, academic year, and semester
  const query = {
    'schedule.day': { $regex: new RegExp(`^${day}$`, 'i') }
  };
  
  if (busyAcademicYear) query.academicYear = busyAcademicYear;
  if (busySemester) query.semester = Number(busySemester);

  const visibilityMatch = treatDraftsAsBusy
    ? { $or: [{ isPublished: true }, { isDraft: true }] }
    : { isPublished: true };

  // Combine query filters
  const filter = { ...query, ...visibilityMatch };

  if (excludeSection) {
    filter.section = { $ne: excludeSection };
  }

  const timetables = await Timetable.find(filter).lean();

  for (const tt of timetables) {
    for (const slot of tt.schedule || []) {
      if (!slot?.day || !new RegExp(`^${day}$`, 'i').test(slot.day)) continue;
      if (!slot?.timeSlot) continue;

      const sRange = parseRange(slot.timeSlot);
      if (!sRange) continue;

      // Check if the slot overlaps with our query time slot
      if (overlaps(qRange, sRange)) {
        // Check if the teacher matches
        const slotTeacherId = (slot.teacher && (slot.teacher.id || slot.teacher._id)) ? String(slot.teacher.id || slot.teacher._id) : null;
        const slotTeacherUsername = slot.teacher?.username || '';
        const slotTeacherCustomId = slot.teacherId || '';

        const match = 
          String(teacherId) === String(slotTeacherId) ||
          String(teacherId) === String(slotTeacherUsername) ||
          String(teacherId) === String(slotTeacherCustomId);

        if (match) {
          return true; // Clash found!
        }
      }
    }
  }

  return false;
};
