// frontend/src/utils/cellUtils.js

export const getCellContent = (day, timeSlot, scheduleData) => {
  const cellData = scheduleData[day]?.[timeSlot];
  if (!cellData || (!cellData.subject && !cellData.teacher && !cellData.parallelSessions)) {
    return { isEmpty: true };
  }
  
  if (cellData.type === 'split-lab') {
    return {
      isEmpty: false,
      type: 'split-lab',
      subject: cellData.subject || '',
      teacher: cellData.teacher || '',
      code: cellData.code || '',
      room: cellData.room || '',
      batch: cellData.batch || '',
      sameGroup: true
    };
  }

  if (cellData.type === 'lab' && cellData.isMerged) {
    return { 
      isEmpty: false, 
      subject: cellData.subject || '', 
      teacher: cellData.teacher || '', 
      type: cellData.type || 'lab', 
      room: cellData.room || '', 
      code: cellData.code || '', 
      isMerged: true,
      mergeRows: cellData.mergeRows || 2
    };
  }
  
  return { 
    isEmpty: false, 
    subject: cellData.subject || '', 
    teacher: cellData.teacher || '', 
    type: cellData.type || 'lecture', 
    room: cellData.room || '', 
    code: cellData.code || '', 
    duration: cellData.duration || 1, 
    isFirstSlot: cellData.isFirstSlot, 
    isContinuation: cellData.isContinuation, 
    isHidden: cellData.isHidden,
    isMerged: cellData.isMerged,
    mergeRows: cellData.mergeRows
  };
};

export const getCellStyling = (type, subject) => {
  const typeLower = (type || '').toLowerCase();
  const subjectLower = (subject || '').toLowerCase();
  if (typeLower === 'lab' || subjectLower.includes('lab')) return { bgColor: 'bg-blue-50 border-blue-200 text-blue-800' };
  if (typeLower === 'lunch' || subjectLower.includes('lunch')) return { bgColor: 'bg-orange-50 border-orange-200 text-orange-800' };
  if (typeLower === 'break' || subjectLower.includes('break')) return { bgColor: 'bg-gray-50 border-gray-200 text-gray-600' };
  if (typeLower === 'library' || subjectLower.includes('library')) return { bgColor: 'bg-green-50 border-green-200 text-green-800' };
  if (typeLower === 'mini project' || subjectLower.includes('mini project')) return { bgColor: 'bg-purple-50 border-purple-200 text-purple-800' };
  if (typeLower === 'mentor' || subjectLower.includes('mentor')) return { bgColor: 'bg-yellow-50 border-yellow-200 text-yellow-800' };
  if (typeLower === 'split-lab' || subjectLower.includes('split-lab')) return { bgColor: 'bg-violet-50 border-violet-200 text-violet-800' };

  return { bgColor: 'bg-white border-gray-200 text-gray-800' };
};
