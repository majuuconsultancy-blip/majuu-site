import { isSupabaseConfigured, supabase } from './client'

const APK_DOWNLOAD_KEY = 'apk_downloads'

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

export async function createWaitlistSignup(email) {
  const client = requireSupabase()
  const normalizedEmail = email.trim().toLowerCase()
  const { error } = await client.from('waitlist_signups').insert({
    email: normalizedEmail,
  })

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

