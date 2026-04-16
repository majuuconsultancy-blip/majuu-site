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

function generateReferralCode(name, email) {
  const cleanName = String(name ?? '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  const prefix = (cleanName.slice(0, 3) || 'MJU').padEnd(3, 'X')
  const seed = `${name}:${email}:${Date.now()}:${Math.random()}`
  let hash = 0

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  const suffix = hash.toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5)
  return `${prefix}${suffix.padEnd(5, '0')}`
}

export async function createWaitlistSignup({
  name,
  email,
  phoneNumber,
  referredByCode = '',
  source = 'updates_section',
}) {
  const client = requireSupabase()
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedName = name.trim()
  const normalizedPhoneNumber = phoneNumber.trim()
  const normalizedReferredByCode =
    referredByCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || null

  if (!normalizedName || !normalizedEmail || !normalizedPhoneNumber) {
    throw new Error('Name, email, and phone number are required.')
  }

  let error = null
  let referralCode = generateReferralCode(normalizedName, normalizedEmail)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const insertWithSource = await client.from('waitlist_signups').insert({
      full_name: normalizedName,
      email: normalizedEmail,
      phone_number: normalizedPhoneNumber,
      source,
      referral_code: referralCode,
      referred_by_code: normalizedReferredByCode,
    })

    error = insertWithSource.error

    const isReferralCollision =
      error &&
      error.code === '23505' &&
      String(error.message ?? '').toLowerCase().includes('referral_code')

    if (!isReferralCollision) {
      break
    }

    referralCode = generateReferralCode(normalizedName, normalizedEmail)
  }

  const missingSourceColumn =
    error &&
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('source') &&
    error.message.toLowerCase().includes('schema cache')

  if (missingSourceColumn) {
    const fallbackInsert = await client.from('waitlist_signups').insert({
      full_name: normalizedName,
      email: normalizedEmail,
      phone_number: normalizedPhoneNumber,
      referral_code: referralCode,
      referred_by_code: normalizedReferredByCode,
    })

    error = fallbackInsert.error
  }

  const missingWaitlistColumns =
    error &&
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('schema cache') &&
    (error.message.toLowerCase().includes('full_name') ||
      error.message.toLowerCase().includes('phone_number') ||
      error.message.toLowerCase().includes('referral_code'))

  if (missingWaitlistColumns) {
    throw new Error(
      'Waitlist schema is outdated. Run the latest SQL migration in Supabase and try again.',
    )
  }

  if (error && error.code !== '23505') {
    throw error
  }

  if (error?.code === '23505') {
    const { data: existingEntry } = await client
      .from('waitlist_signups')
      .select('referral_code')
      .eq('email', normalizedEmail)
      .maybeSingle()

    return {
      alreadyJoined: true,
      referralCode: existingEntry?.referral_code ?? '',
    }
  }

  return {
    alreadyJoined: false,
    referralCode,
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
