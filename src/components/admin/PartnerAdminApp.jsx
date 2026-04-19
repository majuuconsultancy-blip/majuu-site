import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Loader2, LogOut, Menu, RefreshCw, X } from 'lucide-react'
import {
  checkAdminAccess,
  getAdminSession,
  onAdminAuthStateChange,
  setDownloadsEnabled,
  signInAdmin,
  signOutAdmin,
} from '../../lib/supabase/admin'
import {
  getPartnerAdminSnapshot,
  getPartnerDetails,
} from '../../lib/supabase/partners'
import { isSupabaseConfigured } from '../../lib/supabase/client'

const sidebarItems = [
  'Dashboard',
  'Partners',
  'Waitlist',
  'Referrals',
  'APK Control',
  'Feedback',
]

function formatDate(value) {
  if (!value) return '-'
  try {
    return new Intl.DateTimeFormat('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function Sidebar({ active, onSelect, open, onClose }) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white p-4 transition-transform duration-300 md:static md:w-64 md:translate-x-0 md:rounded-2xl md:border ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mt-14 md:mt-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Admin</p>
        </div>
        <nav className="mt-3 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                onSelect(item)
                onClose()
              }}
              className={`block w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition ${
                active === item
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>
      {open && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          aria-label="Close sidebar"
        />
      )}
    </>
  )
}

function PartnerDetailsPanel({ details }) {
  if (!details) {
    return null
  }

  return (
    <div className="mt-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
      <div>
        <p className="font-semibold text-slate-900">Countries</p>
        <ul className="mt-1 space-y-1 text-slate-700">
          {details.countries.map((country) => (
            <li key={country.id}>
              {country.name}
              {country.detail?.details_json?.visaProcessingTime
                ? ` • Visa: ${country.detail.details_json.visaProcessingTime}`
                : ''}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-semibold text-slate-900">Branches</p>
        <ul className="mt-1 space-y-1 text-slate-700">
          {details.branches.map((branch) => (
            <li key={branch.id}>
              {branch.branch_name} ({branch.country}, {branch.city_town || 'n/a'})
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-semibold text-slate-900">Services</p>
        <ul className="mt-1 space-y-1 text-slate-700">
          {details.services.map((service) => (
            <li key={service.id}>
              {service.service_name}
              {service.destination_country ? ` (${service.destination_country})` : ''}
              {service.estimated_processing_time
                ? ` • ${service.estimated_processing_time}`
                : ' • time not set'}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="font-semibold text-slate-900">Assigned Admins</p>
        <ul className="mt-1 space-y-1 text-slate-700">
          {details.admins.map((admin) => (
            <li key={admin.id}>
              {admin.email} • {admin.assigned_branch || 'unassigned'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function PartnerAdminApp() {
  const [session, setSession] = useState(null)
  const [authState, setAuthState] = useState('loading')
  const [accessState, setAccessState] = useState('idle')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState({ type: 'idle', text: '' })
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loadingData, setLoadingData] = useState(false)
  const [expandedPartnerId, setExpandedPartnerId] = useState('')
  const [partnerDetailsMap, setPartnerDetailsMap] = useState({})

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthState('misconfigured')
      return undefined
    }

    let mounted = true

    getAdminSession()
      .then((nextSession) => {
        if (mounted) {
          setSession(nextSession)
          setAuthState('ready')
        }
      })
      .catch((error) => {
        if (mounted) {
          setAuthState('error')
          setMessage({ type: 'error', text: error.message || 'Could not read session.' })
        }
      })

    const {
      data: { subscription },
    } = onAdminAuthStateChange((nextSession) => {
      setSession(nextSession)
      setAuthState('ready')
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const refreshData = async () => {
    setLoadingData(true)

    try {
      const snapshot = await getPartnerAdminSnapshot()
      setData(snapshot)
      setAccessState('authorized')
    } catch (error) {
      if (String(error.message || '').toLowerCase().includes('access denied')) {
        setAccessState('denied')
      } else {
        setMessage({
          type: 'error',
          text: error.message || 'Could not load admin data.',
        })
      }
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (!session) {
      setAccessState('idle')
      setData(null)
      return
    }

    let cancelled = false

    const hydrate = async () => {
      const access = await checkAdminAccess()
      if (cancelled) return

      if (!access.authorized) {
        setAccessState('denied')
        return
      }

      await refreshData()
    }

    hydrate().catch((error) => {
      if (!cancelled) {
        setMessage({ type: 'error', text: error.message || 'Could not load admin.' })
      }
    })

    return () => {
      cancelled = true
    }
  }, [session])

  const handleSignIn = async (event) => {
    event.preventDefault()
    setMessage({ type: 'loading', text: 'Sending secure login link...' })

    try {
      await signInAdmin(email)
      setMessage({ type: 'success', text: 'Magic link sent. Check your inbox.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Sign in failed.' })
    }
  }

  const handleSignOut = async () => {
    await signOutAdmin()
    setSession(null)
    setData(null)
    setExpandedPartnerId('')
  }

  const handleToggleApk = async () => {
    if (!data) return

    setMessage({ type: 'loading', text: 'Updating APK control...' })

    try {
      await setDownloadsEnabled(!data.downloadsEnabled)
      await refreshData()
      setMessage({ type: 'success', text: 'APK download setting updated.' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Could not update APK setting.' })
    }
  }

  const loadPartnerDetails = async (partnerId) => {
    if (partnerDetailsMap[partnerId]) {
      return
    }

    const details = await getPartnerDetails(partnerId)
    setPartnerDetailsMap((previous) => ({
      ...previous,
      [partnerId]: details,
    }))
  }

  const referralRows = useMemo(() => data?.referrals ?? [], [data])

  if (authState === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4">
        <p className="text-sm text-slate-600">Loading admin...</p>
      </main>
    )
  }

  if (authState === 'misconfigured') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4">
        <p className="text-sm text-rose-700">Supabase is not configured for admin access.</p>
      </main>
    )
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
        <form onSubmit={handleSignIn} className="w-full rounded-2xl border border-slate-200 bg-white p-5">
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">Admin Sign In</h1>
          <p className="mt-1 text-sm text-slate-600">Use your admin email to receive a magic link.</p>

          <label className="mt-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              required
            />
          </label>

          <button
            type="submit"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Send Magic Link
          </button>

          {message.text && (
            <p className={`mt-3 text-sm ${message.type === 'error' ? 'text-rose-700' : 'text-slate-700'}`}>
              {message.text}
            </p>
          )}
        </form>
      </main>
    )
  }

  if (accessState === 'denied') {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-lg font-semibold text-slate-900">Access denied</p>
          <p className="mt-2 text-sm text-slate-600">This account is not on the admin allowlist.</p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Sign out
          </button>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <p className="text-sm font-semibold tracking-[0.12em] text-emerald-800">MAJUU ADMIN</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              disabled={loadingData}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              {loadingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 py-4">
        <Sidebar
          active={activePage}
          onSelect={setActivePage}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
          {message.text && (
            <p className={`mb-3 text-sm ${message.type === 'error' ? 'text-rose-700' : 'text-slate-700'}`}>
              {message.text}
            </p>
          )}

          {activePage === 'Dashboard' && (
            <section>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Dashboard</h1>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total partners</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{data?.stats.totalPartners ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total waitlist users</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{data?.stats.totalWaitlistUsers ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Total referrals</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{data?.stats.totalReferrals ?? 0}</p>
                </div>
              </div>
            </section>
          )}

          {activePage === 'Partners' && (
            <section>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Partners</h1>
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Name</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Email</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Countries</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Proposed Commission</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(data?.partners ?? []).map((partner) => (
                      <tr key={partner.id} className="align-top">
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => {
                              const isExpanded = expandedPartnerId === partner.id
                              setExpandedPartnerId(isExpanded ? '' : partner.id)
                              if (!isExpanded) {
                                loadPartnerDetails(partner.id).catch((error) => {
                                  setMessage({
                                    type: 'error',
                                    text: error.message || 'Could not load full partner details.',
                                  })
                                })
                              }
                            }}
                            className="inline-flex items-center gap-2 font-semibold text-slate-900"
                          >
                            {partner.organization_name}
                            <ChevronDown
                              className={`h-4 w-4 transition ${
                                expandedPartnerId === partner.id ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedPartnerId === partner.id && (
                            <PartnerDetailsPanel details={partnerDetailsMap[partner.id]} />
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-700">{partner.email}</td>
                        <td className="px-3 py-2 text-slate-700">{partner.countries.join(', ') || '-'}</td>
                        <td className="px-3 py-2 text-slate-700">{partner.proposed_commission ?? 0}%</td>
                        <td className="px-3 py-2 text-slate-700">{partner.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activePage === 'Waitlist' && (
            <section>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Waitlist</h1>
              <div className="mt-4 space-y-2">
                {(data?.waitlist ?? []).map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{entry.full_name || entry.email}</p>
                    <p className="text-slate-700">{entry.email}</p>
                    <p className="text-xs text-slate-500">{formatDate(entry.created_at)}</p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activePage === 'Referrals' && (
            <section>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Referrals</h1>
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Referrer Email</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Number of Referrals</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referralRows.map((row) => (
                      <tr key={row.referrer_email}>
                        <td className="px-3 py-2 text-slate-700">{row.referrer_email}</td>
                        <td className="px-3 py-2 text-slate-700">{row.total_referrals}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activePage === 'APK Control' && (
            <section>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">APK Control</h1>
              <p className="mt-2 text-sm text-slate-600">
                If enabled, users can download the APK. If disabled, download clicks open Join Waitlist modal.
              </p>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-700">
                  Current status:{' '}
                  <span className="font-semibold text-slate-900">
                    {data?.downloadsEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleToggleApk}
                  className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  {data?.downloadsEnabled ? 'Disable APK Download' : 'Enable APK Download'}
                </button>
              </div>
            </section>
          )}

          {activePage === 'Feedback' && (
            <section>
              <h1 className="text-2xl font-semibold tracking-[-0.03em]">Feedback</h1>
              <div className="mt-4 space-y-2">
                {(data?.feedback ?? []).map((entry) => (
                  <article key={entry.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
                    <p className="font-semibold text-slate-900">{entry.name || 'Anonymous'}</p>
                    <p className="text-slate-600">{entry.email || 'No email'}</p>
                    <p className="mt-1 text-slate-700">{entry.message}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(entry.created_at)}</p>
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

