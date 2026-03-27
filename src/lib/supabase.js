import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder-key'

let supabase = null

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
} catch (err) {
  console.warn('Supabase client could not be initialized:', err.message)
}

export { supabase }
export default supabase
