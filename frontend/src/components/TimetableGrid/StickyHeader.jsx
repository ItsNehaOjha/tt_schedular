// frontend/src/components/TimetableGrid/StickyHeader.jsx
import React from 'react';
import { ArrowLeft, RotateCcw, Download, Save, Share } from 'lucide-react';

export const StickyHeader = ({
  onBack,
  timetableInfo,
  isEditable,
  mode,
  showPDFExport,
  isPublished,
  handleSave,
  handlePublish,
  handleExportPDF,
  clearLocalTimetableData,
  hasDraft
}) => {
  const canEdit = isEditable || mode === 'edit' || mode === 'create';

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between select-none">
      <div className="flex items-center space-x-3 text-left">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-sm font-bold text-gray-900 leading-tight">
            {timetableInfo.year || 'New'} Year - {timetableInfo.branch || 'Timetable'} {timetableInfo.section || ''}
          </h2>
          <p className="text-[10px] text-gray-500 font-medium mt-0.5">
            {timetableInfo.semester ? `Semester ${timetableInfo.semester}` : 'Configuration'} 
            {timetableInfo.academicYear ? ` | AY ${timetableInfo.academicYear}` : ''}
            {isPublished && (
              <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-green-50 text-green-700 font-semibold border border-green-200 rounded">
                Published
              </span>
            )}
            {!isPublished && canEdit && (
              <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-amber-50 text-amber-700 font-semibold border border-amber-200 rounded">
                Draft
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {hasDraft && canEdit && (
          <button
            onClick={clearLocalTimetableData}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 hover:text-red-600 transition-all shadow-sm"
            title="Reset unsaved local draft changes"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Draft</span>
          </button>
        )}

        {showPDFExport && (
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-gray-300 text-gray-700 rounded text-xs font-semibold hover:bg-gray-50 transition-all shadow-sm"
            title="Export Timetable as PDF"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        )}

        {canEdit && (
          <>
            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 border border-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-750 transition-all shadow-sm"
              title="Save changes to draft"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </button>

            <button
              onClick={handlePublish}
              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 border border-green-600 text-white rounded text-xs font-semibold hover:bg-green-750 transition-all shadow-sm"
              title="Publish timetable"
            >
              <Share className="w-3.5 h-3.5" />
              <span>Publish</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
