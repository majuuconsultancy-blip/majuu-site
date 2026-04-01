import { createElement, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Download,
  LogOut,
  MessageSquare,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Users,
} from 'lucide-react'
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

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value ?? 0))
}

function escapeCsvValue(value) {
  const stringValue = String(value ?? '')
  return `"${stringValue.replace(/"/g, '""')}"`
}

function downloadCsv(filename, rows) {
  if (!rows.length || typeof document === 'undefined') {
    return
  }

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(',')),
  ]

  const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function buildWaitlistCsvRows(entries) {
  return entries.map((entry) => ({
    email: entry.email ?? '',
    source: entry.source ?? 'legacy',
    created_at: entry.created_at ?? '',
  }))
}

function buildFeedbackCsvRows(entries) {
  return entries.map((entry) => ({
    name: entry.name ?? '',
    email: entry.email ?? '',
    message: entry.message ?? '',
    created_at: entry.created_at ?? '',
  }))
}

function buildFeedbackContactsCsvRows(entries) {
  return entries
    .filter((entry) => entry.email)
    .map((entry) => ({
      name: entry.name ?? '',
      email: entry.email ?? '',
      created_at: entry.created_at ?? '',
    }))
}

function StatusChip({ icon, tone = 'neutral', children }) {
  const toneClassName =
    tone === 'emerald'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-slate-200 bg-white/84 text-slate-700'

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClassName}`}
    >
      {createElement(icon, { className: 'h-3.5 w-3.5' })}
      <span>{children}</span>
    </div>
  )
}

function OverviewMetric({ icon, label, value, hint, tone = 'neutral' }) {
  const accentClassName =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
      : tone === 'rose'
        ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
        : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'

  return (
    <article className="rounded-[1.6rem] border border-white/75 bg-white/92 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-[2rem]">
            {value}
          </p>
        </div>
        <div className={`rounded-2xl p-3 ${accentClassName}`}>
          {createElement(icon, { className: 'h-5 w-5' })}
        </div>
      </div>
      {hint && <p className="mt-3 text-sm leading-6 text-slate-500">{hint}</p>}
    </article>
  )
}

function ExportButton({ disabled, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-10 items-center justify-center rounded-full border border-slate-900/10 bg-white px-4 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function SectionCard({ title, description, actions, children }) {
  return (
    <section className="surface-panel rounded-[2rem] p-6 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            {title}
          </h2>
          {description && (
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              {description}
            </p>
          )}
        </div>

        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  )
}

export function AdminApp() {
  const [email, setEmail] = useState('')
  const [session, setSession] = useState(null)
  const [authState, setAuthState] = useState('loading')
  const [accessState, setAccessState] = useState('idle')
  const [message, setMessage] = useState({ type: 'idle', text: '' })
  const [dashboard, setDashboard] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTogglingDownloads, setIsTogglingDownloads] = useState(false)
  const [adminMode, setAdminMode] = useState('secure')
  const [setupRequired, setSetupRequired] = useState(false)

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

    const access = await checkAdminAccess()
    setAdminMode(access.mode)
    setSetupRequired(access.missingSetup)

    if (!access.authorized) {
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

  const waitlistEntries = useMemo(() => dashboard?.waitlist ?? [], [dashboard])
  const feedbackEntries = useMemo(() => dashboard?.feedback ?? [], [dashboard])
  const dashboardIssues = useMemo(() => dashboard?.issues ?? [], [dashboard])

  const metrics = useMemo(() => {
    const metricMap = new Map(
      (dashboard?.metrics ?? []).map((item) => [item.key, Number(item.value ?? 0)]),
    )

    const modalWaitlistCount = waitlistEntries.filter(
      (item) => item.source === 'download_notice',
    ).length
    const updatesWaitlistCount = waitlistEntries.filter(
      (item) => item.source === 'updates_section' || item.source === 'legacy',
    ).length
    const feedbackWithEmail = feedbackEntries.filter((item) => item.email).length

    return {
      siteVisits: metricMap.get('site_visits') ?? 0,
      apkDownloads: metricMap.get('apk_downloads') ?? 0,
      waitlistTotal: waitlistEntries.length,
      modalWaitlistCount,
      updatesWaitlistCount,
      feedbackTotal: feedbackEntries.length,
      feedbackWithEmail,
    }
  }, [dashboard, feedbackEntries, waitlistEntries])

  const latestActivityLabel = useMemo(() => {
    const timestamps = [
      ...(dashboard?.metrics ?? []).map((item) => item.updated_at),
      ...(dashboard?.settings ?? []).map((item) => item.updated_at),
      ...(waitlistEntries ?? []).map((item) => item.created_at),
      ...(feedbackEntries ?? []).map((item) => item.created_at),
    ]
      .filter(Boolean)
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value))

    if (!timestamps.length) {
      return 'No activity yet'
    }

    return formatDate(new Date(Math.max(...timestamps)).toISOString())
  }, [dashboard, feedbackEntries, waitlistEntries])

  const downloadsEnabled =
    dashboard?.settings?.find((item) => item.key === 'downloads_enabled')?.enabled ?? false
  const canToggleDownloads =
    dashboard?.settings?.some((item) => item.key === 'downloads_enabled') ?? false

  const handleSendMagicLink = async (event) => {
    event.preventDefault()
    setMessage({ type: 'loading', text: '' })

    try {
      await signInAdmin(email)
      setMessage({
        type: 'success',
        text: 'Magic link sent. Open it from your email to access the admin dashboard.',
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

  const handleExportAllWaitlist = () => {
    downloadCsv('majuu-waitlist-all.csv', buildWaitlistCsvRows(waitlistEntries))
  }

  const handleExportModalWaitlist = () => {
    downloadCsv(
      'majuu-waitlist-download-modal.csv',
      buildWaitlistCsvRows(
        waitlistEntries.filter((entry) => entry.source === 'download_notice'),
      ),
    )
  }

  const handleExportUpdatesWaitlist = () => {
    downloadCsv(
      'majuu-waitlist-updates-form.csv',
      buildWaitlistCsvRows(
        waitlistEntries.filter(
          (entry) => entry.source === 'updates_section' || entry.source === 'legacy',
        ),
      ),
    )
  }

  const handleExportFeedback = () => {
    downloadCsv('majuu-feedback.csv', buildFeedbackCsvRows(feedbackEntries))
  }

  const handleExportFeedbackContacts = () => {
    downloadCsv(
      'majuu-feedback-contacts.csv',
      buildFeedbackContactsCsvRows(feedbackEntries),
    )
  }

  if (authState === 'misconfigured') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
        <div className="surface-panel w-full rounded-[2rem] p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Admin setup needed
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Supabase is not configured in this environment yet, so the admin area
            cannot connect.
          </p>
        </div>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
        <div className="surface-panel w-full rounded-[2.2rem] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            MAJUU Admin
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            Sign in to the admin dashboard
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700">
            Enter your admin email and we will send you a secure magic link to open
            the dashboard.
          </p>

          <form className="mt-6 space-y-3" onSubmit={handleSendMagicLink}>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter admin email"
              autoComplete="email"
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
        <p className="text-base text-slate-600">Loading admin dashboard...</p>
      </main>
    )
  }

  if (accessState === 'error') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12 sm:px-6">
        <div className="surface-panel w-full rounded-[2rem] p-6 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            We hit an admin setup problem
          </h1>
          <p className="mt-4 text-base leading-8 text-slate-700">
            {message.text || 'The admin dashboard could not load right now.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
            >
              Try again
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
      <section className="rounded-[2.4rem] border border-slate-900/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,249,246,0.94))] p-6 shadow-[0_26px_90px_rgba(15,23,42,0.08)] sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-2">
              <StatusChip icon={Activity} tone="emerald">
                Live metrics
              </StatusChip>
              <StatusChip
                icon={adminMode === 'secure' ? ShieldCheck : TriangleAlert}
                tone={adminMode === 'secure' ? 'emerald' : 'amber'}
              >
                {adminMode === 'secure'
                  ? 'Secure admin access'
                  : 'Fallback admin access'}
              </StatusChip>
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
              Metrics dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-700">
              A read-only pulse of MAJUU traffic, downloads, signups, and feedback,
              with lightweight controls for launch readiness.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
              <span>Last activity: {latestActivityLabel}</span>
              <span>Session active</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-900/10 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-80"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-900/10 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewMetric
            icon={Users}
            label="Visitors"
            value={formatNumber(metrics.siteVisits)}
            hint="Approximate unique browsers counted from the landing page."
          />
          <OverviewMetric
            icon={Download}
            label="APK downloads"
            value={formatNumber(metrics.apkDownloads)}
            hint={
              metrics.siteVisits > 0
                ? `${Math.round((metrics.apkDownloads / metrics.siteVisits) * 100)}% of recorded visits`
                : 'Waiting for the first tracked download'
            }
            tone="emerald"
          />
          <OverviewMetric
            icon={Activity}
            label="Waitlist and updates"
            value={formatNumber(metrics.waitlistTotal)}
            hint={`${formatNumber(metrics.modalWaitlistCount)} from the download modal / ${formatNumber(metrics.updatesWaitlistCount)} from the updates form`}
            tone="emerald"
          />
          <OverviewMetric
            icon={MessageSquare}
            label="Feedback"
            value={formatNumber(metrics.feedbackTotal)}
            hint={`${formatNumber(metrics.feedbackWithEmail)} feedback entries include an email address`}
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.6rem] border border-emerald-100 bg-emerald-50/70 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-800">
              Funnel snapshot
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <span className="rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                {formatNumber(metrics.siteVisits)} visitors
              </span>
              <span className="text-slate-300">/</span>
              <span className="rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                {formatNumber(metrics.apkDownloads)} downloads
              </span>
              <span className="text-slate-300">/</span>
              <span className="rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                {formatNumber(metrics.waitlistTotal)} signups
              </span>
              <span className="text-slate-300">/</span>
              <span className="rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
                {formatNumber(metrics.feedbackTotal)} feedback
              </span>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-900/8 bg-white/86 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Download status
            </p>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold tracking-[-0.04em] text-slate-950">
                  {downloadsEnabled ? 'Downloads are live' : 'Downloads are gated'}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {downloadsEnabled
                    ? 'Visitors can download the APK directly from the landing page.'
                    : 'Visitors see the tester notice modal and can join the waitlist.'}
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  downloadsEnabled
                    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
                    : 'bg-amber-50 text-amber-900 ring-1 ring-amber-100'
                }`}
              >
                {downloadsEnabled ? 'Live' : 'Paused'}
              </div>
            </div>
          </div>
        </div>

        {(setupRequired || dashboardIssues.length > 0) && (
          <div className="mt-6 rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Admin setup is not fully complete yet.</p>
                <p className="mt-2 leading-7">
                  The dashboard is running in a safe fallback mode. Run the Supabase
                  admin migration, then refresh this page to unlock secure table access
                  and the download toggle.
                </p>
                {dashboardIssues.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {dashboardIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {message.text && (
          <p
            className={`mt-5 text-sm ${
              message.type === 'error' ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      <section className="mt-6 surface-panel rounded-[2rem] p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Launch control
            </p>
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
            disabled={!canToggleDownloads || isTogglingDownloads}
            className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              downloadsEnabled
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            <Settings className="h-4 w-4" />
            {isTogglingDownloads
              ? 'Saving...'
              : downloadsEnabled
                ? 'Disable downloads'
                : 'Enable downloads'}
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard
          title="Waitlist and update signups"
          description="Export these lists separately for launch announcements and update follow-ups."
          actions={
            <>
              <ExportButton
                onClick={handleExportAllWaitlist}
                disabled={waitlistEntries.length === 0}
              >
                Export all
              </ExportButton>
              <ExportButton
                onClick={handleExportModalWaitlist}
                disabled={
                  !waitlistEntries.some((entry) => entry.source === 'download_notice')
                }
              >
                Export modal waitlist
              </ExportButton>
              <ExportButton
                onClick={handleExportUpdatesWaitlist}
                disabled={
                  !waitlistEntries.some(
                    (entry) =>
                      entry.source === 'updates_section' || entry.source === 'legacy',
                  )
                }
              >
                Export updates form
              </ExportButton>
            </>
          }
        >
          <div className="space-y-3">
            {waitlistEntries.length === 0 ? (
              <p className="text-sm text-slate-500">No signups yet.</p>
            ) : (
              waitlistEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.25rem] border border-slate-900/8 bg-white/84 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{entry.email}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Source:{' '}
                        <span className="capitalize text-slate-700">
                          {String(entry.source ?? 'legacy').replaceAll('_', ' ')}
                        </span>
                      </p>
                    </div>
                    <p className="text-sm text-slate-500">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Feedback"
          description="Export full feedback or only the contacts that included an email address."
          actions={
            <>
              <ExportButton
                onClick={handleExportFeedback}
                disabled={feedbackEntries.length === 0}
              >
                Export feedback
              </ExportButton>
              <ExportButton
                onClick={handleExportFeedbackContacts}
                disabled={!feedbackEntries.some((entry) => entry.email)}
              >
                Export feedback contacts
              </ExportButton>
            </>
          }
        >
          <div className="space-y-3">
            {feedbackEntries.length === 0 ? (
              <p className="text-sm text-slate-500">No feedback yet.</p>
            ) : (
              feedbackEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-[1.25rem] border border-slate-900/8 bg-white/84 p-4"
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
        </SectionCard>
      </section>
    </main>
  )
}
