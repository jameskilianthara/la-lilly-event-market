import { supabase } from './supabase'

export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('events').select('*').limit(1)

    if (error) {
      console.error('Supabase connection error:', error.message)
      return false
    }

    console.log('Supabase connected successfully')
    return true
  } catch (err) {
    console.error('Supabase connection failed:', err.message)
    return false
  }
}
