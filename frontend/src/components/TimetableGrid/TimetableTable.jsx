// frontend/src/components/TimetableGrid/TimetableTable.jsx
import React from 'react';
import { TableHeader } from './TableHeader';
import { TableRow } from './TableRow';

export const TimetableTable = ({
  days,
  timeSlots,
  isEditable,
  mode,
  removeDay,
  setEditingTimeSlot,
  removeTimeSlot,
  scheduleData,
  handleCellClick,
  handleClearCell
}) => {
  return (
    <div className="min-w-max border border-gray-300 bg-white rounded overflow-hidden">
      <table className="w-full border-collapse">
        <TableHeader
          days={days}
          isEditable={isEditable}
          mode={mode}
          removeDay={removeDay}
        />
        <tbody>
          {timeSlots.map((timeSlot, rowIndex) => (
            <TableRow
              key={timeSlot}
              timeSlot={timeSlot}
              rowIndex={rowIndex}
              days={days}
              isEditable={isEditable}
              mode={mode}
              timeSlotsLength={timeSlots.length}
              setEditingTimeSlot={setEditingTimeSlot}
              removeTimeSlot={removeTimeSlot}
              scheduleData={scheduleData}
              handleCellClick={handleCellClick}
              handleClearCell={handleClearCell}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
