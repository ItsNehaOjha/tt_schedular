import React from 'react'
import { ShieldAlert, FileText, CheckCircle, Calendar, Lock, Users } from 'lucide-react'

const FeaturesSection = () => {
  const highlights = [
    { icon: ShieldAlert, title: 'Teacher Clash Detection' },
    { icon: Calendar, title: 'Weekly Timetable Management' },
    { icon: FileText, title: 'PDF Timetable Export' },
    { icon: Users, title: 'Subject & Teacher Management' },
    { icon: CheckCircle, title: 'Timetable Publication' },
    { icon: Lock, title: 'Role-Based Access' }
  ]

  return (
    <section id="features" className="bg-white py-10 px-6 border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-6 select-none">
          <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Project Highlights
          </span>
        </div>

        {/* Highlights Grid - Reduced heights & paddings */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {highlights.map((h, i) => {
            const Icon = h.icon
            return (
              <div 
                key={i} 
                className="border border-slate-200 hover:border-slate-300 rounded-xl p-3 bg-white transition-all text-center flex flex-col items-center justify-center gap-1.5 h-16 select-none hover:shadow-xs"
              >
                <div className="w-6.5 h-6.5 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-[10px] md:text-[11px] font-bold text-slate-800 tracking-tight leading-tight">
                  {h.title}
                </h4>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default FeaturesSection
