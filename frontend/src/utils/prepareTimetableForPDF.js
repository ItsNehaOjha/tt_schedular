// src/utils/prepareTimetableForPDF.js
// ===================================================
// Shared utility to standardize timetable data for PDF export
// Used by both Coordinator and Student dashboards
// ===================================================

/**
 * Converts backend timetable.schedule array into a consistent day → timeSlot → cellData map.
 * @param {Object} timetable - The timetable object from backend (must include schedule[]).
 * @returns {{schedule: Object, days: string[], timeSlots: string[]}}
 */
export const prepareTimetableForPDF = (timetable) => {
  if (!timetable || !Array.isArray(timetable.schedule)) {
    console.warn('prepareTimetableForPDF: Invalid timetable structure', timetable);
    return { schedule: {}, days: [], timeSlots: [] };
  }

  // Extract all unique days and time slots
  const days = [...new Set(timetable.schedule.map(slot => slot.day))].filter(Boolean);
  const timeSlots = [...new Set(timetable.schedule.map(slot => slot.timeSlot))].filter(Boolean);

  // Build base grid
  const schedule = {};
  days.forEach(day => {
    schedule[day] = {};
    timeSlots.forEach(slot => {
      schedule[day][slot] = {};
    });
  });

  // Fill actual data
  timetable.schedule.forEach(slot => {
    if (!slot.day || !slot.timeSlot) return;
    schedule[slot.day][slot.timeSlot] = {
  subject: {
    name: slot.subject?.name || slot.subject || '',
    acronym: slot.subject?.acronym || '',
    code: slot.subject?.code || '',
  },
  teacher:
    typeof slot.teacher === 'object'
      ? slot.teacher.name || slot.teacher.username || ''
      : slot.teacher || '',
  type: slot.type || 'lecture',
  room: slot.room || ''
};


  });

  return { schedule, days, timeSlots };
};
