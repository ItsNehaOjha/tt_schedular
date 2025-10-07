import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import TimetableSelector from './TimetableSelector'
import TimetableGrid from './TimetableGrid'
import { timetableAPI } from '../utils/api'

const StudentFlow = () => {
  const navigate = useNavigate()
  const [selectedTimetable, setSelectedTimetable] = useState(null)

  // Query to fetch timetable data
  const { data: timetableData, isLoading, error } = useQuery({
    queryKey: ['timetable', selectedTimetable?.branch, selectedTimetable?.section, selectedTimetable?.year],
    queryFn: () => {
      if (!selectedTimetable?.branch || !selectedTimetable?.section || !selectedTimetable?.year) {
        throw new Error('Missing required parameters')
      }
      return timetableAPI.getTimetableByBranchSection(
        selectedTimetable.branch,
        selectedTimetable.section,
        selectedTimetable.year
      )
    },
    enabled: !!(selectedTimetable?.branch && selectedTimetable?.section && selectedTimetable?.year),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const handleTimetableSelect = (selection) => {
    setSelectedTimetable(selection)
  }

  const handleBack = () => {
    if (timetableData) {
      setSelectedTimetable(null)
    } else {
      navigate('/')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading timetable...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="card">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Timetable Not Found
            </h3>
            <p className="text-gray-600 mb-4">
              {error.response?.data?.message || 'The requested timetable could not be found.'}
            </p>
            <button
              onClick={() => setSelectedTimetable(null)}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (timetableData?.data) {
    return (
      <TimetableGrid
        data={timetableData.data}
        onBack={handleBack}
        isEditable={false}
        showPDFExport={true}
      />
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center mb-6">
            <button
              onClick={handleBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900">Student Timetable</h2>
          </div>

          <TimetableSelector onSelect={handleTimetableSelect} />
        </motion.div>
      </div>
    </div>
  )
}

export default StudentFlow