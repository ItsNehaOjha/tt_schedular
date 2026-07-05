// frontend/src/components/TimetableGrid.jsx
import React from 'react';
import { useTimetableState } from '../hooks/useTimetableState';
import { StickyHeader } from './TimetableGrid/StickyHeader';
import { Toolbar } from './TimetableGrid/Toolbar';
import { TimetableTable } from './TimetableGrid/TimetableTable';
import { MobileView } from './TimetableGrid/MobileView';
import { TimeSlotEditModal } from './TimetableGrid/TimeSlotEditModal';
import EditModal from './EditModal';

const TimetableGrid = ({
  onBack,
  onSave,
  onPublish,
  data,
  timetableData,
  mode,
  isEditable,
  showPDFExport = false,
  savedTimetableId = null,
  isPublished = false,
  coordinatorName = null
}) => {
  const {
    editingCell,
    setEditingCell,
    editingTimeSlot,
    setEditingTimeSlot,
    timeSlots,
    days,
    deletedTimeSlots,
    timetableInfo,
    scheduleData,
    isInitialized,
    slotManager,
    publishActions,
    handleCellClick,
    handleClearCell,
    handleSaveCell,
    clearLocalTimetableData
  } = useTimetableState({
    onBack,
    onSave,
    onPublish,
    data,
    timetableData,
    mode,
    isEditable,
    coordinatorName
  });

  const hasDraft = !!(timetableData || data);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl flex flex-col flex-grow h-full overflow-hidden">
      {/* Sticky Action Header */}
      <StickyHeader
        onBack={onBack}
        timetableInfo={timetableInfo}
        isEditable={isEditable}
        mode={mode}
        showPDFExport={showPDFExport}
        isPublished={isPublished}
        handleSave={publishActions.handleSave}
        handlePublish={publishActions.handlePublish}
        handleExportPDF={publishActions.handleExportPDF}
        clearLocalTimetableData={clearLocalTimetableData}
        hasDraft={hasDraft}
      />

      {/* Grid Dimension Actions Toolbar */}
      <Toolbar
        isEditable={isEditable}
        mode={mode}
        addTimeSlot={slotManager.addTimeSlot}
        addDay={slotManager.addDay}
        deletedTimeSlots={deletedTimeSlots}
        restoreTimeSlot={slotManager.restoreTimeSlot}
        days={days}
        timeSlots={timeSlots}
      />

      {/* Scrollable Container */}
      <div className="flex-1 overflow-auto bg-slate-50 p-4">
        {/* Desktop View */}
        <div className="hidden md:block">
          <TimetableTable
            days={days}
            timeSlots={timeSlots}
            isEditable={isEditable}
            mode={mode}
            removeDay={slotManager.removeDay}
            setEditingTimeSlot={setEditingTimeSlot}
            removeTimeSlot={slotManager.removeTimeSlot}
            scheduleData={scheduleData}
            handleCellClick={handleCellClick}
            handleClearCell={handleClearCell}
          />
        </div>

        {/* Mobile View */}
        <MobileView
          days={days}
          timeSlots={timeSlots}
          isEditable={isEditable}
          mode={mode}
          removeDay={slotManager.removeDay}
          scheduleData={scheduleData}
          handleCellClick={handleCellClick}
          handleClearCell={handleClearCell}
        />
      </div>

      {/* Edit Cell Modal */}
      {editingCell && (
        <EditModal
          isOpen={!!editingCell}
          onClose={() => setEditingCell(null)}
          onSave={handleSaveCell}
          initialData={editingCell.data}
          timeSlot={editingCell.timeSlot}
          day={editingCell.day}
          data={data}
          timetableData={timetableData}
          scheduleData={scheduleData}
        />
      )}

      {/* Time Slot Edit Modal */}
      <TimeSlotEditModal
        isOpen={!!editingTimeSlot}
        onClose={() => setEditingTimeSlot(null)}
        onSave={slotManager.handleTimeSlotEdit}
        initialTimeSlot={editingTimeSlot?.timeSlot}
        index={editingTimeSlot?.index}
      />
    </div>
  );
};

export default TimetableGrid;
