import { createElement, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
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

function mapAdminErrorMessage(error, fallbackMessage) {
  const rawMessage = String(error?.message ?? '').toLowerCase()

  if (rawMessage.includes('public.is_admin') || rawMessage.includes('is_admin')) {
    return (
      'Admin policies are not fully initialized yet. Run the admin SQL migration in Supabase and refresh this page.'
    )
  }

  if (rawMessage.includes('schema cache')) {
    return (
      'Supabase schema is still catching up after recent changes. Wait a few seconds and refresh the admin page.'
    )
  }

  return error?.message || fallbackMessage
}

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

function StatusChip({ icon: Icon, tone = 'neutral', children }) {
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
      {createElement(Icon, { className: 'h-3.5 w-3.5' })}
      <span>{children}</span>
    </div>
  )
}

function GraphBars({ items }) {
  const maxValue = Math.max(...items.map((item) => item.value), 1)

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.key}>
          <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
            <span>{item.label}</span>
            <span className="font-medium text-slate-700">{formatNumber(item.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${item.barClass}`}
              style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function ConversionRing({ visitors, downloads }) {
  const ratio = visitors > 0 ? (downloads / visitors) * 100 : 0
  const clampedRatio = Math.max(0, Math.min(100, ratio))
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clampedRatio / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      <div className="relative h-30 w-30">
        <svg viewBox="0 0 120 120" className="h-30 w-30 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(15,23,42,0.08)"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="url(#conversionGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
          <defs>
            <linearGradient id="conversionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d8f61" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Conversion</p>
          <p className="mt-1 text-xl font-semibold tracking-[-0.04em] text-slate-950">
            {clampedRatio.toFixed(1)}%
          </p>
        </div>
      </div>
      <p className="text-center text-xs leading-5 text-slate-500">
        Downloads compared to total site visitors.
      </p>
    </div>
  )
}

function KpiNavigationCard({ title, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        active
          ? 'border-emerald-300 bg-emerald-50/80 shadow-[0_10px_26px_rgba(13,143,97,0.12)]'
          : 'border-slate-200 bg-white hover:border-emerald-200 hover:shadow-[0_8px_20px_rgba(15,23,42,0.07)]'
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
          {formatNumber(value)}
        </p>
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </div>
    </button>
  )
}

function MetricsHeader({ metrics }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        Metrics header
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-slate-500">Visitors</p>
          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {formatNumber(metrics.siteVisits)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Downloads</p>
          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {formatNumber(metrics.apkDownloads)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Waitlist + updates</p>
          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {formatNumber(metrics.waitlistTotal)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Feedback</p>
          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            {formatNumber(metrics.feedbackTotal)}
          </p>
        </div>
      </div>
    </section>
  )
}

function EntryRow({ title, subtitle, date, body }) {
  return (
    <article className="border-b border-slate-100 py-4 last:border-b-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">{title}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <p className="text-xs text-slate-500">{date}</p>
      </div>
      {body && <p className="mt-3 text-sm leading-6 text-slate-700">{body}</p>}
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
  const [activeScreen, setActiveScreen] = useState('overview')

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
            text: mapAdminErrorMessage(error, 'We could not load admin data.'),
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
  const segmentedData = useMemo(() => {
    const waitlist = waitlistEntries.filter((item) => item.source === 'download_notice')
    const updates = waitlistEntries.filter((item) => item.source !== 'download_notice')

    return { waitlist, updates }
  }, [waitlistEntries])

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
      waitlistOnly: segmentedData.waitlist.length,
      updatesOnly: segmentedData.updates.length,
      modalWaitlistCount,
      updatesWaitlistCount,
      feedbackTotal: feedbackEntries.length,
      feedbackWithEmail,
    }
  }, [dashboard, feedbackEntries, segmentedData, waitlistEntries])

  const graphItems = useMemo(
    () => [
      {
        key: 'visitors',
        label: 'Visitors',
        value: metrics.siteVisits,
        barClass: 'bg-gradient-to-r from-emerald-600 to-emerald-500',
      },
      {
        key: 'downloads',
        label: 'APK downloads',
        value: metrics.apkDownloads,
        barClass: 'bg-gradient-to-r from-slate-700 to-slate-500',
      },
      {
        key: 'waitlist',
        label: 'Waitlist + updates',
        value: metrics.waitlistTotal,
        barClass: 'bg-gradient-to-r from-emerald-300 to-emerald-400',
      },
      {
        key: 'feedback',
        label: 'Feedback',
        value: metrics.feedbackTotal,
        barClass: 'bg-gradient-to-r from-slate-400 to-slate-300',
      },
    ],
    [metrics],
  )

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
        text: mapAdminErrorMessage(
          error,
          'We could not send the admin login link.',
        ),
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
        text: mapAdminErrorMessage(error, 'We could not refresh admin data.'),
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
        text: mapAdminErrorMessage(
          error,
          'We could not update the download toggle.',
        ),
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
      buildWaitlistCsvRows(segmentedData.waitlist),
    )
  }

  const handleExportUpdatesWaitlist = () => {
    downloadCsv(
      'majuu-waitlist-updates-form.csv',
      buildWaitlistCsvRows(segmentedData.updates),
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
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(243,248,245,0.95))] px-5 py-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:px-6 sm:py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusChip icon={Activity} tone="emerald">
                Live metrics
              </StatusChip>
              <StatusChip
                icon={adminMode === 'secure' ? ShieldCheck : TriangleAlert}
                tone={adminMode === 'secure' ? 'emerald' : 'amber'}
              >
                {adminMode === 'secure' ? 'Secure mode' : 'Fallback mode'}
              </StatusChip>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl">
              MAJUU Admin Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600">Last activity: {latestActivityLabel}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-wait disabled:opacity-80"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Website activity graph
            </p>
            <div className="mt-4">
              <GraphBars items={graphItems} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Visitor to download ring
            </p>
            <ConversionRing visitors={metrics.siteVisits} downloads={metrics.apkDownloads} />
          </section>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <KpiNavigationCard
            title="Waitlist"
            value={metrics.waitlistOnly}
            active={activeScreen === 'waitlist'}
            onClick={() => setActiveScreen('waitlist')}
          />
          <KpiNavigationCard
            title="Get updates"
            value={metrics.updatesOnly}
            active={activeScreen === 'updates'}
            onClick={() => setActiveScreen('updates')}
          />
          <KpiNavigationCard
            title="Feedback"
            value={metrics.feedbackTotal}
            active={activeScreen === 'feedback'}
            onClick={() => setActiveScreen('feedback')}
          />
        </div>

        {(setupRequired || dashboardIssues.length > 0) && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-semibold">Admin setup is partially incomplete.</p>
                <p className="mt-1 leading-6">
                  Apply [admin_dashboard.sql](C:/Users/KoinangeJr/majuu-site/supabase/admin_dashboard.sql)
                  in Supabase SQL Editor, then refresh.
                </p>
                {dashboardIssues.length > 0 && (
                  <ul className="mt-2 space-y-1">
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
            className={`mt-4 text-sm ${
              message.type === 'error' ? 'text-rose-600' : 'text-emerald-700'
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      <section className="mt-5 rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Launch controls
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">
              Download CTA status
            </h2>
            <p className="mt-2 text-sm text-slate-600">
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
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-45 ${
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

      <section className="mt-5 space-y-4">
        <MetricsHeader metrics={metrics} />

        {activeScreen === 'overview' && (
          <section className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 sm:px-6">
            <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Overview</h3>
            <p className="mt-2 text-sm text-slate-600">
              Use the cards above to open Waitlist, Get Updates, or Feedback detail
              screens.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <KpiNavigationCard
                title="Waitlist"
                value={metrics.waitlistOnly}
                active={activeScreen === 'waitlist'}
                onClick={() => setActiveScreen('waitlist')}
              />
              <KpiNavigationCard
                title="Get updates"
                value={metrics.updatesOnly}
                active={activeScreen === 'updates'}
                onClick={() => setActiveScreen('updates')}
              />
              <KpiNavigationCard
                title="Feedback"
                value={metrics.feedbackTotal}
                active={activeScreen === 'feedback'}
                onClick={() => setActiveScreen('feedback')}
              />
            </div>
          </section>
        )}

        {activeScreen === 'waitlist' && (
          <section className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  Waitlist details
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  People who joined from the download modal tester flow.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportButton
                  onClick={handleExportModalWaitlist}
                  disabled={segmentedData.waitlist.length === 0}
                >
                  Export waitlist CSV
                </ExportButton>
                <ExportButton
                  onClick={handleExportAllWaitlist}
                  disabled={waitlistEntries.length === 0}
                >
                  Export all signups CSV
                </ExportButton>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {segmentedData.waitlist.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No waitlist entries yet.</p>
              ) : (
                segmentedData.waitlist.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    title={entry.email}
                    subtitle="Source: download notice"
                    date={formatDate(entry.created_at)}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {activeScreen === 'updates' && (
          <section className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  Get updates details
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Signups from the updates form and legacy entries.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportButton
                  onClick={handleExportUpdatesWaitlist}
                  disabled={segmentedData.updates.length === 0}
                >
                  Export updates CSV
                </ExportButton>
                <ExportButton
                  onClick={handleExportAllWaitlist}
                  disabled={waitlistEntries.length === 0}
                >
                  Export all signups CSV
                </ExportButton>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {segmentedData.updates.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No update signups yet.</p>
              ) : (
                segmentedData.updates.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    title={entry.email}
                    subtitle={`Source: ${String(entry.source ?? 'legacy').replaceAll('_', ' ')}`}
                    date={formatDate(entry.created_at)}
                  />
                ))
              )}
            </div>
          </section>
        )}

        {activeScreen === 'feedback' && (
          <section className="rounded-[1.8rem] border border-slate-200 bg-white px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  Feedback details
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Messages from users with optional contact emails.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ExportButton
                  onClick={handleExportFeedback}
                  disabled={feedbackEntries.length === 0}
                >
                  Export feedback CSV
                </ExportButton>
                <ExportButton
                  onClick={handleExportFeedbackContacts}
                  disabled={metrics.feedbackWithEmail === 0}
                >
                  Export feedback contacts CSV
                </ExportButton>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {feedbackEntries.length === 0 ? (
                <p className="py-4 text-sm text-slate-500">No feedback entries yet.</p>
              ) : (
                feedbackEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    title={entry.name || 'Anonymous'}
                    subtitle={entry.email || 'No email provided'}
                    date={formatDate(entry.created_at)}
                    body={entry.message}
                  />
                ))
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  )
}
