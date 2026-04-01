import React, { useState, useEffect, useCallback } from 'react'
import { getActivityLogs } from '../lib/activity'

const ACTION_LABELS = {
  job_created: { label: 'Job Created', color: 'bg-green-100 text-green-700' },
  job_updated: { label: 'Job Updated', color: 'bg-blue-100 text-blue-700' },
  job_deleted: { label: 'Job Deleted', color: 'bg-red-100 text-red-700' },
  job_status_changed: { label: 'Status Changed', color: 'bg-yellow-100 text-yellow-700' },
  property_created: { label: 'Property Created', color: 'bg-green-100 text-green-700' },
  property_updated: { label: 'Property Updated', color: 'bg-blue-100 text-blue-700' },
  property_deleted: { label: 'Property Deleted', color: 'bg-red-100 text-red-700' },
  crew_added: { label: 'Crew Added', color: 'bg-green-100 text-green-700' },
  crew_deleted: { label: 'Crew Deleted', color: 'bg-red-100 text-red-700' },
  crew_activated: { label: 'Crew Activated', color: 'bg-green-100 text-green-700' },
  crew_deactivated: { label: 'Crew Deactivated', color: 'bg-gray-100 text-gray-700' },
  user_login: { label: 'Login', color: 'bg-purple-100 text-purple-700' },
  user_logout: { label: 'Logout', color: 'bg-gray-100 text-gray-700' },
  password_changed: { label: 'Password Changed', color: 'bg-orange-100 text-orange-700' },
}

const ENTITY_ICONS = {
  job: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  property: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  crew: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatFullTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function Activity() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const data = await getActivityLogs(200)
    setLogs(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filteredLogs = filter === 'all'
    ? logs
    : logs.filter(log => log.entity_type === filter)

  const entityTypes = ['all', 'job', 'property', 'crew', 'user']

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-500 text-sm mt-0.5">Recent actions and changes</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {entityTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
              filter === type
                ? 'bg-brand-100 text-brand-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {type === 'all' ? 'All' : `${type}s`}
          </button>
        ))}
      </div>

      {/* Activity list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">No activity recorded yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {filteredLogs.map((log, idx) => {
              const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-700' }
              const icon = ENTITY_ICONS[log.entity_type] || ENTITY_ICONS.user

              return (
                <li key={log.id || idx} className="px-4 py-3 hover:bg-gray-50/50">
                  <div className="flex items-start gap-3">
                    {/* Entity icon */}
                    <div className="mt-0.5 p-2 bg-gray-100 text-gray-500 rounded-lg">
                      {icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${actionInfo.color}`}>
                          {actionInfo.label}
                        </span>
                        <span className="text-xs text-gray-400" title={formatFullTime(log.created_at)}>
                          {formatRelativeTime(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <p className="text-xs text-gray-400 mt-1 truncate">
                          {JSON.stringify(log.metadata)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4 text-center">
        Showing {filteredLogs.length} {filter === 'all' ? 'activities' : `${filter} activities`}
      </p>
    </div>
  )
}
