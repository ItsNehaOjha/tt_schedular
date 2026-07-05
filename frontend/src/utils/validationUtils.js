// frontend/src/utils/validationUtils.js

export const isSpecialEntry = (subject, type) => {
  const specialEntries = ['lunch', 'break', 'library', 'mini project', 'mentor'];
  const subjectLower = (subject || '').toLowerCase();
  const typeLower = (type || '').toLowerCase();
  return specialEntries.some(entry => subjectLower.includes(entry) || typeLower.includes(entry));
};

export const validateTimetableData = (days, timeSlots, scheduleData) => {
  const errors = [];
  days.forEach(day => {
    timeSlots.forEach(slot => {
      const cellData = scheduleData[day]?.[slot];
      if (cellData && (cellData.subject || cellData.teacher)) {
        if (!isSpecialEntry(cellData.subject, cellData.type)) {
          if (!cellData.subject) errors.push(`Missing subject for ${day} ${slot}`);
        }
      }
    });
  });
  return errors;
};

export const validateTimetable = (timetableInfo, data, timetableData) => {
  const actualData = timetableData || data;
  let year = timetableInfo.year || actualData?.year || '';
  let branch = timetableInfo.branch || actualData?.branch || '';
  let section = timetableInfo.section || actualData?.section || '';

  if (!year || !branch || !section) {
    const urlParams = new URLSearchParams(window.location.search);
    year = year || urlParams.get('year') || '';
    branch = branch || urlParams.get('branch') || '';
    section = section || urlParams.get('section') || '';
    
    // Attempt DOM/page title fallback detection if missing
    if (typeof document !== 'undefined') {
      const pageTitle = document.title;
      const headerText = document.querySelector('h2')?.textContent || '';
      if (!year && (pageTitle.includes('3rd Year') || headerText.includes('3rd Year'))) year = '3rd Year';
      if (!branch && (pageTitle.toUpperCase().includes('CSE') || headerText.toUpperCase().includes('CSE'))) branch = 'CSE';
      if (!section && (pageTitle.includes(' A') || headerText.includes(' A'))) section = 'A';
    }
  }

  const errors = [];
  if (!year || year.trim() === '') errors.push('Year is required');
  if (!branch || branch.trim() === '') errors.push('Branch is required');
  if (!section || section.trim() === '') errors.push('Section is required');

  return { isValid: errors.length === 0, errors, year, branch, section };
};
