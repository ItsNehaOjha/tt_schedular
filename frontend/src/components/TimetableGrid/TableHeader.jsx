// frontend/src/components/TimetableGrid/TableHeader.jsx
import React from 'react';
import { X } from 'lucide-react';

export const TableHeader = ({
  days,
  isEditable,
  mode,
  removeDay
}) => {
  const canEdit = isEditable || mode === 'edit' || mode === 'create';

  return (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-300">
        <th className="border-r border-gray-300 p-2 text-xs font-bold text-gray-500 text-center w-[110px]">Time / Day</th>
        {days.map(day => (
          <th key={day} className="border-r border-gray-300 p-2 text-xs font-bold text-gray-700 text-center relative group min-w-[130px] select-none">
            <div className="flex items-center justify-center space-x-1">
              <span>{day}</span>
              {canEdit && days.length > 1 && (
                <button
                  onClick={() => removeDay(day)}
                  className="absolute top-1.5 right-1.5 p-0.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Remove ${day}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
};
