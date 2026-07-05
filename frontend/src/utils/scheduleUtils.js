// frontend/src/utils/scheduleUtils.js

export const createEmptySchedule = (daysArr, slotsArr) => {
  const empty = {};
  daysArr.forEach(d => {
    empty[d] = {};
    slotsArr.forEach(s => {
      empty[d][s] = {
        subject: '',
        teacher: '',
        type: 'lecture',
        room: ''
      };
    });
  });
  return empty;
};

export const normalizeSchedule = (actualData, defaultDays, defaultTimeSlots) => {
  let schedule = actualData?.schedule || actualData?.timetable || {};

  if (Array.isArray(schedule)) {
    const convertedSchedule = {};
    const inferredDays = [];
    const inferredSlots = [];
    schedule.forEach(slot => {
      if (slot.day && slot.timeSlot) {
        inferredDays.push(slot.day);
        inferredSlots.push(slot.timeSlot);
      }
    });
    const uniqDays = [...new Set(inferredDays)].filter(Boolean);
    const uniqSlots = [...new Set(inferredSlots)].filter(Boolean);

    const baseDays = uniqDays.length ? uniqDays : defaultDays;
    const baseSlots = uniqSlots.length ? uniqSlots : defaultTimeSlots;

    baseDays.forEach(d => {
      convertedSchedule[d] = {};
      baseSlots.forEach(s => {
        convertedSchedule[d][s] = {
          subject: '',
          teacher: '',
          type: 'lecture',
          room: ''
        };
      });
    });

    schedule.forEach(slot => {
      if (slot.day && slot.timeSlot) {
        convertedSchedule[slot.day] = convertedSchedule[slot.day] || {};
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
        };
      }
    });

    return {
      days: baseDays,
      timeSlots: baseSlots,
      scheduleData: convertedSchedule
    };
  }

  // object format
  if (schedule && Object.keys(schedule).length > 0) {
    const existingDays = Object.keys(schedule);
    const existingTimeSlots = existingDays.length > 0 ? Object.keys(schedule[existingDays[0]] || {}) : defaultTimeSlots;
    return {
      days: existingDays.length > 0 ? existingDays : defaultDays,
      timeSlots: existingTimeSlots.length > 0 ? existingTimeSlots : defaultTimeSlots,
      scheduleData: schedule
    };
  }

  return {
    days: defaultDays,
    timeSlots: defaultTimeSlots,
    scheduleData: createEmptySchedule(defaultDays, defaultTimeSlots)
  };
};
