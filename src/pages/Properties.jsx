import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const EMPTY_FORM = {
  name: '',
  address: '',
  phone: '',
  property_manager_name: '',
  property_manager_phone: '',
  maintenance_supervisor_name: '',
  maintenance_supervisor_phone: '',
  management_company: '',
  unit_count: '',
  standing_directions: '',
}

function PropertyModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
      setError('')
    }
  }, [isOpen, initialData])

  const handleSave = async () => {
    if (!form.name || !form.address) {
      setError('Property name and address are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const field = (label, key, type = 'text', required = false) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData?.id ? 'Edit Property' : 'Add Property'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {field('Property Name', 'name', 'text', true)}
          {field('Address', 'address', 'text', true)}
          {field('Phone', 'phone', 'tel')}

          <div className="grid grid-cols-2 gap-3">
            {field('Property Manager', 'property_manager_name')}
            {field('Manager Phone', 'property_manager_phone', 'tel')}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Maintenance Supervisor', 'maintenance_supervisor_name')}
            {field('Supervisor Phone', 'maintenance_supervisor_phone', 'tel')}
          </div>

          {field('Management Company', 'management_company')}
          {field('Unit Count', 'unit_count', 'number')}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Standing Directions / Notes</label>
            <textarea
              value={form.standing_directions}
              onChange={e => setForm(prev => ({ ...prev, standing_directions: e.target.value }))}
              rows={3}
              placeholder="Standing instructions that print on every job at this property..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Property'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Properties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    if (!supabase) return
    setLoading(true)
    try {
      const { data, error } = await supabase.from('properties').select('*').order('name')
      if (!error) setProperties(data || [])
    } catch (e) {
      console.warn('Could not load properties:', e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (form) => {
    if (!supabase) {
      if (form.id) {
        setProperties(prev => prev.map(p => p.id === form.id ? { ...p, ...form } : p))
      } else {
        setProperties(prev => [...prev, { id: `local-${Date.now()}`, ...form }])
      }
      return
    }
    if (form.id) {
      const { error } = await supabase
        .from('properties')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', form.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('properties').insert([form])
      if (error) throw error
    }
    await load()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this property? This cannot be undone.')) return
    if (!supabase) {
      setProperties(prev => prev.filter(p => p.id !== id))
      return
    }
    const { error } = await supabase.from('properties').delete().eq('id', id)
    if (!error) setProperties(prev => prev.filter(p => p.id !== id))
  }

  const filtered = properties.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.address.toLowerCase().includes(search.toLowerCase()) ||
    (p.management_company || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-500 text-sm mt-0.5">{properties.length} properties</p>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Property
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin w-6 h-6 text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-sm">{search ? 'No properties match your search' : 'No properties yet. Add your first one!'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prop => (
            <div key={prop.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-brand-200 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900">{prop.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{prop.address}</p>

                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {prop.phone && (
                      <span className="text-xs text-gray-500">📞 {prop.phone}</span>
                    )}
                    {prop.management_company && (
                      <span className="text-xs text-gray-500">🏢 {prop.management_company}</span>
                    )}
                    {prop.unit_count && (
                      <span className="text-xs text-gray-500">🏠 {prop.unit_count} units</span>
                    )}
                  </div>

                  {(prop.property_manager_name || prop.maintenance_supervisor_name) && (
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                      {prop.property_manager_name && (
                        <span className="text-xs text-gray-500">
                          Mgr: {prop.property_manager_name}
                          {prop.property_manager_phone && ` · ${prop.property_manager_phone}`}
                        </span>
                      )}
                      {prop.maintenance_supervisor_name && (
                        <span className="text-xs text-gray-500">
                          Maint: {prop.maintenance_supervisor_name}
                          {prop.maintenance_supervisor_phone && ` · ${prop.maintenance_supervisor_phone}`}
                        </span>
                      )}
                    </div>
                  )}

                  {prop.standing_directions && (
                    <p className="mt-2 text-xs text-gray-400 italic truncate">
                      📋 {prop.standing_directions}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(prop); setModalOpen(true) }}
                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(prop.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PropertyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initialData={editing}
      />
    </div>
  )
}
