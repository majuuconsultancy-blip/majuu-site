import { isSupabaseConfigured, supabase } from './client'

const DOWNLOADS_ENABLED_KEY = 'downloads_enabled'
const adminRedirectUrl =
  import.meta.env.VITE_MAJUU_ADMIN_REDIRECT_URL?.trim() ||
  import.meta.env.VITE_MAJUU_SITE_URL?.trim()
const configuredAdminEmail =
  import.meta.env.VITE_MAJUU_ADMIN_EMAIL?.trim().toLowerCase() ||
  'brioneroo@gmail.com'

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured yet.')
  }

  return supabase
}

function isMissingAdminFunctionError(error) {
  return (
    typeof error?.message === 'string' &&
    error.message.toLowerCase().includes('public.is_admin')
  )
}

function isMissingSourceColumnError(error) {
  return (
    typeof error?.message === 'string' &&
    error.message.toLowerCase().includes('source') &&
    error.message.toLowerCase().includes('schema cache')
  )
}

function isMissingRelationError(error) {
  return (
    typeof error?.message === 'string' &&
    error.message.toLowerCase().includes('relation') &&
    error.message.toLowerCase().includes('does not exist')
  )
}

function isPermissionError(error) {
  return (
    typeof error?.message === 'string' &&
    (error.message.toLowerCase().includes('permission denied') ||
      error.message.toLowerCase().includes('row-level security') ||
      error.message.toLowerCase().includes('new row violates row-level security'))
  )
}

function isAdminSetupError(error) {
  return (
    isMissingAdminFunctionError(error) ||
    isMissingRelationError(error) ||
    isPermissionError(error)
  )
}

async function getSessionEmail() {
  const client = requireSupabase()
  const {
    data: { session },
    error,
  } = await client.auth.getSession()

  if (error) {
    throw error
  }

  return session?.user?.email?.toLowerCase() ?? ''
}

export async function signInAdmin(email) {
  const client = requireSupabase()
  const normalizedEmail = email.trim().toLowerCase()
  const emailRedirectTo = adminRedirectUrl
    ? new URL('/admin', adminRedirectUrl).toString()
    : `${window.location.origin}/admin`

  const { error } = await client.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo,
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
  const signedInEmail = await getSessionEmail()

  if (!signedInEmail) {
    return {
      authorized: false,
      mode: 'secure',
      missingSetup: false,
    }
  }

  if (signedInEmail === configuredAdminEmail) {
    try {
      const { data, error } = await client.rpc('is_admin')

      if (error) {
        throw error
      }

      return {
        authorized: true,
        mode: data ? 'secure' : 'fallback',
        missingSetup: !data,
      }
    } catch {
      return {
        authorized: true,
        mode: 'fallback',
        missingSetup: true,
      }
    }
  }

  try {
    const { data, error } = await client.rpc('is_admin')

    if (error) {
      throw error
    }

    return {
      authorized: Boolean(data),
      mode: 'secure',
      missingSetup: false,
    }
  } catch (error) {
    if (!isMissingAdminFunctionError(error)) {
      throw error
    }

    return {
      authorized: signedInEmail === configuredAdminEmail,
      mode: 'fallback',
      missingSetup: true,
    }
  }
}

export async function getAdminDashboardData() {
  const client = requireSupabase()
  const issues = []

  const metricsResponse = await client
    .from('landing_metrics')
    .select('key, value, updated_at')
    .order('key')

  if (metricsResponse.error) {
    throw metricsResponse.error
  }

  let settings = []
  const settingsResponse = await client
    .from('landing_settings')
    .select('key, enabled, updated_at')
    .order('key')

  if (settingsResponse.error) {
    if (isAdminSetupError(settingsResponse.error)) {
      issues.push(
        'Landing settings are not fully set up yet, so the download toggle is temporarily unavailable.',
      )
    } else {
      throw settingsResponse.error
    }
  } else {
    settings = settingsResponse.data ?? []
  }

  let waitlist = []
  const waitlistResponse = await client
    .from('waitlist_signups')
    .select('id, email, source, created_at')
    .order('created_at', { ascending: false })

  if (waitlistResponse.error) {
    if (isMissingSourceColumnError(waitlistResponse.error)) {
      const fallbackWaitlistResponse = await client
        .from('waitlist_signups')
        .select('id, email, created_at')
        .order('created_at', { ascending: false })

      if (fallbackWaitlistResponse.error) {
        if (isAdminSetupError(fallbackWaitlistResponse.error)) {
          issues.push(
            'Waitlist exports are not fully enabled until the admin SQL migration is applied in Supabase.',
          )
        } else {
          throw fallbackWaitlistResponse.error
        }
      } else {
        waitlist = (fallbackWaitlistResponse.data ?? []).map((entry) => ({
          ...entry,
          source: 'legacy',
        }))
        issues.push(
          'Waitlist source tracking is in legacy mode until the admin SQL migration is applied.',
        )
      }
    } else if (isAdminSetupError(waitlistResponse.error)) {
      issues.push(
        'Waitlist exports are not fully enabled until the admin SQL migration is applied in Supabase.',
      )
    } else {
      throw waitlistResponse.error
    }
  } else {
    waitlist = waitlistResponse.data ?? []
  }

  let feedback = []
  const feedbackResponse = await client
    .from('feedback_entries')
    .select('id, name, email, message, created_at')
    .order('created_at', { ascending: false })

  if (feedbackResponse.error) {
    if (isAdminSetupError(feedbackResponse.error)) {
      issues.push(
        'Feedback visibility is limited until the admin SQL migration is applied in Supabase.',
      )
    } else {
      throw feedbackResponse.error
    }
  } else {
    feedback = feedbackResponse.data ?? []
  }

  return {
    metrics: metricsResponse.data ?? [],
    settings,
    waitlist,
    feedback,
    issues,
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
    if (isAdminSetupError(error)) {
      throw new Error(
        'The download toggle is not ready yet. Run the admin SQL migration in Supabase, then refresh the dashboard.',
      )
    }

    throw error
  }

  return enabled
}
