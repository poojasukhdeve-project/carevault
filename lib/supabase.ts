import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Validate URL format
const isValidUrl = (url: string) => {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && url.includes('supabase.co')
  } catch {
    return false
  }
}

// Check if Supabase is properly configured
const isSupabaseConfigured = 
  isValidUrl(supabaseUrl) && 
  supabaseAnonKey && 
  supabaseAnonKey.length > 20

// Create Supabase client with error handling
export const supabase = (() => {
  if (!isSupabaseConfigured) {
    console.warn('Supabase not configured. Check your .env.local file.')
    return null
  }
  try {
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
})()

export { isSupabaseConfigured }
