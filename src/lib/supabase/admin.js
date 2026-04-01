import { isSupabaseConfigured, supabase } from './client'

const DOWNLOADS_ENABLED_KEY = 'downloads_enabled'

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.')
  }

  return supabase
}

export async function signInAdmin(email) {
  const client = requireSupabase()
  const normalizedEmail = email.trim().toLowerCase()
  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  })

  if (error) {
    throw error
  }
}

export async function signOutAdmin() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()

  if (error) {
    throw error
  }
}

export async function getAdminSession() {
  const client = requireSupabase()
  const {
    data: { session },
    error,
  } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return session
}

export function onAdminAuthStateChange(callback) {
  const client = requireSupabase()
  return client.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
}

export async function checkAdminAccess() {
  const client = requireSupabase()
  const { data, error } = await client.rpc('is_admin')

  if (error) {
    throw error
  }

  return Boolean(data)
}

export async function getAdminDashboardData() {
  const client = requireSupabase()

  const [metricsResponse, settingsResponse, waitlistResponse, feedbackResponse] =
    await Promise.all([
      client.from('landing_metrics').select('key, value, updated_at').order('key'),
      client.from('landing_settings').select('key, enabled, updated_at').order('key'),
      client
        .from('waitlist_signups')
        .select('id, email, source, created_at')
        .order('created_at', { ascending: false }),
      client
        .from('feedback_entries')
        .select('id, name, email, message, created_at')
        .order('created_at', { ascending: false }),
    ])

  if (metricsResponse.error) {
    throw metricsResponse.error
  }

  if (settingsResponse.error) {
    throw settingsResponse.error
  }

  if (waitlistResponse.error) {
    throw waitlistResponse.error
  }

  if (feedbackResponse.error) {
    throw feedbackResponse.error
  }

  return {
    metrics: metricsResponse.data ?? [],
    settings: settingsResponse.data ?? [],
    waitlist: waitlistResponse.data ?? [],
    feedback: feedbackResponse.data ?? [],
  }
}

export async function setDownloadsEnabled(enabled) {
  const client = requireSupabase()
  const { error } = await client
    .from('landing_settings')
    .update({
      enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('key', DOWNLOADS_ENABLED_KEY)

  if (error) {
    throw error
  }

  return enabled
}
