import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TIME_SLOTS, STATUS_COLORS } from '../lib/constants'
import { getActiveCrew } from '../lib/crew'
import { formatDate, toISODateString, addDays, formatTime12 } from '../lib/dateUtils'
import JobModal from '../components/JobModal'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [jobs, setJobs] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState(null)
  const [crewMembers, setCrewMembers] = useState(() => getActiveCrew())

  const dateStr = toISODateString(currentDate)

  const loadJobs = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, property:properties(*)`)
        .eq('job_date', dateStr)
        .order('start_time')
      if (!error) setJobs(data || [])
    } catch (e) {
      console.warn('Could not load jobs:', e.message)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  const loadProperties = useCallback(async () => {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from('properties').select('*').order('name')
      if (!error) setProperties(data || [])
    } catch (e) {
      console.warn('Could not load properties:', e.message)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  useEffect(() => {
    const handleStorage = () => setCrewMembers(getActiveCrew())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const getJobForCell = (crewName, timeValue) => {
    return jobs.find(j => {
      if (j.crew_name !== crewName) return false
      const jobHour = parseInt(j.start_time.split(':')[0])
      const slotHour = parseInt(timeValue.split(':')[0])
      return jobHour === slotHour
    })
  }

  const handleCellClick = (crewName, timeSlot) => {
    const existing = getJobForCell(crewName, timeSlot.value)
    if (existing) {
      setModalInitial({
        ...existing,
        property_id: existing.property_id || '',
      })
    } else {
      setModalInitial({
        job_date: dateStr,
        start_time: timeSlot.value,
        end_time: `${String(parseInt(timeSlot.value) + 1).padStart(2, '0')}:00`,
        crew_name: crewName,
        status: 'scheduled',
      })
    }
    setModalOpen(true)
  }

  const handleSaveJob = async (form) => {
    if (!supabase) {
      // Local mock
      const mockJob = { id: `local-${Date.now()}`, ...form }
      setJobs(prev => {
        const without = prev.filter(j => j.id !== form.id)
        return [...without, mockJob]
      })
      return
    }

    if (form.id) {
      const { error } = await supabase
        .from('jobs')
        .update({
          property_id: form.property_id,
          crew_name: form.crew_name,
          job_date: form.job_date,
          start_time: form.start_time,
          end_time: form.end_time,
          comments: form.comments,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', form.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('jobs').insert([{
        property_id: form.property_id,
        crew_name: form.crew_name,
        job_date: form.job_date,
        start_time: form.start_time,
        end_time: form.end_time,
        comments: form.comments,
        status: form.status,
      }])
      if (error) throw error
    }
    await loadJobs()
  }

  const isToday = toISODateString(currentDate) === toISODateString(new Date())

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(d => addDays(d, -1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              isToday
                ? 'bg-brand-100 text-brand-700'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(d => addDays(d, 1))}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <span className="text-gray-900 font-semibold text-sm sm:text-base">
            {formatDate(currentDate)}
          </span>
          {loading && (
            <svg className="animate-spin w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>

        <button
          onClick={() => {
            setModalInitial({
              job_date: dateStr,
              start_time: '08:00',
              end_time: '09:00',
              crew_name: crewMembers[0]?.name || '',
              status: 'scheduled',
            })
            setModalOpen(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Add Job</span>
        </button>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex sticky top-0 bg-white z-10 border-b border-gray-200 shadow-sm">
            <div className="w-20 flex-shrink-0 border-r border-gray-200" />
            {crewMembers.map(crew => (
              <div
                key={crew.id}
                className="w-36 flex-shrink-0 px-3 py-2 text-center border-r border-gray-100 last:border-r-0"
              >
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {crew.name}
                </span>
              </div>
            ))}
          </div>

          {/* Time rows */}
          {TIME_SLOTS.map((slot, rowIdx) => (
            <div
              key={slot.value}
              className={`flex border-b border-gray-100 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
              style={{ minHeight: '72px' }}
            >
              {/* Time label */}
              <div className="w-20 flex-shrink-0 border-r border-gray-200 flex items-center justify-end pr-3">
                <span className="text-xs text-gray-400 font-medium">{slot.label}</span>
              </div>

              {/* Crew cells */}
              {crewMembers.map(crew => {
                const job = getJobForCell(crew.name, slot.value)
                const colors = job ? STATUS_COLORS[job.status] || STATUS_COLORS.scheduled : null
                const propName = job?.property?.name || job?.property_name || ''
                const propAddr = job?.property?.address || ''

                return (
                  <div
                    key={crew.id}
                    onClick={() => handleCellClick(crew.name, slot)}
                    className="w-36 flex-shrink-0 border-r border-gray-100 last:border-r-0 p-1.5 cursor-pointer hover:bg-brand-50/50 transition-colors"
                  >
                    {job ? (
                      <div className={`rounded-lg border p-2 h-full ${colors.bg} ${colors.border} min-h-[56px]`}>
                        <div className="flex items-start gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${colors.dot}`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold leading-tight truncate ${colors.text}`}>
                              {propName}
                            </p>
                            <p className={`text-xs leading-tight truncate opacity-75 ${colors.text}`}>
                              {propAddr}
                            </p>
                            <p className={`text-xs mt-0.5 opacity-60 ${colors.text}`}>
                              {formatTime12(job.start_time)} – {formatTime12(job.end_time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <JobModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveJob}
        initialData={modalInitial}
        properties={properties}
        onPropertiesChange={loadProperties}
      />
    </div>
  )
}
