import React from 'react'
import { ArrowRight, ArrowDown, UserCheck, CalendarRange, ShieldAlert, Share2, Eye } from 'lucide-react'

const WorkflowSection = () => {
  const steps = [
    { number: '1', title: 'Coordinator Login', icon: UserCheck },
    { number: '2', title: 'Create Timetable', icon: CalendarRange },
    { number: '3', title: 'Validate Teacher Clash', icon: ShieldAlert },
    { number: '4', title: 'Publish', icon: Share2 },
    { number: '5', title: 'Student & Teacher Access', icon: Eye }
  ]

  return (
    <section className="bg-slate-50 border-b border-slate-200 py-10 px-6">
      <div className="max-w-[1280px] mx-auto text-center">
        
        <span className="text-xs font-bold text-slate-700 bg-slate-200/60 border border-slate-300 px-3 py-1 rounded-full uppercase tracking-wider select-none">
          Process Flow
        </span>
        <h2 className="text-xl font-extrabold text-slate-900 mt-3 mb-8">
          How The System Works
        </h2>

        {/* Responsive Stepper: Horizontal on desktop/tablet, vertical on mobile */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-2 lg:gap-3.5 max-w-5xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon
            const isLast = idx === steps.length - 1

            return (
              <React.Fragment key={idx}>
                {/* Stepper Card */}
                <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-xl py-2 px-3 shadow-xs select-none w-full md:w-auto">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none mb-0.5">
                      Step {step.number}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800 block whitespace-nowrap">
                      {step.title}
                    </span>
                  </div>
                </div>

                {/* Arrow Connector */}
                {!isLast && (
                  <>
                    {/* Right Arrow on Desktop/Tablet */}
                    <ArrowRight className="w-4 h-4 text-slate-400 hidden md:block flex-shrink-0" />
                    {/* Down Arrow on Mobile */}
                    <ArrowDown className="w-4 h-4 text-slate-400 md:hidden flex-shrink-0 my-1" />
                  </>
                )}
              </React.Fragment>
            )
          })}
        </div>

      </div>
    </section>
  )
}

export default WorkflowSection
