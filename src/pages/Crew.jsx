import React, { useState } from 'react'
import { getCrew, addCrewMember, deleteCrewMember, toggleCrewMember } from '../lib/crew'

export default function Crew() {
  const [crew, setCrew] = useState(() => getCrew())
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [error, setError] = useState('')

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      setError('Name is required.')
      return
    }
    if (crew.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('A crew member with that name already exists.')
      return
    }
    const updated = addCrewMember(trimmed)
    setCrew(updated)
    setNewName('')
    setAdding(false)
    setError('')
  }

  const handleDelete = (id) => {
    const updated = deleteCrewMember(id)
    setCrew(updated)
    setConfirmDelete(null)
  }

  const handleToggle = (id) => {
    const updated = toggleCrewMember(id)
    setCrew(updated)
  }

  const handleCancelAdd = () => {
    setAdding(false)
    setNewName('')
    setError('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Crew Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Active crew appear as columns in the calendar.
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Crew Member
          </button>
        )}
      </div>

      {adding && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">New Crew Member</h2>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                autoFocus
                value={newName}
                onChange={e => { setNewName(e.target.value); setError('') }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') handleCancelAdd() }}
                placeholder="e.g. John D"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Add
            </button>
            <button
              onClick={handleCancelAdd}
              className="px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {crew.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">
            No crew members yet. Add one above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {crew.map(member => (
              <li key={member.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${member.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={`text-sm font-medium ${member.active ? 'text-gray-900' : 'text-gray-400'}`}>
                    {member.name}
                  </span>
                  {!member.active && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(member.id)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      member.active
                        ? 'text-gray-600 border border-gray-300 hover:bg-gray-100'
                        : 'text-brand-600 border border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {member.active ? 'Deactivate' : 'Activate'}
                  </button>

                  {confirmDelete === member.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-500">Sure?</span>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-xs px-2.5 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs px-2.5 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(member.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        {crew.filter(c => c.active).length} of {crew.length} crew members active
      </p>
    </div>
  )
}
