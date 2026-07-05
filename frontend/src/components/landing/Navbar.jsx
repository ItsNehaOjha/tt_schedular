import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Menu, X } from 'lucide-react'

const Navbar = ({ onScrollTo }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 py-3.5 px-6">
      <div className="max-w-[1280px] mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center space-x-3 select-none">
          <div className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-base font-extrabold tracking-tight text-slate-900 block leading-tight">
              TT Scheduler
            </span>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              University Timetable System
            </span>
          </div>
        </div>

        {/* Desktop Links (Hidden on small viewports) */}
        <div className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-slate-600">
          <button 
            onClick={() => onScrollTo('features')} 
            className="hover:text-indigo-600 transition-colors animate-none"
          >
            Features
          </button>
          <button 
            onClick={() => onScrollTo('portals')} 
            className="hover:text-indigo-600 transition-colors animate-none"
          >
            Portals
          </button>
          <span className="w-px h-4 bg-slate-200"></span>
          
          {/* Primary CTA: Coordinator Login (Filled indigo button) */}
          <Link 
            to="/coordinator/login" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm text-center"
          >
            Coordinator Login
          </Link>
          
          {/* Secondary CTA: Coordinator Signup (Outline button) */}
          <Link 
            to="/coordinator/signup" 
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors text-center"
          >
            Coordinator Signup
          </Link>
        </div>

        {/* Hamburger Icon (Visible on small viewports) */}
        <div className="lg:hidden flex items-center">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="p-2 text-slate-650 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer (Collapsible list) */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-100 mt-3 pt-3 flex flex-col space-y-3.5 pb-2 text-sm font-semibold text-slate-600">
          <button 
            onClick={() => {
              onScrollTo('features')
              setIsOpen(false)
            }} 
            className="text-left hover:text-indigo-600 py-1 transition-colors"
          >
            Features
          </button>
          <button 
            onClick={() => {
              onScrollTo('portals')
              setIsOpen(false)
            }} 
            className="text-left hover:text-indigo-600 py-1 transition-colors"
          >
            Portals
          </button>
          <span className="h-px bg-slate-100 w-full"></span>
          
          <Link 
            to="/coordinator/login" 
            onClick={() => setIsOpen(false)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-colors shadow-sm text-center block"
          >
            Coordinator Login
          </Link>
          
          <Link 
            to="/coordinator/signup" 
            onClick={() => setIsOpen(false)}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg transition-colors text-center block"
          >
            Coordinator Signup
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar
