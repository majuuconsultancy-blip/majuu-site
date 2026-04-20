import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckCircle2, FileDown, Loader2, LogOut, Menu, RefreshCw, X } from 'lucide-react'
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
  markPartnerAsReviewed,
} from '../../lib/supabase/partners'
import { isSupabaseConfigured } from '../../lib/supabase/client'
import { downloadPartnerSubmissionPdf } from '../../lib/pdf/partnerSubmissionPdf'

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

function buildSnapshotFromPartnerDetails(details) {
  if (!details) {
    return null
  }

  const servicesByCountry = new Map()
  for (const service of details.services ?? []) {
    const key = String(service.destination_country || 'Unknown')
    const list = servicesByCountry.get(key) ?? []
    list.push(service)
    servicesByCountry.set(key, list)
  }

  const destinationCountries = (details.countries ?? []).map((country) => {
    const countryServices = servicesByCountry.get(String(country.name || 'Unknown')) ?? []
    return {
      localId: country.id,
      name: country.name || '',
      tracks: country.detail?.details_json?.countryTracks || [],
      services: countryServices.map((service) => ({
        localId: service.id,
        serviceName: service.service_name || '',
        description: service.description || '',
        requiredInformation:
          service.required_information || service.requirements_json?.required_information || '',
        estimatedProcessingTime: service.estimated_processing_time || '',
        tracks: service.tracks || [],
      })),
      details: {
        whyChooseCountry: country.detail?.why_choose_country || '',
        topCareerFields: country.detail?.top_career_fields || '',
        visaProcessingTime: country.detail?.visa_processing_time || '',
        totalProcessTime: country.detail?.total_process_time || '',
        visaSuccessRate: country.detail?.visa_acceptance_rate || '',
        scholarshipAvailabilityPercent: country.detail?.scholarship_availability_percent || '',
        costEstimate: country.detail?.cost_estimate || '',
        startingBudget: country.detail?.starting_budget || '',
        requirements: country.detail?.requirements || '',
        notes: country.detail?.notes || '',
        trackOverrides: country.detail?.details_json?.trackOverrides || {},
      },
    }
  })

  return {
    organizationName: details.partner?.organization_name || '',
    businessStatus: details.partner?.business_status || '',
    contactEmail: details.partner?.email || '',
    contactPhone: details.partner?.phone_number || '',
    website: details.partner?.website || '',
    description: details.partner?.description || '',
    serviceTracks: details.partner?.service_tracks || [],
    homeCountries: details.partner?.home_countries || (details.partner?.home_country ? [details.partner.home_country] : []),
    branches: (details.branches ?? []).map((branch) => ({
      localId: branch.id,
      branchName: branch.branch_name || '',
      country: branch.country || '',
      cityTown: branch.city_town || '',
      primaryCounty: branch.primary_county || '',
      nearbyCountiesServed: (branch.secondary_counties || []).join(', '),
    })),
    admins: (details.admins ?? []).map((admin) => ({
      localId: admin.id,
      email: admin.email || '',
      assignedBranch: admin.assigned_branch || '',
      cityTown: admin.city_town || '',
      maxRequestsCapacity: admin.max_requests_capacity || '',
    })),
    destinationCountries,
    proposedCommission: details.partner?.proposed_commission || '',
    paymentMethods: details.partner?.payment_details?.methods || [],
    operatingHours: details.partner?.operating_hours || {},
    agreementAccepted: Boolean(details.partner?.agreement_accepted),
    submittedAt: details.partner?.created_at || new Date().toISOString(),
  }
}

