// frontend/src/components/TimetableGrid/TimetableCell.jsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import { getCellContent, getCellStyling } from '../../utils/cellUtils';

export const TimetableCell = ({
  day,
  timeSlot,
  scheduleData,
  isEditable,
  mode,
  handleCellClick,
  handleClearCell
}) => {
  const canEdit = isEditable || mode === 'edit' || mode === 'create';
  const cellContent = getCellContent(day, timeSlot, scheduleData);
  const cellStyling = getCellStyling(cellContent.type, cellContent.subject);

  if (cellContent.isHidden) return null;

  return (
    <td
      className={`border-r border-gray-300 relative group transition-all duration-150 select-none ${cellStyling.bgColor} ${
        canEdit ? 'cursor-pointer hover:bg-opacity-80' : ''
      }`}
      rowSpan={cellContent.isMerged ? cellContent.mergeRows : 1}
      onClick={() => canEdit && handleCellClick(day, timeSlot)}
      style={
        cellContent.type === 'split-lab'
          ? { background: 'linear-gradient(135deg, #ede9fe 50%, #f5f3ff 50%)' }
          : {}
      }
    >
      <div className="min-h-[48px] flex flex-col justify-center items-center text-center p-0.5">
        {cellContent.isEmpty ? (
          canEdit && (
            <div className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
              + Add Lecture
            </div>
          )
        ) : (
          <div className="w-full flex flex-col justify-center items-center text-center relative py-0.5">
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearCell(day, timeSlot);
                }}
                className="absolute top-0 right-0 p-0.5 text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity border border-gray-200 bg-white"
                title="Clear cell content"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}

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
                <div className="font-medium text-[10px] text-gray-900 truncate max-w-[120px]">{cellContent.subject}</div>
                {cellContent.code && <div className="text-[9px] text-gray-500 truncate max-w-[120px]">{cellContent.code}</div>}
                {cellContent.teacher && <div className="text-[9px] text-gray-655 truncate max-w-[120px]">{cellContent.teacher}</div>}
                {cellContent.room && <div className="text-[9px] text-gray-500 truncate max-w-[120px]">📍 {cellContent.room}</div>}
              </>
            )}
          </div>
        )}
      </div>
    </td>
  );
};
