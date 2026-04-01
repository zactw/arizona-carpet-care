import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getCrew } from '../lib/crew'
import { fromISODateString, formatDate, formatTime12 } from '../lib/dateUtils'

export default function PrintView() {
  const { date, crewId } = useParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const crew = getCrew().find(c => c.id === crewId)
  const crewName = crew?.name || crewId

  useEffect(() => {
    const load = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select(`*, property:properties(*)`)
          .eq('job_date', date)
          .eq('crew_name', crewName)
          .neq('status', 'cancelled')
          .neq('is_deleted', true)
          .order('start_time')
        if (!error) setJobs(data || [])
      } catch (e) {
        console.warn('Could not load jobs for print:', e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [date, crewName])

  useEffect(() => {
    if (!loading) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading])

  const displayDate = date ? formatDate(fromISODateString(date)) : ''
  const now = new Date()
  const printedAt = now.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6 font-mono text-sm">
      {/* Print action buttons — hidden when printing */}
      <div className="no-print mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          🖨 Print / Save PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      {/* Print content */}
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-wide">ARIZONA CARPET CARE</h1>
          <div className="mt-1 text-base">
            <strong>{crewName}</strong> — {displayDate}
          </div>
        </div>

        <hr className="border-gray-400 mb-4" />

        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No jobs scheduled for this crew on this date.
          </div>
        ) : (
          <div className="space-y-0">
            {jobs.map((job, idx) => {
              const prop = job.property || {}
              return (
                <div key={job.id}>
                  {/* Job block */}
                  <div className="py-3">
                    {/* Time + Property */}
                    <div className="flex gap-3">
                      <div className="w-24 flex-shrink-0 font-semibold">
                        {formatTime12(job.start_time)}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base">{prop.name || '—'}</div>

                        {prop.address && (
                          <div className="mt-0.5">
                            {prop.address}
                            {prop.phone && ` | ${prop.phone}`}
                          </div>
                        )}

                        {(prop.property_manager_name || prop.maintenance_supervisor_name) && (
                          <div className="mt-0.5">
                            {prop.property_manager_name && (
                              <span>
                                Mgr: {prop.property_manager_name}
                                {prop.property_manager_phone && ` ${prop.property_manager_phone}`}
                              </span>
                            )}
                            {prop.property_manager_name && prop.maintenance_supervisor_name && ' | '}
                            {prop.maintenance_supervisor_name && (
                              <span>
                                Maint: {prop.maintenance_supervisor_name}
                                {prop.maintenance_supervisor_phone && ` ${prop.maintenance_supervisor_phone}`}
                              </span>
                            )}
                          </div>
                        )}

                        {(prop.management_company || prop.unit_count) && (
                          <div className="mt-0.5">
                            {prop.management_company}
                            {prop.management_company && prop.unit_count && ' | '}
                            {prop.unit_count && `${prop.unit_count} units`}
                          </div>
                        )}

                        {prop.standing_directions && (
                          <div className="mt-1">
                            <span className="font-semibold">Notes:</span> {prop.standing_directions}
                          </div>
                        )}

                        {job.comments && (
                          <div className="mt-0.5">
                            <span className="font-semibold">Job notes:</span> {job.comments}
                          </div>
                        )}

                        {job.end_time && (
                          <div className="mt-0.5 text-gray-500">
                            Until: {formatTime12(job.end_time)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {idx < jobs.length - 1 && <hr className="border-gray-300" />}
                </div>
              )
            })}
          </div>
        )}

        <hr className="border-gray-400 mt-4 mb-3" />
        <div className="text-xs text-gray-400 text-right">
          Printed: {printedAt}
        </div>
      </div>
    </div>
  )
}
