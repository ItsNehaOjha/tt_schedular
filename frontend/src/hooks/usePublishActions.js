// frontend/src/hooks/usePublishActions.js
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { validateTimetable, validateTimetableData, isSpecialEntry } from '../utils/validationUtils';

export const usePublishActions = ({
  timetableInfo,
  days,
  timeSlots,
  scheduleData,
  timetableData,
  data,
  onSave,
  onPublish,
  coordinatorName,
  clearLocalTimetableData
}) => {
  const getValidation = useCallback(() => {
    return validateTimetable(timetableInfo, data, timetableData);
  }, [timetableInfo, data, timetableData]);

  const handleSave = useCallback(() => {
    const errors = validateTimetableData(days, timeSlots, scheduleData);
    if (errors.length > 0) {
      toast.error(`Please fix the following errors:\n${errors.slice(0, 3).join('\n')}${errors.length > 3 ? '\n...' : ''}`);
      return;
    }

    const scheduleArray = [];
    days.forEach(day => {
      timeSlots.forEach(timeSlot => {
        const cellData = scheduleData[day]?.[timeSlot];
        if (cellData && (cellData.subject || cellData.teacher || isSpecialEntry(cellData.subject, cellData.type))) {
          const subjectData = { acronym: cellData.subject || '', code: cellData.code || '', name: cellData.name || cellData.subject || '' };
          const teacherData = isSpecialEntry(cellData.subject, cellData.type)
              ? { id: null, name: '' }
              : { id: cellData.teacherId || null, name: cellData.teacher || '' };
          scheduleArray.push({ day, timeSlot, subject: subjectData, teacher: teacherData, type: cellData.type || 'lecture', room: cellData.room || '' });
        }
      });
    });

    if (scheduleArray.length === 0) {
      toast.error('Please add at least one timetable entry before saving.');
      return;
    }

    const timetableToSave = {
      year: timetableInfo.year,
      branch: timetableInfo.branch,
      section: timetableInfo.section,
      semester: timetableInfo.semester,
      academicYear: timetableInfo.academicYear,
      schedule: scheduleArray
    };

    if (onSave) {
      const originalOnSave = onSave;
      const enhancedOnSave = (dataArg) => {
        const result = originalOnSave(dataArg);
        if (result && typeof result.then === 'function') {
          result.then(() => clearLocalTimetableData()).catch(() => console.log('Save failed, keeping localStorage data'));
        } else if (result && typeof result === 'object') {
          clearLocalTimetableData();
        }
        return result;
      };
      return enhancedOnSave(timetableToSave);
    }
  }, [days, timeSlots, scheduleData, timetableInfo, onSave, clearLocalTimetableData]);

  const handlePublish = useCallback(async () => {
    const validation = getValidation();
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(', ');
      toast.error(`Cannot publish timetable: ${errorMessage}`);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to publish timetables');
      return;
    }

    try {
      const scheduleArray = [];
      days.forEach(day => {
        timeSlots.forEach(timeSlot => {
          const cellData = scheduleData[day]?.[timeSlot];
          if (cellData && (cellData.subject || cellData.teacher || isSpecialEntry(cellData.subject, cellData.type))) {
            const subjectData = { acronym: cellData.subject || '', code: cellData.code || '', name: cellData.name || cellData.subject || '' };
            const teacherData = isSpecialEntry(cellData.subject, cellData.type)
                ? { id: null, name: '' }
                : { id: cellData.teacherId || null, name: cellData.teacher || '' };
            scheduleArray.push({ day, timeSlot, subject: subjectData, teacher: teacherData, type: cellData.type || 'lecture', room: cellData.room || '' });
          }
        });
      });

      if (onPublish) {
        await onPublish({
          ...timetableInfo,
          schedule: scheduleArray,
          isPublished: true,
          publishedAt: new Date().toISOString(),
          coordinatorName: coordinatorName || 'Coordinator'
        });
        clearLocalTimetableData();
      }
    } catch (error) {
      console.error('Error publishing timetable:', error);
      toast.error('Failed to publish timetable');
    }
  }, [days, timeSlots, scheduleData, timetableInfo, onPublish, coordinatorName, clearLocalTimetableData, getValidation]);

  const handleExportPDF = useCallback(() => {
    import('../utils/pdfExport').then(({ exportToPDF }) => {
      const coordinatorNameForPDF = (timetableData?.coordinatorName && timetableData.coordinatorName.trim()) 
        ? timetableData.coordinatorName 
        : (coordinatorName || 'Coordinator');
      
      const timetableDataForPDF = {
        year: timetableInfo.year || timetableData?.year || 'Unknown Year',
        branch: timetableInfo.branch || timetableData?.branch || 'Unknown Branch',
        section: timetableInfo.section || timetableData?.section || 'Unknown Section',
        schedule: scheduleData,
        timeSlots: timeSlots,
        days: days,
        semester: timetableInfo.semester || timetableData?.semester || '',
        academicYear: timetableInfo.academicYear || timetableData?.academicYear || new Date().getFullYear(),
        coordinatorName: coordinatorNameForPDF
      };
      try {
        exportToPDF(timetableDataForPDF);
        toast.success('PDF generated successfully!');
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast.error('Failed to generate PDF. Please try again.');
      }
    }).catch(error => {
      console.error('Error loading PDF export:', error);
      toast.error('Failed to load PDF generator. Please try again.');
    });
  }, [days, timeSlots, scheduleData, timetableInfo, timetableData, coordinatorName]);

  return {
    handleSave,
    handlePublish,
    handleExportPDF,
    getValidation
  };
};
