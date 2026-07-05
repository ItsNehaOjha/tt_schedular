// frontend/src/components/TimetableGrid/TimeSlotEditModal.jsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { convertTo24Hour, convertTo12Hour } from '../../utils/timeUtils';

export const TimeSlotEditModal = ({ isOpen, onClose, onSave, initialTimeSlot, index }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [autoAdjust, setAutoAdjust] = useState(true);

  useEffect(() => {
    if (initialTimeSlot) {
      const [start, end] = initialTimeSlot.split('-');
      setStartTime(convertTo24Hour(start.trim()));
      setEndTime(convertTo24Hour(end.trim()));
    }
  }, [initialTimeSlot]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (startTime && endTime) {
      const formattedStart = convertTo12Hour(startTime);
      const formattedEnd = convertTo12Hour(endTime);
      const newTimeSlot = `${formattedStart}-${formattedEnd}`;
      onSave(index, newTimeSlot, autoAdjust);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-150 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Edit Time Slot #{index + 1}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-650 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-650 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-650 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 py-1">
            <input
              type="checkbox"
              id="autoAdjust"
              checked={autoAdjust}
              onChange={(e) => setAutoAdjust(e.target.checked)}
              className="rounded border-gray-300 text-blue-650 focus:ring-blue-550 w-3.5 h-3.5"
            />
            <label htmlFor="autoAdjust" className="text-xs text-gray-600 font-medium select-none">
              Auto-adjust subsequent time slots (preserve duration gap)
            </label>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-600 border border-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-750 transition"
            >
              Save Time Slot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
