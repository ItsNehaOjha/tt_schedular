// frontend/src/components/TimetableGrid/Toolbar.jsx
import React from 'react';
import { Plus, RotateCcw } from 'lucide-react';

export const Toolbar = ({
  isEditable,
  mode,
  addTimeSlot,
  addDay,
  deletedTimeSlots,
  restoreTimeSlot,
  days,
  timeSlots
}) => {
  const canEdit = isEditable || mode === 'edit' || mode === 'create';
  if (!canEdit) return null;

  return (
    <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs select-none">
      <div className="flex items-center gap-2">
        <button
          onClick={addTimeSlot}
          className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-gray-700 font-semibold shadow-sm transition"
          title="Append a new time slot"
        >
          <Plus className="w-3.5 h-3.5 text-blue-500" />
          <span>Add Time Slot</span>
        </button>

        {days.length < 7 && (
          <button
            onClick={addDay}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 rounded text-gray-700 font-semibold shadow-sm transition"
            title="Append a new workday column"
          >
            <Plus className="w-3.5 h-3.5 text-green-500" />
            <span>Add Day</span>
          </button>
        )}

        {deletedTimeSlots.length > 0 && (
          <div className="flex items-center gap-1.5 border-l border-gray-250 pl-2">
            <span className="text-[10px] text-gray-500 font-medium">Restore:</span>
            <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto">
              {deletedTimeSlots.map((item) => (
                <button
                  key={item.timestamp}
                  onClick={() => restoreTimeSlot(item)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-[3px] text-[10px] font-semibold transition"
                  title={`Restore deleted time slot ${item.slot}`}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>{item.slot}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="text-gray-500 font-medium hidden sm:block">
        Grid Size: {days.length} Days × {timeSlots.length} Slots
      </div>
    </div>
  );
};
