// frontend/src/components/TimetableGrid/TimeSlotCell.jsx
import React from 'react';
import { Edit, Minus } from 'lucide-react';

export const TimeSlotCell = ({
  timeSlot,
  rowIndex,
  isEditable,
  mode,
  timeSlotsLength,
  setEditingTimeSlot,
  removeTimeSlot
}) => {
  const canEdit = isEditable || mode === 'edit' || mode === 'create';

  return (
    <td className="border-r border-gray-300 p-2 text-[10px] font-bold text-gray-500 text-center w-[110px] bg-gray-50 relative group select-none">
      <div className="flex flex-col justify-center items-center h-full">
        <span>{timeSlot}</span>
        {canEdit && (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingTimeSlot({ index: rowIndex, timeSlot })}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit time slot"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            {timeSlotsLength > 1 && (
              <button
                onClick={() => removeTimeSlot(timeSlot)}
                className="p-1 text-red-650 hover:bg-red-50 rounded"
                title="Delete time slot"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </td>
  );
};
