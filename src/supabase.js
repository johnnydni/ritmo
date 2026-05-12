import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export const isSupabaseReady = !!supabase

// ─── Session (host publishes, remote reads) ─────────────────────
export async function publishSession(pin, data) {
  if (!supabase) return
  await supabase.from('ritmo_sessions').upsert(
    { pin, data, updated_at: new Date().toISOString() },
    { onConflict: 'pin' }
  )
}

export async function fetchSession(pin) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('ritmo_sessions')
    .select('data')
    .eq('pin', pin)
    .single()
  if (error || !data) return null
  return data.data
}

// ─── Submissions (remote writes, host reads) ─────────────────────
export async function submitScore(pin, courtId, sA, sB) {
  if (!supabase) return
  await supabase.from('ritmo_submissions').upsert(
    { pin, court_id: courtId, score_a: sA, score_b: sB, updated_at: new Date().toISOString() },
    { onConflict: 'pin,court_id' }
  )
}

export async function fetchSubmissions(pin) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('ritmo_submissions')
    .select('court_id, score_a, score_b, updated_at')
    .eq('pin', pin)
  if (error || !data) return []
  return data
}

export async function clearSubmissions(pin) {
  if (!supabase) return
  await supabase.from('ritmo_submissions').delete().eq('pin', pin)
}
