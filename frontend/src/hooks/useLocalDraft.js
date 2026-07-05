// frontend/src/hooks/useLocalDraft.js
import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const useLocalDraft = (timetableData, data, mode, isEditable) => {
  const getLocalStorageKey = useCallback(() => {
    const actualData = timetableData || data;
    if (actualData && actualData.branch && actualData.year && actualData.section) {
      return `timetable_draft_${actualData.branch}_${actualData.year}_${actualData.section}`;
    }
    return null;
  }, [timetableData, data]);

  const saveToLocalStorage = useCallback((scheduleDataArg, timeSlotsArg, daysArg, timetableInfoArg) => {
    const key = getLocalStorageKey();
    if (key && (mode === 'edit' || isEditable)) {
      try {
        const dataToSave = {
          scheduleData: scheduleDataArg,
          timeSlots: timeSlotsArg,
          days: daysArg,
          timetableInfo: timetableInfoArg,
          lastModified: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(dataToSave));
        console.log('Timetable data saved to localStorage:', key);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
      }
    }
  }, [getLocalStorageKey, mode, isEditable]);

  const loadFromLocalStorage = useCallback(() => {
    const key = getLocalStorageKey();
    if (key && (mode === 'edit' || isEditable)) {
      try {
        const savedData = localStorage.getItem(key);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          console.log('Loaded timetable data from localStorage:', key, parsedData);
          return parsedData;
        }
      } catch (error) {
        console.error('Failed to load from localStorage:', error);
      }
    }
    return null;
  }, [getLocalStorageKey, mode, isEditable]);

  const clearLocalTimetableData = useCallback(() => {
    const key = getLocalStorageKey();
    if (key) {
      try {
        localStorage.removeItem(key);
        console.log('Cleared localStorage for:', key);
        toast.success('Timetable data cleared from local storage');
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }
    }
  }, [getLocalStorageKey]);

  return {
    getLocalStorageKey,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalTimetableData
  };
};
