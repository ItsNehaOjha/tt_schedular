import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, Users, Settings, Check } from 'lucide-react'

const PortalCards = () => {
  const navigate = useNavigate()

  return (
    <section id="portals" className="bg-white py-12 px-6 border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 select-none">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Portal Directory
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-3 mb-2.5">
            Select Your Academic Role
          </h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Access customized timetable directories. Select your portal to view weekly timetables or manage administrative records.
          </p>
        </div>

        {/* Portals Grid - stretch ensures equal heights dynamically */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          
          {/* Student Portal Card */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left">
            <div>
              <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3.5 select-none">
                <GraduationCap className="w-5 h-5" />
              </div>
              
              <h3 className="text-base font-extrabold text-slate-900 mb-1">Student Portal</h3>
              <span className="inline-block text-[9px] font-bold text-slate-505 bg-slate-100 px-2 py-0.5 rounded mb-3 select-none uppercase tracking-wider">
                Public Access
              </span>
              <p className="text-xs text-slate-500 mb-4 leading-normal h-8">
                Public lookup portal for students. Retrieve and view published class weekly timetables.
              </p>

              <div className="border-t border-slate-100 pt-4">
                <ul className="space-y-2">
                  {["Search timetable by Year", "Filter by Branch & Section", "View weekly timetable grid", "Download timetable PDF"].map((feat, i) => (
                    <li key={i} className="flex items-center text-slate-700 text-xs font-medium">
                      <Check className="w-3.5 h-3.5 text-indigo-600 mr-2 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/student')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors text-center block mt-6"
            >
              Open Student Portal
            </button>
          </div>

          {/* Teacher Portal Card */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left">
            <div>
              <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3.5 select-none">
                <Users className="w-5 h-5" />
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mb-1">Teacher Portal</h3>
              <span className="inline-block text-[9px] font-bold text-slate-505 bg-slate-100 px-2 py-0.5 rounded mb-3 select-none uppercase tracking-wider">
                Public Access
              </span>
              <p className="text-xs text-slate-500 mb-4 leading-normal h-8">
                Public search directory for teachers. Review assigned weekly teaching schedules and slots.
              </p>

              <div className="border-t border-slate-100 pt-4">
                <ul className="space-y-2">
                  {["Search teacher profile", "View weekly teaching schedule", "View assigned lectures", "View classroom allocations"].map((feat, i) => (
                    <li key={i} className="flex items-center text-slate-700 text-xs font-medium">
                      <Check className="w-3.5 h-3.5 text-blue-600 mr-2 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={() => navigate('/teacher')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors text-center block mt-6"
            >
              Open Teacher Portal
            </button>
          </div>

          {/* Coordinator Portal Card */}
          <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between text-left">
            <div>
              <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3.5 select-none">
                <Settings className="w-5 h-5" />
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mb-1">Coordinator Portal</h3>
              <span className="inline-block text-[9px] font-bold text-slate-505 bg-slate-100 px-2 py-0.5 rounded mb-3 select-none uppercase tracking-wider">
                Authenticated Access
              </span>
              <p className="text-xs text-slate-500 mb-4 leading-normal h-8">
                Authenticated admin workspace. Construct weekly schedules and seed database directories.
              </p>

              <div className="border-t border-slate-100 pt-4">
                <ul className="space-y-2 text-slate-700 text-xs font-medium">
                  {[
                    "Create & edit timetables",
                    "Manage subjects & teachers",
                    "Validate teacher double-bookings",
                    "Publish timetables for public view"
                  ].map((feat, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-3.5 h-3.5 text-purple-600 mr-2 flex-shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <button
                onClick={() => navigate('/coordinator/login')}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs transition-colors text-center block"
              >
                Coordinator Login
              </button>
              <div className="text-center">
                <Link 
                  to="/coordinator/signup" 
                  className="text-[11px] text-indigo-600 hover:underline font-semibold block"
                >
                  Create Coordinator Account
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}

export default PortalCards
