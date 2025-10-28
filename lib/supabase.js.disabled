import { createClient } from '@supabase/supabase-js'

const supabaseUrl = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : ''

const supabaseAnonKey = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : ''

// Only create client if both values exist
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
