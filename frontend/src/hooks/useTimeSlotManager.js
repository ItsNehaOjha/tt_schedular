// frontend/src/hooks/useTimeSlotManager.js
import { useCallback } from 'react';
import { parseTimeSlot, createTimeSlot } from '../utils/timeUtils';

export const useTimeSlotManager = (
  timeSlots,
  setTimeSlots,
  days,
  setDays,
  scheduleData,
  setScheduleData,
  deletedTimeSlots,
  setDeletedTimeSlots
) => {
  const adjustTimeSlots = useCallback((editedIndex, newTimeSlot) => {
    const newTimeSlots = [...timeSlots];
    newTimeSlots[editedIndex] = newTimeSlot;

    const editedSlot = parseTimeSlot(newTimeSlot);
    const newDuration = editedSlot.duration;

    for (let i = editedIndex + 1; i < newTimeSlots.length; i++) {
      const prevSlot = parseTimeSlot(newTimeSlots[i - 1]);
      const newStart = prevSlot.end;
      const newEnd = newStart + newDuration;
      newTimeSlots[i] = createTimeSlot(newStart, newEnd);
    }
    return newTimeSlots;
  }, [timeSlots]);

  const handleTimeSlotEdit = useCallback((index, newTimeSlot, autoAdjust = true) => {
    let adjustedSlots = [...timeSlots];
    adjustedSlots[index] = newTimeSlot;

    if (autoAdjust) adjustedSlots = adjustTimeSlots(index, newTimeSlot);

    setTimeSlots(adjustedSlots);

    const newSchedule = { ...scheduleData };
    const oldSlot = timeSlots[index];

    days.forEach(day => {
      if (newSchedule[day] && newSchedule[day][oldSlot]) {
        const cellData = newSchedule[day][oldSlot];
        delete newSchedule[day][oldSlot];
        newSchedule[day][newTimeSlot] = cellData;
      }
    });

    if (autoAdjust) {
      for (let i = index + 1; i < timeSlots.length; i++) {
        const oldSlotName = timeSlots[i];
        const newSlotName = adjustedSlots[i];
        if (oldSlotName !== newSlotName) {
          days.forEach(day => {
            if (newSchedule[day] && newSchedule[day][oldSlotName]) {
              const cellData = newSchedule[day][oldSlotName];
              delete newSchedule[day][oldSlotName];
              newSchedule[day][newSlotName] = cellData;
            }
          });
        }
      }
    }

    setScheduleData(newSchedule);
  }, [timeSlots, setTimeSlots, days, scheduleData, setScheduleData, adjustTimeSlots]);

  const addTimeSlot = useCallback(() => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const lastSlotParsed = parseTimeSlot(lastSlot);
    const newStart = lastSlotParsed.end;
    const newEnd = newStart + 50; // 50 minutes duration
    const newSlot = createTimeSlot(newStart, newEnd);
    const newTimeSlots = [...timeSlots, newSlot];
    setTimeSlots(newTimeSlots);
    const newSchedule = { ...scheduleData };
    days.forEach(day => {
      if (!newSchedule[day]) newSchedule[day] = {};
      newSchedule[day][newSlot] = { subject: '', teacher: '', type: 'lecture', room: '' };
    });
    setScheduleData(newSchedule);
  }, [timeSlots, setTimeSlots, days, scheduleData, setScheduleData]);

  const removeTimeSlot = useCallback((slotToRemove) => {
    if (timeSlots.length <= 1) return;
    const deletedSlotData = { slot: slotToRemove, data: {}, timestamp: Date.now() };
    days.forEach(day => {
      if (scheduleData[day] && scheduleData[day][slotToRemove]) {
        deletedSlotData.data[day] = scheduleData[day][slotToRemove];
      }
    });
    setDeletedTimeSlots(prev => [...prev, deletedSlotData]);
    const removedIndex = timeSlots.indexOf(slotToRemove);
    const newTimeSlots = timeSlots.filter(slot => slot !== slotToRemove);

    if (removedIndex < newTimeSlots.length) {
      let adjustStartTime;
      if (removedIndex > 0) {
        const prevSlot = parseTimeSlot(newTimeSlots[removedIndex - 1]);
        adjustStartTime = prevSlot.end;
      } else {
        const removedSlot = parseTimeSlot(slotToRemove);
        adjustStartTime = removedSlot.start;
      }

      for (let i = removedIndex; i < newTimeSlots.length; i++) {
        const currentSlot = parseTimeSlot(newTimeSlots[i]);
        const newEnd = adjustStartTime + currentSlot.duration;
        const adjustedSlot = createTimeSlot(adjustStartTime, newEnd);
        const oldSlotName = newTimeSlots[i];
        newTimeSlots[i] = adjustedSlot;

        const newSchedule = { ...scheduleData };
        days.forEach(day => {
          if (newSchedule[day] && newSchedule[day][oldSlotName]) {
            const cellData = newSchedule[day][oldSlotName];
            delete newSchedule[day][oldSlotName];
            newSchedule[day][adjustedSlot] = cellData;
          }
        });
        setScheduleData(newSchedule);
        adjustStartTime = newEnd;
      }
    }

    setTimeSlots(newTimeSlots);
    const newSchedule = { ...scheduleData };
    days.forEach(day => {
      if (newSchedule[day]) {
        delete newSchedule[day][slotToRemove];
      }
    });
    setScheduleData(newSchedule);
  }, [timeSlots, setTimeSlots, days, scheduleData, setScheduleData, setDeletedTimeSlots]);

  const restoreTimeSlot = useCallback((deletedSlotData) => {
    const { slot, data } = deletedSlotData;
    const slotTime = parseTimeSlot(slot);
    let insertIndex = timeSlots.length;
    for (let i = 0; i < timeSlots.length; i++) {
      const currentSlotTime = parseTimeSlot(timeSlots[i]);
      if (slotTime.start < currentSlotTime.start) {
        insertIndex = i;
        break;
      }
    }

    const newTimeSlots = [...timeSlots];
    newTimeSlots.splice(insertIndex, 0, slot);
    setTimeSlots(newTimeSlots);

    const newSchedule = { ...scheduleData };
    days.forEach(day => {
      if (!newSchedule[day]) newSchedule[day] = {};
      newSchedule[day][slot] = data[day] || { subject: '', teacher: '', type: 'lecture', room: '' };
    });
    setScheduleData(newSchedule);
    setDeletedTimeSlots(prev => prev.filter(item => item.timestamp !== deletedSlotData.timestamp));
  }, [timeSlots, setTimeSlots, days, scheduleData, setScheduleData, setDeletedTimeSlots]);

  const addDay = useCallback(() => {
    const orderedDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const availableDays = orderedDayNames.filter(day => !days.includes(day));
    if (availableDays.length === 0) return;
    
    const newDay = availableDays[0];
    const unsortedDays = [...days, newDay];
    const newDays = unsortedDays.sort((a, b) => {
      return orderedDayNames.indexOf(a) - orderedDayNames.indexOf(b);
    });
    
    setDays(newDays);
    const newSchedule = { ...scheduleData };
    newSchedule[newDay] = {};
    timeSlots.forEach(slot => newSchedule[newDay][slot] = { subject: '', teacher: '', type: 'lecture', room: '' });
    setScheduleData(newSchedule);
  }, [days, setDays, timeSlots, scheduleData, setScheduleData]);

  const removeDay = useCallback((dayToRemove) => {
    if (days.length <= 1) return;
    const newDays = days.filter(day => day !== dayToRemove);
    setDays(newDays);
    const newSchedule = { ...scheduleData };
    delete newSchedule[dayToRemove];
    setScheduleData(newSchedule);
  }, [days, setDays, scheduleData, setScheduleData]);

  return {
    adjustTimeSlots,
    handleTimeSlotEdit,
    addTimeSlot,
    removeTimeSlot,
    restoreTimeSlot,
    addDay,
    removeDay
  };
};
