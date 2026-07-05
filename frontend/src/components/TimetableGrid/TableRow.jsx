// frontend/src/components/TimetableGrid/TableRow.jsx
import React from 'react';
import { TimeSlotCell } from './TimeSlotCell';
import { TimetableCell } from './TimetableCell';

export const TableRow = ({
  timeSlot,
  rowIndex,
  days,
  isEditable,
  mode,
  timeSlotsLength,
  setEditingTimeSlot,
  removeTimeSlot,
  scheduleData,
  handleCellClick,
  handleClearCell
}) => {
  return (
    <tr className="border-b border-gray-300">
      <TimeSlotCell
        timeSlot={timeSlot}
        rowIndex={rowIndex}
        isEditable={isEditable}
        mode={mode}
        timeSlotsLength={timeSlotsLength}
        setEditingTimeSlot={setEditingTimeSlot}
        removeTimeSlot={removeTimeSlot}
      />
      {days.map(day => (
        <TimetableCell
          key={`${day}-${timeSlot}`}
          day={day}
          timeSlot={timeSlot}
          scheduleData={scheduleData}
          isEditable={isEditable}
          mode={mode}
          handleCellClick={handleCellClick}
          handleClearCell={handleClearCell}
        />
      ))}
    </tr>
  );
};
