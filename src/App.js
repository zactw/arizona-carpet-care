import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import Calendar from './pages/Calendar'
import Properties from './pages/Properties'
import Crew from './pages/Crew'
import PrintView from './pages/PrintView'
import Navbar from './components/Navbar'

function RequireAuth({ children }) {
  const isAuth = localStorage.getItem('acc_auth') === 'true'
  const location = useLocation()
  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<RequireAuth><Calendar /></RequireAuth>} />
        <Route path="/properties" element={<RequireAuth><Properties /></RequireAuth>} />
        <Route path="/crew" element={<RequireAuth><Crew /></RequireAuth>} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/print/:date/:crewId" element={<PrintView />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  )
}
