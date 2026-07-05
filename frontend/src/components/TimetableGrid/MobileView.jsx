// frontend/src/components/TimetableGrid/MobileView.jsx
import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { getCellContent, getCellStyling } from '../../utils/cellUtils';

export const MobileView = ({
  days,
  timeSlots,
  isEditable,
  mode,
  removeDay,
  scheduleData,
  handleCellClick,
  handleClearCell
}) => {
  const canEdit = isEditable || mode === 'edit' || mode === 'create';

  return (
    <div className="md:hidden space-y-4 p-4">
      {days.map(day => (
        <div key={day} className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="bg-gray-100 px-4 py-3 rounded-t-lg flex items-center justify-between border-b border-gray-200 select-none">
            <h3 className="font-semibold text-gray-900 text-xs">{day}</h3>
            {canEdit && days.length > 1 && (
              <button
                onClick={() => removeDay(day)}
                className="p-1 text-red-500 hover:bg-red-100 rounded transition"
                title={`Remove ${day}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-200">
            {timeSlots.map((timeSlot) => {
              const cellContent = getCellContent(day, timeSlot, scheduleData);
              const cellStyling = getCellStyling(cellContent.type, cellContent.subject);
              
              if (cellContent.isHidden) return null;

              return (
                <div
                  key={timeSlot}
                  className={`p-3 ${cellStyling.bgColor} ${
                    canEdit ? 'cursor-pointer hover:bg-gray-50' : ''
                  } relative group transition`}
                  onClick={() => canEdit && handleCellClick(day, timeSlot)}
                >
                  <div className="flex items-center justify-between mb-2 select-none">
                    <span className="text-xs font-medium text-gray-600">{timeSlot}</span>
                    {!cellContent.isEmpty && canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearCell(day, timeSlot);
                        }}
                        className="p-1 rounded hover:bg-red-100 text-red-500 border border-gray-200 bg-white shadow-sm"
                        title="Clear this cell"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="text-center">
                    {cellContent.isEmpty ? (
                      <div className="text-[10px] text-gray-400 py-1 font-semibold select-none">+ Add lecture</div>
                    ) : (
                      <div className="p-2 h-full flex flex-col justify-center items-center">
                        {['lunch', 'break', 'library', 'mini project', 'mentor'].includes(cellContent.type) ? (
                          <span className="font-bold text-center text-gray-800 text-[10px] uppercase">
                            {cellContent.subject || cellContent.type.toUpperCase()}
                          </span>
                        ) : cellContent.type === 'split-lab' ? (
                          <div className="flex flex-col items-center">
                            <div className="font-semibold text-violet-850 text-[10px]">
                              {cellContent.batch ? `${cellContent.batch}: ${cellContent.subject}` : cellContent.subject}
                            </div>
                            <div className="text-[9px] text-gray-500">{cellContent.code}</div>
                            <div className="text-[9px] text-gray-655">{cellContent.teacher}</div>
                            {cellContent.room && <div className="text-[9px] text-gray-500">📍 {cellContent.room}</div>}
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-[10px] text-gray-900 truncate max-w-[200px]">
                              {cellContent.subject}
                            </div>
                            {cellContent.code && (
                              <div className="text-[9px] text-gray-500 truncate max-w-[200px]">{cellContent.code}</div>
                            )}
                            {cellContent.teacher && (
                              <div className="text-[9px] text-gray-655 truncate max-w-[200px]">{cellContent.teacher}</div>
                            )}
                            {cellContent.room && (
                              <div className="text-[9px] text-gray-500 truncate max-w-[200px]">📍 {cellContent.room}</div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
