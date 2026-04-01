import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TIME_SLOTS, STATUS_COLORS } from '../lib/constants'
import { getActiveCrew } from '../lib/crew'
import { formatDate, toISODateString, addDays, formatTime12 } from '../lib/dateUtils'
import { logActivity, ACTIONS } from '../lib/activity'
import JobModal from '../components/JobModal'

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [jobs, setJobs] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState(null)
  const [crewMembers, setCrewMembers] = useState(() => getActiveCrew())
  const [editMode, setEditMode] = useState(false)
  const [draggedJob, setDraggedJob] = useState(null)
  const [unassignedJobs, setUnassignedJobs] = useState([])

  const dateStr = toISODateString(currentDate)

  const loadJobs = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      // Load jobs for current date
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, property:properties(*)`)
        .eq('job_date', dateStr)
        .neq('is_deleted', true)
        .neq('crew_name', 'unassigned')
        .order('start_time')
      if (!error) {
        setJobs(data?.filter(j => j.crew_name) || [])
      }
    } catch (e) {
      console.warn('Could not load jobs:', e.message)
    } finally {
      setLoading(false)
    }
  }, [dateStr])

  const loadUnassignedJobs = useCallback(async () => {
    if (!supabase) return
    try {
      // Load ALL unassigned jobs (not filtered by date)
      const { data, error } = await supabase
        .from('jobs')
        .select(`*, property:properties(*)`)
        .eq('crew_name', 'unassigned')
        .neq('is_deleted', true)
        .order('job_date')
        .order('start_time')
      if (!error) {
        setUnassignedJobs(data || [])
      }
    } catch (e) {
      console.warn('Could not load unassigned jobs:', e.message)
    }
  }, [])

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
    loadUnassignedJobs()
  }, [loadUnassignedJobs])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  useEffect(() => {
    const handleStorage = () => setCrewMembers(getActiveCrew())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Reset edit mode when changing dates (but keep unassigned jobs loaded)
  useEffect(() => {
    setEditMode(false)
  }, [dateStr])

  const getJobForCell = (crewName, timeValue) => {
    return jobs.find(j => {
      if (j.crew_name !== crewName) return false
      const jobHour = parseInt(j.start_time.split(':')[0])
      const slotHour = parseInt(timeValue.split(':')[0])
      return jobHour === slotHour
    })
  }

  const handleCellClick = (crewName, timeSlot) => {
    if (editMode) return // Don't open modal in edit mode
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
    const propName = properties.find(p => p.id === form.property_id)?.name || 'Unknown'

    if (!supabase) {
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
      await logActivity(ACTIONS.JOB_UPDATED, 'job', form.id, `Updated job at ${propName} for ${form.crew_name}`)
    } else {
      const { data, error } = await supabase.from('jobs').insert([{
        property_id: form.property_id,
        crew_name: form.crew_name,
        job_date: form.job_date,
        start_time: form.start_time,
        end_time: form.end_time,
        comments: form.comments,
        status: form.status,
      }]).select().single()
      if (error) throw error
      await logActivity(ACTIONS.JOB_CREATED, 'job', data?.id, `Created job at ${propName} for ${form.crew_name} on ${form.job_date}`)
    }
    await loadJobs()
  }

  const handleDeleteJob = async (jobId) => {
    if (!supabase) {
      setJobs(prev => prev.filter(j => j.id !== jobId))
      return
    }

    const job = jobs.find(j => j.id === jobId)
    const propName = job?.property?.name || 'Unknown'

    const { error } = await supabase
      .from('jobs')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', jobId)

    if (error) throw error

    await logActivity(ACTIONS.JOB_DELETED, 'job', jobId, `Deleted job at ${propName}`)
    await loadJobs()
  }

  // Drag and drop handlers
  const handleDragStart = (e, job) => {
    if (!editMode) return
    setDraggedJob(job)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', job.id)
  }

  const handleDragOver = (e) => {
    if (!editMode || !draggedJob) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, crewName, timeSlot) => {
    e.preventDefault()
    if (!editMode || !draggedJob) return

    const newStartTime = timeSlot.value
    const newEndTime = `${String(parseInt(timeSlot.value) + 1).padStart(2, '0')}:00`

    // Check if there's already a job in this slot
    const existingJob = getJobForCell(crewName, timeSlot.value)

    if (existingJob && existingJob.id !== draggedJob.id) {
      // Move existing job to unassigned
      setUnassignedJobs(prev => [...prev, existingJob])
      setJobs(prev => prev.filter(j => j.id !== existingJob.id))

      // Update existing job in DB to be unassigned
      if (supabase) {
        await supabase
          .from('jobs')
          .update({ crew_name: 'unassigned', updated_at: new Date().toISOString() })
          .eq('id', existingJob.id)
      }
    }

    // Update dragged job (also set job_date to current date when assigning)
    const updatedJob = {
      ...draggedJob,
      crew_name: crewName,
      job_date: dateStr,
      start_time: newStartTime,
      end_time: newEndTime,
    }

    // Update local state
    setJobs(prev => {
      const without = prev.filter(j => j.id !== draggedJob.id)
      return [...without, updatedJob]
    })
    setUnassignedJobs(prev => prev.filter(j => j.id !== draggedJob.id))

    // Update in database
    if (supabase) {
      await supabase
        .from('jobs')
        .update({
          crew_name: crewName,
          job_date: dateStr,
          start_time: newStartTime,
          end_time: newEndTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draggedJob.id)

      const propName = draggedJob.property?.name || 'Unknown'
      await logActivity(ACTIONS.JOB_UPDATED, 'job', draggedJob.id, `Moved job at ${propName} to ${crewName} at ${formatTime12(newStartTime)}`)
    }

    setDraggedJob(null)
  }

  const handleDropToUnassigned = async (e) => {
    e.preventDefault()
    if (!editMode || !draggedJob) return

    // Move to unassigned
    const unassignedJob = { ...draggedJob, crew_name: 'unassigned' }
    setUnassignedJobs(prev => [...prev, unassignedJob])
    setJobs(prev => prev.filter(j => j.id !== draggedJob.id))

    // Update in database
    if (supabase) {
      await supabase
        .from('jobs')
        .update({ crew_name: 'unassigned', updated_at: new Date().toISOString() })
        .eq('id', draggedJob.id)

      const propName = draggedJob.property?.name || 'Unknown'
      await logActivity(ACTIONS.JOB_UPDATED, 'job', draggedJob.id, `Moved job at ${propName} to unassigned`)
    }

    setDraggedJob(null)
  }

  const handleDragEnd = () => {
    setDraggedJob(null)
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

        <div className="flex items-center gap-2">
          {/* Edit Day Button */}
          <button
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              editMode
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            <span className="hidden sm:inline">{editMode ? 'Done Editing' : 'Edit Day'}</span>
          </button>

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
      </div>

      {/* Edit mode banner */}
      {editMode && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-orange-700">
            <strong>Edit Mode:</strong> Drag jobs to reassign crew or change times. Displaced jobs go to Unassigned.
          </span>
        </div>
      )}

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
                const isDragging = draggedJob?.id === job?.id

                return (
                  <div
                    key={crew.id}
                    onClick={() => !editMode && handleCellClick(crew.name, slot)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, crew.name, slot)}
                    className={`w-36 flex-shrink-0 border-r border-gray-100 last:border-r-0 p-1.5 transition-colors ${
                      editMode
                        ? 'cursor-default hover:bg-orange-50/50'
                        : 'cursor-pointer hover:bg-brand-50/50'
                    } ${draggedJob && !job ? 'bg-orange-50/30' : ''}`}
                  >
                    {job ? (
                      <div
                        draggable={editMode}
                        onDragStart={(e) => handleDragStart(e, job)}
                        onDragEnd={handleDragEnd}
                        className={`rounded-lg border p-2 h-full ${colors.bg} ${colors.border} min-h-[56px] ${
                          editMode ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${isDragging ? 'opacity-50' : ''}`}
                      >
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

          {/* Unassigned Jobs Section - inside calendar grid */}
          {(editMode || unassignedJobs.length > 0) && (
            <div
              onDragOver={editMode ? handleDragOver : undefined}
              onDrop={editMode ? handleDropToUnassigned : undefined}
              className={`border-t-2 border-orange-300 bg-orange-50 p-4 ${
                draggedJob ? 'bg-orange-100' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span className="font-semibold text-orange-800">Unassigned Jobs</span>
                <span className="text-sm text-orange-600">({unassignedJobs.length})</span>
                {!editMode && unassignedJobs.length > 0 && (
                  <span className="text-xs text-orange-500 ml-2">Click "Edit Day" to reassign</span>
                )}
              </div>

              {unassignedJobs.length === 0 ? (
                <div className="text-center py-4 text-orange-600 text-sm border-2 border-dashed border-orange-300 rounded-lg">
                  {draggedJob ? 'Drop here to unassign' : 'No unassigned jobs. Drag jobs here to unassign them.'}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {unassignedJobs.map(job => {
                    const colors = STATUS_COLORS[job.status] || STATUS_COLORS.scheduled
                    const propName = job.property?.name || job.property_name || 'Unknown'
                    const isDragging = draggedJob?.id === job.id
                    const jobDate = job.job_date ? new Date(job.job_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''

                    return (
                      <div
                        key={job.id}
                        draggable={editMode}
                        onDragStart={editMode ? (e) => handleDragStart(e, job) : undefined}
                        onDragEnd={editMode ? handleDragEnd : undefined}
                        className={`rounded-lg border p-2 ${colors.bg} ${colors.border} min-w-[140px] ${
                          editMode ? 'cursor-grab active:cursor-grabbing' : ''
                        } ${isDragging ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${colors.dot}`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold leading-tight truncate ${colors.text}`}>
                              {propName}
                            </p>
                            <p className={`text-xs opacity-60 ${colors.text}`}>
                              {jobDate} · {formatTime12(job.start_time)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <JobModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveJob}
        onDelete={handleDeleteJob}
        initialData={modalInitial}
        properties={properties}
        crewMembers={crewMembers}
        onPropertiesChange={loadProperties}
      />
    </div>
  )
}
