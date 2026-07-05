import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-450 py-5 px-6 font-sans text-xs border-t border-slate-800">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

        {/* Left Section (Branding & Tech Badges) */}
        <div className="text-left space-y-1">
          <h4 className="text-sm font-extrabold text-white leading-tight">TT Scheduler</h4>
          <p className="text-[11px] text-slate-400 font-medium">University Timetable Management System</p>



          <p className="text-[10px] text-slate-500 pt-1.5">IMS Engineering College • B.Tech Final Year Project</p>
        </div>

        {/* Right Section (Quick Links) */}
        <div className="text-left md:text-right space-y-2">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">Quick Links</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-400 md:justify-end">
            <Link to="/coordinator/login" className="hover:text-white transition-colors">Coordinator Login</Link>
            <Link to="/coordinator/signup" className="hover:text-white transition-colors">Coordinator Signup</Link>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-white transition-colors"
            >
              Back to Top
            </button>
            <a href="https://github.com/ItsNehaOjha/tt_schedular" className="hover:text-white transition-colors" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
          </div>
        </div>

      </div>

      {/* Divider */}
      <div className="max-w-[1280px] mx-auto border-t border-slate-800 my-4"></div>

      {/* Bottom Copyright */}
      <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 gap-1.5">
        <span>© 2026 Neha Ojha</span>
        <span>Developed as Final Year Project</span>
      </div>
    </footer>
  )
}

export default Footer