function PartnerDetailsScreen({ details, onBack, onDownload, onMarkReviewed, markingReviewed }) {
  if (!details) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Loading partner details...
      </div>
    )
  }

  const partner = details.partner
  const status = String(partner?.status || 'pending').toLowerCase()

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Partners
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
          >
            <FileDown className="h-4 w-4" />
            Download PDF
          </button>
          {status !== 'reviewed' && (
            <button
              type="button"
              onClick={onMarkReviewed}
              disabled={markingReviewed}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              <CheckCircle2 className="h-4 w-4" />
              {markingReviewed ? 'Marking...' : 'Reviewed'}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-xl font-semibold text-slate-900">{partner?.organization_name || '-'}</h2>
        <p className="mt-1 text-sm text-slate-600">Status: {partner?.status || 'pending'}</p>
        <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p>Email: {partner?.email || '-'}</p>
          <p>Phone: {partner?.phone_number || '-'}</p>
          <p>Business status: {partner?.business_status || '-'}</p>
          <p>Commission: {partner?.proposed_commission ?? 0}%</p>
        </div>
      </div>

      <div className="grid gap-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-900">Countries</p>
          <ul className="mt-2 space-y-1 text-slate-700">
            {(details.countries || []).map((country) => (
              <li key={country.id}>{country.name}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-900">Branches</p>
          <ul className="mt-2 space-y-1 text-slate-700">
            {(details.branches || []).map((branch) => (
              <li key={branch.id}>
                {branch.branch_name} ({branch.country || '-'}, {branch.city_town || '-'})
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-900">Services</p>
          <ul className="mt-2 space-y-1 text-slate-700">
            {(details.services || []).map((service) => (
              <li key={service.id}>
                {service.service_name}
                {service.destination_country ? ` (${service.destination_country})` : ''}
              </li>
            ))}
          </ul>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-semibold text-slate-900">Assigned Admins</p>
          <ul className="mt-2 space-y-1 text-slate-700">
            {(details.admins || []).map((admin) => (
              <li key={admin.id}>
                {admin.email} • {admin.assigned_branch || 'unassigned'}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
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
  const [selectedPartnerId, setSelectedPartnerId] = useState('')
  const [partnerTab, setPartnerTab] = useState('new')
  const [markingReviewedId, setMarkingReviewedId] = useState('')
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
    setSelectedPartnerId('')
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
  const partnerRows = useMemo(() => data?.partners ?? [], [data])
  const filteredPartners = useMemo(
    () =>
      partnerRows.filter((partner) =>
        partnerTab === 'reviewed'
          ? String(partner.status || '').toLowerCase() === 'reviewed'
          : String(partner.status || '').toLowerCase() !== 'reviewed',
      ),
    [partnerRows, partnerTab],
  )
  const selectedPartnerDetails = selectedPartnerId ? partnerDetailsMap[selectedPartnerId] : null

  const handleOpenPartnerDetails = async (partnerId) => {
    setSelectedPartnerId(partnerId)
    try {
      await loadPartnerDetails(partnerId)
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Could not load full partner details.',
      })
    }
  }

  const handleMarkPartnerReviewed = async (partnerId) => {
    setMarkingReviewedId(partnerId)
    try {
      await markPartnerAsReviewed(partnerId)
      await refreshData()
      if (partnerDetailsMap[partnerId]) {
        setPartnerDetailsMap((previous) => ({
          ...previous,
          [partnerId]: {
            ...previous[partnerId],
            partner: {
              ...previous[partnerId].partner,
              status: 'reviewed',
            },
          },
        }))
      }
      setMessage({ type: 'success', text: 'Partner marked as reviewed.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Could not mark partner as reviewed.',
      })
    } finally {
      setMarkingReviewedId('')
    }
  }

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
              {selectedPartnerId ? (
                <div className="mt-4">
                  <PartnerDetailsScreen
                    details={selectedPartnerDetails}
                    onBack={() => setSelectedPartnerId('')}
                    onDownload={() => {
                      const snapshot = buildSnapshotFromPartnerDetails(selectedPartnerDetails)
                      if (snapshot) {
                        downloadPartnerSubmissionPdf(snapshot)
                      }
                    }}
                    onMarkReviewed={() => handleMarkPartnerReviewed(selectedPartnerId)}
                    markingReviewed={markingReviewedId === selectedPartnerId}
                  />
                </div>
              ) : (
                <>
                  <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setPartnerTab('new')}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        partnerTab === 'new'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      New
                    </button>
                    <button
                      type="button"
                      onClick={() => setPartnerTab('reviewed')}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        partnerTab === 'reviewed'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Reviewed
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {filteredPartners.map((partner) => (
                      <button
                        key={partner.id}
                        type="button"
                        onClick={() => handleOpenPartnerDetails(partner.id)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:bg-emerald-50"
                      >
                        {partner.organization_name}
                      </button>
                    ))}
                    {!filteredPartners.length && (
                      <p className="text-sm text-slate-500">
                        {partnerTab === 'new'
                          ? 'No new partners found.'
                          : 'No reviewed partners found.'}
                      </p>
                    )}
                  </div>
                </>
              )}
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

