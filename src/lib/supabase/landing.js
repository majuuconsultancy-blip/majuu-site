import { isSupabaseConfigured, supabase } from './client'

const APK_DOWNLOAD_KEY = 'apk_downloads'
const SITE_VISITS_KEY = 'site_visits'
const DOWNLOADS_ENABLED_KEY = 'downloads_enabled'

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.')
  }

  return supabase
}

export async function getApkDownloadCount() {
  if (!isSupabaseConfigured || !supabase) {
    return 0
  }

  const { data, error } = await supabase
    .from('landing_metrics')
    .select('value')
    .eq('key', APK_DOWNLOAD_KEY)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Number(data?.value ?? 0)
}

export async function incrementApkDownloadCount() {
  const client = requireSupabase()
  const { data, error } = await client.rpc('increment_landing_metric', {
    metric_key: APK_DOWNLOAD_KEY,
  })

  if (error) {
    throw error
  }

  return Number(data ?? 0)
}

export async function incrementSiteVisitCount() {
  if (!isSupabaseConfigured || !supabase) {
    return 0
  }

  const { data, error } = await supabase.rpc('increment_landing_metric', {
    metric_key: SITE_VISITS_KEY,
  })

  if (error) {
    throw error
  }

  return Number(data ?? 0)
}

export async function getDownloadsEnabled() {
  if (!isSupabaseConfigured || !supabase) {
    return false
  }

  const { data, error } = await supabase
    .from('landing_settings')
    .select('enabled')
    .eq('key', DOWNLOADS_ENABLED_KEY)
    .maybeSingle()

  if (error) {
    throw error
  }

  return Boolean(data?.enabled)
}

export async function createWaitlistSignup(email, source = 'updates_section') {
  const client = requireSupabase()
  const normalizedEmail = email.trim().toLowerCase()
  let error = null

  const insertWithSource = await client.from('waitlist_signups').insert({
    email: normalizedEmail,
    source,
  })

  error = insertWithSource.error

  const missingSourceColumn =
    error &&
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('source') &&
    error.message.toLowerCase().includes('schema cache')

  if (missingSourceColumn) {
    const fallbackInsert = await client.from('waitlist_signups').insert({
      email: normalizedEmail,
    })

    error = fallbackInsert.error
  }

  if (error && error.code !== '23505') {
    throw error
  }

  return {
    alreadyJoined: error?.code === '23505',
  }
}

export async function createFeedbackSubmission({ name, email, message }) {
  const client = requireSupabase()
  const payload = {
    name: name.trim() || null,
    email: email.trim().toLowerCase() || null,
    message: message.trim(),
  }

  const { error } = await client.from('feedback_entries').insert(payload)

  if (error) {
    throw error
  }
}
