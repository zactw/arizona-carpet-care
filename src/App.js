import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Calendar from './pages/Calendar'
import Properties from './pages/Properties'
import Crew from './pages/Crew'
import PrintView from './pages/PrintView'
import Activity from './pages/Activity'
import Navbar from './components/Navbar'

function RequireAuth({ children, session }) {
  const location = useLocation()
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

function AppLayout({ session }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar session={session} />
      <Routes>
        <Route path="/" element={<RequireAuth session={session}><Calendar /></RequireAuth>} />
        <Route path="/properties" element={<RequireAuth session={session}><Properties /></RequireAuth>} />
        <Route path="/crew" element={<RequireAuth session={session}><Crew /></RequireAuth>} />
        <Route path="/activity" element={<RequireAuth session={session}><Activity /></RequireAuth>} />
        <Route path="/print/:date/:crewId" element={<RequireAuth session={session}><PrintView /></RequireAuth>} />
      </Routes>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/*" element={<AppLayout session={session} />} />
      </Routes>
    </BrowserRouter>
  )
}
