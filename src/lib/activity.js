import { supabase } from './supabase'

/**
 * Log an activity to the activity_log table
 * @param {string} action - The action type (e.g., 'job_created', 'property_updated')
 * @param {string} entityType - The entity type ('job', 'property', 'crew', 'user')
 * @param {string} entityId - The ID of the affected entity (optional)
 * @param {string} description - Human-readable description of the action
 * @param {object} metadata - Additional metadata (optional)
 */
export async function logActivity(action, entityType, entityId, description, metadata = {}) {
  if (!supabase) {
    console.log('[Activity]', action, entityType, description)
    return
  }

  try {
    const { error } = await supabase.from('activity_log').insert([{
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      metadata,
      created_at: new Date().toISOString(),
    }])
    if (error) console.warn('Failed to log activity:', error.message)
  } catch (e) {
    console.warn('Activity logging error:', e.message)
  }
}

/**
 * Fetch recent activity logs
 * @param {number} limit - Number of logs to fetch
 * @returns {Promise<Array>} Array of activity log entries
 */
export async function getActivityLogs(limit = 100) {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (e) {
    console.warn('Failed to fetch activity logs:', e.message)
    return []
  }
}

// Action types for consistency
export const ACTIONS = {
  // Jobs
  JOB_CREATED: 'job_created',
  JOB_UPDATED: 'job_updated',
  JOB_DELETED: 'job_deleted',
  JOB_STATUS_CHANGED: 'job_status_changed',
  // Properties
  PROPERTY_CREATED: 'property_created',
  PROPERTY_UPDATED: 'property_updated',
  PROPERTY_DELETED: 'property_deleted',
  // Crew
  CREW_ADDED: 'crew_added',
  CREW_DELETED: 'crew_deleted',
  CREW_ACTIVATED: 'crew_activated',
  CREW_DEACTIVATED: 'crew_deactivated',
  // User
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PASSWORD_CHANGED: 'password_changed',
}
