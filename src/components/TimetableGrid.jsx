import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Download, Save, Share, Edit } from 'lucide-react'
import EditModal from './EditModal'
import { exportToPDF } from '../utils/pdfExport'

const TimetableGrid = ({ 
  data, 
  onBack, 
  isEditable = false, 
  showPDFExport = false,
  onSave,
  onPublish 
}) => {
  const [editingCell, setEditingCell] = useState(null)
  const [scheduleData, setScheduleData] = useState(data.schedule)

  const handleCellClick = (day, timeSlot) => {
    if (isEditable) {
      setEditingCell({ day, timeSlot, data: scheduleData[day][timeSlot] })
    }
  }

  const handleSaveCell = (cellData) => {
    const newSchedule = { ...scheduleData }
    newSchedule[editingCell.day][editingCell.timeSlot] = cellData
    setScheduleData(newSchedule)
    setEditingCell(null)
  }

  const handleExportPDF = () => {
    exportToPDF(data, scheduleData)
  }

  const renderCell = (day, timeSlot) => {
    const cellData = scheduleData[day][timeSlot]
    const isLunch = cellData.acronym === 'LUNCH'
    
    return (
      <motion.div
        key={`${day}-${timeSlot}`}
        whileHover={isEditable ? { scale: 1.02 } : {}}
        className={`timetable-cell ${isEditable ? 'editable' : ''} ${
          isLunch ? 'bg-orange-50 border-orange-200' : ''
        }`}
        onClick={() => handleCellClick(day, timeSlot)}
      >
        {isLunch ? (
          <div className="text-orange-600 font-semibold">LUNCH</div>
        ) : (
          <>
            <div className="font-bold text-lg text-gray-900">
              {cellData.acronym}
            </div>
            <div className="text-sm text-gray-600">
              {cellData.teacher}
            </div>
            <div className="text-xs text-gray-400">
              {cellData.code}
            </div>
          </>
        )}
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Timetable
                </h2>
                <p className="text-gray-600">
                  {data.year} - {data.branch} - Section {data.section}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              {showPDFExport && (
                <button
                  onClick={handleExportPDF}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
              )}
              {isEditable && (
                <>
                  <button
                    onClick={onSave}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={onPublish}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Share className="w-4 h-4" />
                    <span>Publish</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-[800px]">
              {/* Header Row */}
              <div className="bg-gray-100 p-3 font-semibold text-center rounded-lg">
                Time
              </div>
              {data.schedule.days.map(day => (
                <div key={day} className="bg-gray-100 p-3 font-semibold text-center rounded-lg">
                  {day}
                </div>
              ))}

              {/* Time Slots */}
              {data.schedule.timeSlots.map(timeSlot => (
                <React.Fragment key={timeSlot}>
                  <div className="bg-gray-50 p-3 font-medium text-center flex items-center justify-center rounded-lg">
                    {timeSlot}
                  </div>
                  {data.schedule.days.map(day => renderCell(day, timeSlot))}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {data.schedule.days.map(day => (
              <div key={day} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-lg mb-3 text-center">{day}</h3>
                <div className="space-y-2">
                  {data.schedule.timeSlots.map(timeSlot => (
                    <div key={timeSlot} className="flex items-center space-x-3">
                      <div className="w-20 text-sm font-medium text-gray-600">
                        {timeSlot}
                      </div>
                      <div className="flex-1">
                        {renderCell(day, timeSlot)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      {editingCell && (
        <EditModal
          isOpen={!!editingCell}
          onClose={() => setEditingCell(null)}
          onSave={handleSaveCell}
          initialData={editingCell.data}
        />
      )}
    </div>
  )
}

export default TimetableGrid