import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True when both env vars are present; pages show a "backend not configured" notice otherwise. */
export const isConfigured = Boolean(url && anonKey)

// Fall back to harmless placeholders so the module import never throws; calls fail gracefully
// and the UI checks `isConfigured` before hitting the API.
export const supabase = createClient(url ?? 'https://placeholder.supabase.co', anonKey ?? 'placeholder')
