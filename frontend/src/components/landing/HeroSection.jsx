import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Lock } from 'lucide-react'
import TimetableGrid from '../TimetableGrid'

const HeroSection = ({ onScrollTo }) => {
  const navigate = useNavigate()

  // Realistic mock data representing the actual database model structure
  const mockTimetableData = {
    year: '3rd Year',
    branch: 'CSE',
    section: 'A',
    semester: 5,
    academicYear: '2025-26',
    isPublished: true,
    coordinatorName: 'Academic Coordinator',
    schedule: [
      // Monday
      { day: 'Monday', timeSlot: '08:50-09:40', subject: { acronym: 'CS-601', name: 'Compiler Design', code: 'CS-601' }, teacher: { name: 'Faculty A' }, type: 'lecture', room: 'Room 302' },
      { day: 'Monday', timeSlot: '09:40-10:30', subject: { acronym: 'CS-602', name: 'Database Management', code: 'CS-602' }, teacher: { name: 'Faculty B' }, type: 'lecture', room: 'Lab 3' },
      { day: 'Monday', timeSlot: '10:30-11:20', subject: { acronym: 'CS-603', name: 'Computer Networks', code: 'CS-603' }, teacher: { name: 'Faculty C' }, type: 'lecture', room: 'Room 104' },
      { day: 'Monday', timeSlot: '11:20-12:10', subject: { acronym: 'CS-604', name: 'Operating Systems', code: 'CS-604' }, teacher: { name: 'Faculty D' }, type: 'lecture', room: 'Room 204' },
      { day: 'Monday', timeSlot: '12:10-13:00', subject: { acronym: 'CS-605', name: 'Software Eng.', code: 'CS-605' }, teacher: { name: 'Faculty E' }, type: 'lecture', room: 'Room 305' },
      { day: 'Monday', timeSlot: '13:00-13:50', subject: { acronym: 'LUNCH', name: 'Lunch' }, teacher: { name: '' }, type: 'lunch', room: '' },
      { day: 'Monday', timeSlot: '13:50-14:40', subject: { acronym: 'CS-601', name: 'Compiler Design', code: 'CS-601' }, teacher: { name: 'Faculty A' }, type: 'lecture', room: 'Room 302' },
      { day: 'Monday', timeSlot: '14:40-15:30', subject: { acronym: 'CS-606', name: 'Theory of Computation', code: 'CS-606' }, teacher: { name: 'Faculty F' }, type: 'lecture', room: 'Room 102' },
      // Tuesday
      { day: 'Tuesday', timeSlot: '08:50-09:40', subject: { acronym: 'CS-603', name: 'Computer Networks', code: 'CS-603' }, teacher: { name: 'Faculty C' }, type: 'lecture', room: 'Room 104' },
      { day: 'Tuesday', timeSlot: '09:40-10:30', subject: { acronym: 'CS-604', name: 'Operating Systems', code: 'CS-604' }, teacher: { name: 'Faculty D' }, type: 'lecture', room: 'Room 204' },
      { day: 'Tuesday', timeSlot: '10:30-11:20', subject: { acronym: 'CS-605', name: 'Software Eng.', code: 'CS-605' }, teacher: { name: 'Faculty E' }, type: 'lecture', room: 'Room 305' },
      { day: 'Tuesday', timeSlot: '11:20-12:10', subject: { acronym: 'CS-601', name: 'Compiler Design', code: 'CS-601' }, teacher: { name: 'Faculty A' }, type: 'lecture', room: 'Room 302' },
      { day: 'Tuesday', timeSlot: '12:10-13:00', subject: { acronym: 'CS-602', name: 'Database Management', code: 'CS-602' }, teacher: { name: 'Faculty B' }, type: 'lecture', room: 'Lab 3' },
      { day: 'Tuesday', timeSlot: '13:00-13:50', subject: { acronym: 'LUNCH', name: 'Lunch' }, teacher: { name: '' }, type: 'lunch', room: '' },
      { day: 'Tuesday', timeSlot: '13:50-14:40', subject: { acronym: 'CS-606', name: 'Theory of Computation', code: 'CS-606' }, teacher: { name: 'Faculty F' }, type: 'lecture', room: 'Room 102' },
      { day: 'Tuesday', timeSlot: '14:40-15:30', subject: { acronym: 'CS-607', name: 'Artificial Intelligence', code: 'CS-607' }, teacher: { name: 'Faculty G' }, type: 'lecture', room: 'Room 202' }
    ]
  }

  return (
    <section className="bg-slate-50 border-b border-slate-200 py-12 md:py-16 px-6">
      {/* Maximum Container width bounded at 1280px */}
      <div className="max-w-[1280px] mx-auto grid lg:grid-cols-11 gap-8 md:gap-12 items-center">
        
        {/* Left Column - Spanning 5/11 columns (~45.4% width) */}
        <div className="lg:col-span-5 text-left flex flex-col justify-center">
          <div className="inline-flex items-center gap-1.5 bg-slate-200/60 text-slate-850 font-bold px-3 py-1 rounded-full text-[11px] border border-slate-300 w-fit mb-4 select-none">
            <span>Demo Configuration:</span>
            <span className="text-indigo-700">IMS Engineering College</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-slate-900 leading-tight tracking-tight mb-4 whitespace-normal">
            University Timetable <br className="hidden sm:inline" />
            <span className="text-indigo-600">Management System</span>
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed mb-5">
            A centralized timetable management platform where coordinators create and publish academic schedules while students and faculty can search, view, and download published weekly timetables.
          </p>

          {/* Compact Available Portals Panel */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-6 select-none shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              System Portals & Capabilities
            </span>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-semibold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Student Portal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Teacher Portal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Coordinator Portal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>Weekly Timetable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                <span>PDF Export</span>
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center gap-3.5">
            <button
              onClick={() => onScrollTo('portals')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm"
            >
              Explore Portals
            </button>
            <button
              onClick={() => navigate('/coordinator/login')}
              className="px-5 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors shadow-xs"
            >
              Coordinator Login
            </button>
          </div>
        </div>

        {/* Right Column - Spanning 6/11 columns (~54.5% width) - Reduced dominance */}
        <div className="lg:col-span-6 w-full overflow-hidden">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
            
            {/* Mock Browser Header - Hidden on extra-small mobile viewports */}
            <div className="hidden sm:flex bg-slate-100 border-b border-slate-200 px-4 py-2.5 items-center justify-between select-none">
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
              </div>
              <div className="bg-white border border-slate-200 rounded py-0.5 px-6 text-[10px] text-slate-400 font-mono tracking-wide w-3/5 text-center flex items-center justify-center gap-1">
                <Lock className="w-2.5 h-2.5 text-slate-400" />
                <span>localhost:3000/student/dashboard</span>
              </div>
              <div className="w-10"></div>
            </div>

            {/* Embedded Real TimetableGrid in Read-Only Mode - Constrained & scrollable with pointer-events bypass */}
            <div className="max-h-[350px] overflow-auto p-2 bg-slate-50 pointer-events-none select-none">
              <div className="min-w-[640px] md:min-w-0">
                <TimetableGrid timetableData={mockTimetableData} isEditable={false} />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

export default HeroSection
