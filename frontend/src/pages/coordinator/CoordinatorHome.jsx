import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, Loader, Edit, Trash2, LogOut } from 'lucide-react'
import api, { timetableAPI } from '../../utils/api'
import toast from 'react-hot-toast'

const CoordinatorHome = ({ user, onLogout }) => {
  const navigate = useNavigate()
  
  const [timetables, setTimetables] = useState([])
  const [loadingTimetables, setLoadingTimetables] = useState(true)

  // Fetch all timetables immediately on mount
  const fetchTimetables = async () => {
    try {
      setLoadingTimetables(true)
      
      // Fallback cache loading for fast initial paint
      const cachedList = localStorage.getItem('latestTimetableList')
      if (cachedList) {
        try {
          const parsed = JSON.parse(cachedList)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTimetables(parsed)
          }
        } catch {
          console.warn('Invalid cached timetable list, skipping...')
        }
      }

      const response = await api.get(`/timetable?t=${Date.now()}`)
      if (response.data.success) {
        setTimetables(response.data.data)
        localStorage.setItem('latestTimetableList', JSON.stringify(response.data.data))
      }
    } catch (error) {
      console.error('Error fetching timetables:', error)
      toast.error('Failed to load timetable registry')
    } finally {
      setLoadingTimetables(false)
    }
  }

  useEffect(() => {
    fetchTimetables()
  }, [])

  const handleEditTimetable = (timetable) => {
    localStorage.setItem('coordinatorTimetable_selectedClass', JSON.stringify({
      year: timetable.year === '1' ? '1st Year' : 
            timetable.year === '2' ? '2nd Year' : 
            timetable.year === '3' ? '3rd Year' : 
            timetable.year === '4' ? '4th Year' : timetable.year,
      branch: timetable.branch,
      section: timetable.section,
      semester: timetable.semester,
      academicYear: timetable.academicYear
    }))
    localStorage.setItem('coordinatorTimetable_timetableData', JSON.stringify(timetable))
    localStorage.setItem('coordinatorTimetable_currentStep', 'edit')
    navigate('/coordinator/dashboard/timetable', { state: { origin: 'dashboard' } })
  }

  const handleDeleteTimetable = async (timetableId) => {
    if (window.confirm('Are you sure you want to delete this timetable?')) {
      try {
        await timetableAPI.deleteTimetable(timetableId)
        toast.success('Timetable deleted successfully')
        fetchTimetables()
      } catch (error) {
        console.error('Error deleting timetable:', error)
        toast.error('Failed to delete timetable')
      }
    }
  }

  const handleQuickAction = (path) => {
    navigate(path)
  }

  // Profile parsing helpers
  const coordinatorName = user?.cname || (user?.firstName ? `${user.salutation ? `${user.salutation}. ` : ''}${user.firstName} ${user.lastName || ''}`.trim() : 'Coordinator')
  const branch = user?.branch || 'N/A'
  const year = user?.year || 'N/A'
  const username = user?.username || 'N/A'

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 px-2">
      
      {/* Top Banner and Actions Row */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-250 select-none">
        <div className="text-left">
          <h2 className="text-xl font-black text-indigo-700 tracking-tight font-sans">
            TT Scheduler
          </h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuickAction('/coordinator/dashboard/timetable')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>+ Build Timetable</span>
          </button>
          
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
              title="Logout Coordinator Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Coordinator Profile Block */}
      <div className="text-left font-sans">
        <h1 className="text-lg font-bold text-gray-900 leading-tight">
          {coordinatorName}
        </h1>
        <p className="text-xs font-bold text-gray-550 mt-1">
          {branch.toUpperCase()} • Year {year}
        </p>
        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
          @{username}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-250 my-2" />

      {/* Timetable Registry List */}
      <div className="space-y-4">
        <div className="text-left mb-3">
          <h2 className="text-sm font-extrabold text-gray-800 uppercase tracking-widest">
            Timetable Registry
          </h2>
        </div>

        {loadingTimetables && timetables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
            <p className="text-xs text-gray-550 font-medium mt-2">Loading registry files...</p>
          </div>
        ) : timetables.length === 0 ? (
          /* Centered Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center select-none bg-white border border-gray-250 rounded-xl p-6 shadow-2xs">
            <Calendar className="w-12 h-12 text-gray-300 mb-3 stroke-1.25" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">No Timetables Yet</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 mb-5 max-w-xs">
              Create your first timetable to get started.
            </p>
            <button
              onClick={() => handleQuickAction('/coordinator/dashboard/timetable')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Build Timetable</span>
            </button>
          </div>
        ) : (
          /* Clickable Registry Cards */
          <div className="grid gap-3">
            {timetables.map((timetable) => (
              <div
                key={timetable._id}
                onClick={() => handleEditTimetable(timetable)}
                className="border border-gray-250 rounded-xl p-4 bg-white hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all duration-200 text-left relative flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <h3 className="font-extrabold text-gray-900 text-sm uppercase leading-tight tracking-wide">
                    {timetable.year === '1' ? '1st Year' : 
                     timetable.year === '2' ? '2nd Year' : 
                     timetable.year === '3' ? '3rd Year' : 
                     timetable.year === '4' ? '4th Year' : timetable.year} {' '}
                    {timetable.branch.toUpperCase()} • Section {timetable.section}
                  </h3>
                  <p className="text-xs text-gray-500 font-semibold leading-none">
                    Semester {timetable.semester} • Academic Year {timetable.academicYear}
                  </p>
                </div>
                
                {/* Status Badge & Inline Actions */}
                <div className="flex items-center space-x-3.5" onClick={(e) => e.stopPropagation()}>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase select-none border tracking-wider ${
                    timetable.isPublished 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                      : 'bg-amber-50 text-amber-700 border-amber-250'
                  }`}>
                    {timetable.isPublished ? 'Published' : 'Draft'}
                  </span>
                  
                  <div className="flex items-center space-x-1 border-l border-gray-200 pl-3.5">
                    <button
                      onClick={() => handleEditTimetable(timetable)}
                      className="p-1.5 text-indigo-650 hover:bg-indigo-50 hover:border-indigo-200 border border-transparent rounded-lg transition-all"
                      title="Edit Timetable Grid"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTimetable(timetable._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 hover:border-red-200 border border-transparent rounded-lg transition-all"
                      title="Delete Timetable"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

export default CoordinatorHome
