// frontend/src/hooks/useTimetableState.js
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { defaultDays, defaultTimeSlots } from '../constants/timetableConstants';
import { createEmptySchedule, normalizeSchedule } from '../utils/scheduleUtils';
import { useLocalDraft } from './useLocalDraft';
import { useTimeSlotManager } from './useTimeSlotManager';
import { usePublishActions } from './usePublishActions';

export const useTimetableState = ({
  onBack,
  onSave,
  onPublish,
  data,
  timetableData,
  mode,
  isEditable,
  coordinatorName
}) => {
  // State management
  const [editingCell, setEditingCell] = useState(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);
  const [timeSlots, setTimeSlots] = useState(defaultTimeSlots);
  const [days, setDays] = useState(defaultDays);
  const [deletedTimeSlots, setDeletedTimeSlots] = useState([]);
  const [timetableInfo, setTimetableInfo] = useState({
    year: '',
    branch: '',
    section: '',
    semester: '',
    academicYear: ''
  });
  const [scheduleData, setScheduleData] = useState(() => createEmptySchedule(defaultDays, defaultTimeSlots));
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize draft hook
  const {
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalTimetableData
  } = useLocalDraft(timetableData, data, mode, isEditable);

  // Initialize slot manager hook
  const slotManager = useTimeSlotManager(
    timeSlots,
    setTimeSlots,
    days,
    setDays,
    scheduleData,
    setScheduleData,
    deletedTimeSlots,
    setDeletedTimeSlots
  );

  // Initialize publish actions hook
  const publishActions = usePublishActions({
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
  });

  // Mount initialization effect
  useEffect(() => {
    const actualData = timetableData || data;
    const saved = loadFromLocalStorage();

    if (saved && (mode === 'edit' || isEditable)) {
      setTimeSlots(saved.timeSlots || defaultTimeSlots);
      setDays(saved.days || defaultDays);
      setTimetableInfo(saved.timetableInfo || {
        year: actualData?.year || '',
        branch: actualData?.branch || '',
        section: actualData?.section || '',
        semester: actualData?.semester || '',
        academicYear: actualData?.academicYear || ''
      });
      setScheduleData(saved.scheduleData || createEmptySchedule(saved.days || defaultDays, saved.timeSlots || defaultTimeSlots));
      console.log('Restored unsaved changes from local storage');
      setIsInitialized(true);
      return;
    }

    if (actualData) {
      setTimetableInfo({
        year: actualData.year || '',
        branch: actualData.branch || '',
        section: actualData.section || '',
        semester: actualData.semester || '',
        academicYear: actualData.academicYear || ''
      });

      const normalized = normalizeSchedule(actualData, defaultDays, defaultTimeSlots);
      setDays(normalized.days);
      setTimeSlots(normalized.timeSlots);
      setScheduleData(normalized.scheduleData);
      setIsInitialized(true);
      return;
    }

    setDays(defaultDays);
    setTimeSlots(defaultTimeSlots);
    setScheduleData(createEmptySchedule(defaultDays, defaultTimeSlots));
    setIsInitialized(true);
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (isInitialized && (mode === 'edit' || isEditable)) {
      saveToLocalStorage(scheduleData, timeSlots, days, timetableInfo);
    }
  }, [scheduleData, timeSlots, days, timetableInfo, isInitialized, saveToLocalStorage, mode, isEditable]);

  // Click handler
  const handleCellClick = useCallback((day, timeSlot) => {
    if (isEditable || mode === 'edit' || mode === 'create') {
      const cellData = scheduleData[day]?.[timeSlot] || {
        subject: '',
        teacher: '',
        type: 'lecture',
        room: ''
      };
      setEditingCell({ day, timeSlot, data: cellData });
    }
  }, [isEditable, mode, scheduleData]);

  // Cell clear handler
  const handleClearCell = useCallback((day, timeSlot) => {
    const newSchedule = { ...scheduleData };
    if (!newSchedule[day]) return;
    const currentCell = newSchedule[day][timeSlot];

    if (currentCell?.type === 'lab' || currentCell?.isLabSession) {
      const currentIndex = timeSlots.indexOf(timeSlot);
      const nextSlot = timeSlots[currentIndex + 1];
      if (nextSlot && newSchedule[day][nextSlot]?.isContinuation) {
        newSchedule[day][nextSlot] = { subject: '', teacher: '', type: 'lecture', room: '' };
      }
    }

    newSchedule[day][timeSlot] = { subject: '', teacher: '', type: 'lecture', room: '' };
    setScheduleData(newSchedule);
    toast.success('Cell cleared successfully');
  }, [scheduleData, timeSlots]);

  // Cell save handler
  const handleSaveCell = useCallback((cellData) => {
    const newSchedule = { ...scheduleData };
    if (!newSchedule[editingCell.day]) newSchedule[editingCell.day] = {};

    // 1. Lunch row fill
    if (cellData.fillEntireRow && cellData.type === 'lunch') {
      days.forEach(day => {
        if (!newSchedule[day]) newSchedule[day] = {};
        newSchedule[day][editingCell.timeSlot] = {
          subject: 'LUNCH',
          teacher: '',
          type: 'lunch',
          room: ''
        };
      });
      setScheduleData(newSchedule);
      setEditingCell(null);
      return;
    }

    // 2. Parallel split lab
    if (cellData.type === 'split-lab' && Array.isArray(cellData.parallelSessions)) {
      const currentSlotIndex = timeSlots.indexOf(editingCell.timeSlot);
      const nextSlotIndex = currentSlotIndex + 1;
      if (nextSlotIndex >= timeSlots.length) {
        toast.error("No next slot available for split lab");
        return;
      }

      const nextSlot = timeSlots[nextSlotIndex];
      const nextSlotData = newSchedule[editingCell.day][nextSlot];
      const isNextSlotEmpty = !nextSlotData || (!nextSlotData.subject && !nextSlotData.teacher);

      if (!isNextSlotEmpty) {
        toast.error("Next slot is not empty — cannot place split lab here");
        return;
      }

      const [batch1, batch2] = cellData.parallelSessions;

      newSchedule[editingCell.day][editingCell.timeSlot] = {
        ...batch1,
        type: "split-lab",
        batch: batch1.batch || "B1",
        color: "#ede9fe",
        sameGroup: true
      };

      newSchedule[editingCell.day][nextSlot] = {
        ...batch2,
        type: "split-lab",
        batch: batch2.batch || "B2",
        color: "#ede9fe",
        sameGroup: true
      };

      setScheduleData(newSchedule);
      setEditingCell(null);
      return;
    }

    // 3. Lab multi-slot merging
    if (cellData.isLabSession && cellData.requiresMultipleSlots && cellData.type !== 'split-lab') {
      const currentSlotIndex = timeSlots.indexOf(editingCell.timeSlot);
      const nextSlotIndex = currentSlotIndex + 1;
      if (nextSlotIndex < timeSlots.length) {
        const nextSlot = timeSlots[nextSlotIndex];
        const nextSlotData = newSchedule[editingCell.day][nextSlot];
        const isNextSlotEmpty = !nextSlotData || (!nextSlotData.subject && !nextSlotData.teacher);
        if (isNextSlotEmpty) {
          newSchedule[editingCell.day][editingCell.timeSlot] = {
            subject: cellData.subject,
            teacher: cellData.teacher,
            teacherId: cellData.teacherId || null,
            type: cellData.type,
            room: cellData.room,
            code: cellData.code,
            name: cellData.name,
          };
          newSchedule[editingCell.day][nextSlot] = {
            subject: `${cellData.subject} (Cont.)`,
            teacher: cellData.teacher,
            teacherId: cellData.teacherId || null,
            type: cellData.type,
            room: cellData.room,
            code: cellData.code,
            name: cellData.name,
            isContinuation: true,
          };

          setScheduleData(newSchedule);
          setEditingCell(null);
          return;
        } else {
          toast.error('Next time slot is not available for lab session');
          return;
        }
      } else {
        toast.error('Cannot schedule lab session - no next time slot available');
        return;
      }
    }

    // 4. Regular cell save
    const updatedCellData = {
      subject: cellData.subject || '',
      teacher: cellData.teacher || '',
      teacherId: cellData.teacherId || null,
      type: cellData.type || 'lecture',
      room: cellData.room || '',
      code: cellData.code || '',
      name: cellData.name || cellData.subject || ''
    };

    newSchedule[editingCell.day][editingCell.timeSlot] = updatedCellData;
    setScheduleData(newSchedule);
    setEditingCell(null);

    // Fallback sync semester/academicYear from prop payload
    const actualData = timetableData || data;
    if (actualData && (!timetableInfo.semester || !timetableInfo.academicYear)) {
      setTimetableInfo(prev => ({
        ...prev,
        year: actualData.year || prev.year,
        branch: actualData.branch || prev.branch,
        section: actualData.section || prev.section,
        semester: actualData.semester || prev.semester,
        academicYear: actualData.academicYear || prev.academicYear
      }));
    }
  }, [editingCell, scheduleData, timeSlots, days, timetableData, data, timetableInfo]);

  const handleResetDraft = useCallback(() => {
    clearLocalTimetableData();

    const newSchedule = {};
    days.forEach(d => {
      newSchedule[d] = {};
      timeSlots.forEach(s => {
        newSchedule[d][s] = { subject: '', teacher: '', type: 'lecture', room: '' };
      });
    });

    setScheduleData(newSchedule);
    setDeletedTimeSlots([]);
    toast.success('Draft reset successfully (all cell content cleared)');
  }, [days, timeSlots, clearLocalTimetableData]);

  return {
    editingCell,
    setEditingCell,
    editingTimeSlot,
    setEditingTimeSlot,
    timeSlots,
    setTimeSlots,
    days,
    setDays,
    deletedTimeSlots,
    setDeletedTimeSlots,
    timetableInfo,
    setTimetableInfo,
    scheduleData,
    setScheduleData,
    isInitialized,
    slotManager,
    publishActions,
    handleCellClick,
    handleClearCell,
    handleSaveCell,
    clearLocalTimetableData: handleResetDraft
  };
};
