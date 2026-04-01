import { useEffect, useMemo, useState } from 'react'
import {
  checkAdminAccess,
  getAdminDashboardData,
  getAdminSession,
  onAdminAuthStateChange,
  setDownloadsEnabled,
  signInAdmin,
  signOutAdmin,
} from '../../lib/supabase/admin'
import { isSupabaseConfigured } from '../../lib/supabase/client'

const adminEmailDefault =
  import.meta.env.VITE_MAJUU_ADMIN_EMAIL?.trim() || 'majuuapp@gmail.com'

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function MetricCard({ label, value, hint = '' }) {
  return (
    <article className="surface-panel rounded-[1.7rem] p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
        {value}
      </p>
      {hint && <p className="mt-2 text-sm leading-6 text-slate-500">{hint}</p>}
    </article>
  )
}

export function AdminApp() {
  const [email, setEmail] = useState(adminEmailDefault)
  const [session, setSession] = useState(null)
  const [authState, setAuthState] = useState('loading')
  const [accessState, setAccessState] = useState('idle')
  const [message, setMessage] = useState({ type: 'idle', text: '' })
  const [dashboard, setDashboard] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTogglingDownloads, setIsTogglingDownloads] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState('misconfigured')
      return undefined
    }

    let isMounted = true

    getAdminSession()
      .then((nextSession) => {
        if (isMounted) {
          setSession(nextSession)
          setAuthState('ready')
        }
      })
      .catch((error) => {
        if (isMounted) {
          setAuthState('error')
          setMessage({
            type: 'error',
            text: error.message || 'We could not load the admin session.',
          })
        }
      })

    const {
      data: { subscription },
    } = onAdminAuthStateChange((nextSession) => {
      setSession(nextSession)
      setAuthState('ready')
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const loadDashboard = async () => {
    setAccessState('loading')
    const isAdmin = await checkAdminAccess()

    if (!isAdmin) {
      setAccessState('denied')
      setDashboard(null)
      return
    }

    const data = await getAdminDashboardData()
    setDashboard(data)
    setAccessState('authorized')
  }

  useEffect(() => {
    if (!session) {
      setAccessState('idle')
      setDashboard(null)
      return
    }

    let cancelled = false

    const hydrate = async () => {
      try {
        await loadDashboard()
      } catch (error) {
        if (!cancelled) {
          setAccessState('error')
          setMessage({
            type: 'error',
            text: error.message || 'We could not load admin data.',
          })
        }
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [session])

  const metrics = useMemo(() => {
    const metricMap = new Map(
      (dashboard?.metrics ?? []).map((item) => [item.key, Number(item.value ?? 0)]),
    )

    const waitlist = dashboard?.waitlist ?? []
    const feedback = dashboard?.feedback ?? []

    return {
      siteVisits: metricMap.get('site_visits') ?? 0,
      apkDownloads: metricMap.get('apk_downloads') ?? 0,
      waitlistTotal: waitlist.length,
      waitlistModal: waitlist.filter((item) => item.source === 'download_notice').length,
      updatesForm: waitlist.filter((item) => item.source !== 'download_notice').length,
      feedbackTotal: feedback.length,
    }
  }, [dashboard])

  const downloadsEnabled =
    dashboard?.settings?.find((item) => item.key === 'downloads_enabled')?.enabled ?? false

  const handleSendMagicLink = async (event) => {
    event.preventDefault()
    setMessage({ type: 'loading', text: '' })

    try {
      await signInAdmin(email)
      setMessage({
        type: 'success',
        text: 'Magic link sent. Open it from your email to access the admin area.',
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'We could not send the admin login link.',
      })
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setMessage({ type: 'idle', text: '' })

    try {
      await loadDashboard()
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'We could not refresh admin data.',
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleToggleDownloads = async () => {
    setIsTogglingDownloads(true)
    setMessage({ type: 'idle', text: '' })

    try {
      await setDownloadsEnabled(!downloadsEnabled)
      await loadDashboard()
      setMessage({
        type: 'success',
        text: !downloadsEnabled
          ? 'APK downloads are now live on the landing page.'
          : 'APK downloads are now gated behind the waitlist modal.',
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'We could not update the download toggle.',
      })
    } finally {
      setIsTogglingDownloads(false)
    }
  }

  const handleSignOut = async () => {
    await signOutAdmin()
    setMessage({ type: 'idle', text: '' })
  }

  if (authState === 'misconfigured') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
        <div className="surface-panel w-full rounded-[2rem] p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Admin Setup Needed
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Supabase is not configured in this environment yet, so the admin
            area cannot connect.
          </p>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
        <div className="surface-panel w-full rounded-[2rem] p-6 sm:p-8">
          <p className="eyebrow text-xs font-semibold uppercase">MAJUU Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Sign in to the admin dashboard
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Use your admin email and we will send you a secure magic link to
            open the dashboard.
          </p>

          <form className="mt-6 space-y-3" onSubmit={handleSendMagicLink}>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Admin email"
              className="min-h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
            />
            <button
              type="submit"
              disabled={message.type === 'loading'}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-80"
            >
              {message.type === 'loading' ? 'Sending link...' : 'Send magic link'}
            </button>
          </form>

          {message.text && (
            <p
              className={`mt-4 text-sm ${
                message.type === 'error' ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {message.text}
            </p>
          )}
        </div>
      </main>
    )
  }

  if (accessState === 'loading' || authState === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-12 sm:px-6">
        <p className="text-base text-slate-600">Loading admin dashboard…</p>
      </main>
    )
  }

  if (accessState === 'denied') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
        <div className="surface-panel w-full rounded-[2rem] p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Access not allowed
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700">
            This signed-in email is not on the MAJUU admin list.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow text-xs font-semibold uppercase">MAJUU Admin</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Dashboard
          </h1>
          <p className="mt-3 text-base leading-8 text-slate-700">
            Signed in as {session.user.email}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-80"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </div>

      {message.text && (
        <p
          className={`mt-5 text-sm ${
            message.type === 'error' ? 'text-rose-600' : 'text-emerald-700'
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visitors"
          value={new Intl.NumberFormat().format(metrics.siteVisits)}
          hint="Approximate unique browsers tracked locally"
        />
        <MetricCard
          label="APK downloads"
          value={new Intl.NumberFormat().format(metrics.apkDownloads)}
        />
        <MetricCard
          label="Waitlist / updates"
          value={new Intl.NumberFormat().format(metrics.waitlistTotal)}
          hint={`${metrics.waitlistModal} from download modal • ${metrics.updatesForm} from updates form`}
        />
        <MetricCard
          label="Feedback messages"
          value={new Intl.NumberFormat().format(metrics.feedbackTotal)}
        />
      </section>

      <section className="mt-6 surface-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-xs font-semibold uppercase">Download control</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
              APK CTA toggle
            </h2>
            <p className="mt-3 text-base leading-8 text-slate-700">
              Downloads are currently{' '}
              <span className="font-semibold text-emerald-700">
                {downloadsEnabled ? 'enabled' : 'disabled'}
              </span>
              .
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggleDownloads}
            disabled={isTogglingDownloads}
            className={`inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-white transition disabled:cursor-wait disabled:opacity-80 ${
              downloadsEnabled ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            {isTogglingDownloads
              ? 'Saving…'
              : downloadsEnabled
                ? 'Disable downloads'
                : 'Enable downloads'}
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="surface-panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Waitlist and update signups
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            These emails can be used later for launch communication and product
            updates.
          </p>

          <div className="mt-6 space-y-3">
            {(dashboard?.waitlist ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No signups yet.</p>
            ) : (
              dashboard.waitlist.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.25rem] border border-slate-900/8 bg-white/80 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{entry.email}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Source:{' '}
                        <span className="capitalize text-slate-700">
                          {entry.source?.replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">{formatDate(entry.created_at)}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="surface-panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Feedback
          </h2>
          <div className="mt-6 space-y-3">
            {(dashboard?.feedback ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">No feedback yet.</p>
            ) : (
              dashboard.feedback.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.25rem] border border-slate-900/8 bg-white/80 p-4"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-slate-900">
                      {entry.name || 'Anonymous'}
                    </p>
                    {entry.email && (
                      <p className="text-sm text-slate-500">{entry.email}</p>
                    )}
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {entry.message}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
