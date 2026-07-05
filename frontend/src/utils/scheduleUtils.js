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

  let baseDays = defaultDays;
  let baseSlots = defaultTimeSlots;

  if (actualData?.metadata?.weekDays && Array.isArray(actualData.metadata.weekDays) && actualData.metadata.weekDays.length) {
    baseDays = actualData.metadata.weekDays;
  } else if (Array.isArray(schedule)) {
    const inferredDays = [...new Set(schedule.map(s => s.day))].filter(Boolean);
    if (inferredDays.length) {
      // Keep order of defaultDays if possible
      baseDays = defaultDays.filter(d => inferredDays.includes(d));
      // Add any custom days not in defaultDays
      const customDays = inferredDays.filter(d => !defaultDays.includes(d));
      baseDays = [...baseDays, ...customDays];
    }
  }

  if (actualData?.metadata?.timeSlots && Array.isArray(actualData.metadata.timeSlots) && actualData.metadata.timeSlots.length) {
    baseSlots = actualData.metadata.timeSlots;
  } else if (Array.isArray(schedule)) {
    const inferredSlots = [...new Set(schedule.map(s => s.timeSlot))].filter(Boolean);
    if (inferredSlots.length) baseSlots = inferredSlots;
  }

  const convertedSchedule = {};
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

  if (Array.isArray(schedule)) {
    schedule.forEach(slot => {
      if (slot.day && slot.timeSlot) {
        convertedSchedule[slot.day] = convertedSchedule[slot.day] || {};
        
        if (slot.type === 'split-lab') {
          const session = {
            batch: slot.batch || 'B1',
            subject: slot.subject?.name || slot.subject?.acronym || '',
            code: slot.subject?.code || '',
            teacher: slot.teacher?.name || '',
            teacherId: slot.teacher?.id || null,
            room: slot.room || ''
          };

          const existing = convertedSchedule[slot.day][slot.timeSlot];
          if (existing && existing.type === 'split-lab') {
            existing.parallelSessions = existing.parallelSessions || [];
            if (!existing.parallelSessions.some(s => s.batch === session.batch)) {
              existing.parallelSessions.push(session);
            }
          } else {
            convertedSchedule[slot.day][slot.timeSlot] = {
              type: 'split-lab',
              subject: slot.subject?.name || slot.subject?.acronym || '',
              parallelSessions: [session],
              isLabSession: true,
              requiresMultipleSlots: true
            };
          }
        } else {
          convertedSchedule[slot.day][slot.timeSlot] = {
            subject: slot.subject?.acronym || slot.subject?.name || '',
            teacher: slot.teacher?.name || '',
            teacherId: slot.teacher?.id || null,
            isLabSession: slot.type === 'lab',
            requiresMultipleSlots: slot.type === 'lab',
            isContinuation: slot.subject?.acronym?.includes('(Cont.)') || slot.subject?.name?.includes('(Cont.)') || false,
            type: slot.type || 'lecture',
            room: slot.room || '',
            code: slot.subject?.code || '',
            name: slot.subject?.name || ''
          };
        }
      }
    });
  } else if (schedule && Object.keys(schedule).length > 0) {
    // object format fallback
    Object.assign(convertedSchedule, schedule);
  }

  return {
    days: baseDays,
    timeSlots: baseSlots,
    scheduleData: convertedSchedule
  };
};
