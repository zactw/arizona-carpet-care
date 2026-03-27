import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { CREW_MEMBERS } from '../lib/constants'
import { toISODateString } from '../lib/dateUtils'

export default function Navbar({ currentDate }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [printOpen, setPrintOpen] = useState(false)

  const handleSignOut = () => {
    localStorage.removeItem('acc_auth')
    navigate('/login')
  }

  const today = currentDate || new Date()
  const dateStr = toISODateString(today)

  const navLink = (to, label) => {
    const active = location.pathname === to || (to === '/' && location.pathname === '/')
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          active
            ? 'bg-brand-100 text-brand-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm hidden sm:block">Arizona Carpet Care</span>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navLink('/', 'Calendar')}
            {navLink('/properties', 'Properties')}

            {/* Print dropdown */}
            <div className="relative">
              <button
                onClick={() => setPrintOpen(!printOpen)}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1"
              >
                Print Today
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {printOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Select Crew
                    </div>
                    {CREW_MEMBERS.map(crew => (
                      <Link
                        key={crew.id}
                        to={`/print/${dateStr}/${crew.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setPrintOpen(false)}
                      >
                        {crew.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Click-outside overlay */}
      {printOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setPrintOpen(false)} />
      )}
    </nav>
  )
}
