import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { CREW_MEMBERS, JOB_STATUSES } from '../lib/constants'
import { addOneHour, toISODateString } from '../lib/dateUtils'

export default function JobModal({ isOpen, onClose, onSave, initialData, properties, onPropertiesChange }) {
  const [form, setForm] = useState({
    property_id: '',
    property_name: '',
    job_date: toISODateString(new Date()),
    start_time: '08:00',
    end_time: '09:00',
    crew_name: CREW_MEMBERS[0].name,
    comments: '',
    status: 'scheduled',
  })
  const [propertySearch, setPropertySearch] = useState('')
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showNewPropertyForm, setShowNewPropertyForm] = useState(false)
  const [newProperty, setNewProperty] = useState({ name: '', address: '' })

  useEffect(() => {
    if (isOpen && initialData) {
      setForm(prev => ({
        ...prev,
        ...initialData,
        end_time: initialData.end_time || addOneHour(initialData.start_time),
      }))
      if (initialData.property_id) {
        const prop = properties.find(p => p.id === initialData.property_id)
        if (prop) setPropertySearch(prop.name)
      } else {
        setPropertySearch('')
      }
    }
    if (!isOpen) {
      setError('')
      setShowNewPropertyForm(false)
      setNewProperty({ name: '', address: '' })
    }
  }, [isOpen, initialData, properties])

  const filteredProperties = properties.filter(p =>
    p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.address.toLowerCase().includes(propertySearch.toLowerCase())
  )

  const handlePropertySelect = (prop) => {
    setForm(prev => ({ ...prev, property_id: prop.id, property_name: prop.name }))
    setPropertySearch(prop.name)
    setShowPropertyDropdown(false)
  }

  const handleStartTimeChange = (e) => {
    const start = e.target.value
    setForm(prev => ({
      ...prev,
      start_time: start,
      end_time: addOneHour(start),
    }))
  }

  const handleSave = async () => {
    if (!form.property_id) {
      setError('Please select a property')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save job')
    } finally {
      setSaving(false)
    }
  }

  const handleAddNewProperty = async () => {
    if (!newProperty.name || !newProperty.address) {
      setError('Property name and address are required')
      return
    }
    try {
      if (supabase) {
        const { data, error: dbErr } = await supabase
          .from('properties')
          .insert([newProperty])
          .select()
          .single()
        if (dbErr) throw dbErr
        if (onPropertiesChange) onPropertiesChange()
        handlePropertySelect(data)
      } else {
        // Offline fallback
        const mockProp = { id: `local-${Date.now()}`, ...newProperty }
        handlePropertySelect(mockProp)
      }
      setShowNewPropertyForm(false)
      setNewProperty({ name: '', address: '' })
    } catch (err) {
      setError(err.message || 'Failed to add property')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData?.id ? 'Edit Job' : 'New Job'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Property */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={propertySearch}
              onChange={(e) => {
                setPropertySearch(e.target.value)
                setShowPropertyDropdown(true)
                if (!e.target.value) setForm(prev => ({ ...prev, property_id: '', property_name: '' }))
              }}
              onFocus={() => setShowPropertyDropdown(true)}
              placeholder="Search properties..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
            {showPropertyDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {filteredProperties.map(prop => (
                  <button
                    key={prop.id}
                    onClick={() => handlePropertySelect(prop)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                  >
                    <div className="font-medium">{prop.name}</div>
                    <div className="text-gray-500 text-xs">{prop.address}</div>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowNewPropertyForm(true)
                    setShowPropertyDropdown(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add new property
                </button>
              </div>
            )}
          </div>

          {/* Inline new property form */}
          {showNewPropertyForm && (
            <div className="border border-brand-200 bg-brand-50 rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-brand-800">Quick Add Property</h3>
              <input
                type="text"
                placeholder="Property name *"
                value={newProperty.name}
                onChange={e => setNewProperty(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <input
                type="text"
                placeholder="Address *"
                value={newProperty.address}
                onChange={e => setNewProperty(prev => ({ ...prev, address: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddNewProperty}
                  className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowNewPropertyForm(false)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Date + Times */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={form.job_date}
                onChange={e => setForm(prev => ({ ...prev, job_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                onChange={handleStartTimeChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                onChange={e => setForm(prev => ({ ...prev, end_time: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Crew */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Crew Member</label>
            <select
              value={form.crew_name}
              onChange={e => setForm(prev => ({ ...prev, crew_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {CREW_MEMBERS.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {JOB_STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Comments / Special Instructions</label>
            <textarea
              value={form.comments}
              onChange={e => setForm(prev => ({ ...prev, comments: e.target.value }))}
              rows={3}
              placeholder="Any special instructions or notes..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Job'}
          </button>
        </div>
      </div>

      {/* Click outside */}
      {showPropertyDropdown && (
        <div className="fixed inset-0 z-0" onClick={() => setShowPropertyDropdown(false)} />
      )}
    </div>
  )
}
