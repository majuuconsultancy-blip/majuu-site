import { cloneElement, isValidElement, useCallback, useEffect, useMemo, useState } from 'react'
import { createPartnerOnboardingSubmission } from '../../../lib/supabase/partners'
import { downloadPartnerSubmissionPdf } from '../../../lib/pdf/partnerSubmissionPdf'

const SERVICE_TRACKS = ['Study Abroad', 'Work Abroad', 'Travel']
const SERVICE_ASSIGNMENT_TRACKS = ['Study', 'Work', 'Travel']
const PAYMENT_METHODS = ['M-Pesa', 'Bank Transfer']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const HOME_COUNTRIES = [
  { value: 'Kenya', label: 'Kenya', flag: '🇰🇪', comingSoon: false },
  { value: 'Tanzania', label: 'Tanzania', flag: '🇹🇿', comingSoon: true },
  { value: 'Uganda', label: 'Uganda', flag: '🇺🇬', comingSoon: true },
  { value: 'Rwanda', label: 'Rwanda', flag: '🇷🇼', comingSoon: true },
  { value: 'Ethiopia', label: 'Ethiopia', flag: '🇪🇹', comingSoon: true },
]
const STEPS = [
  'About Your Organization',
  'What You Help With',
  'Home Country',
  'Branch Locations',
  'Assigned Admins',
  'Where You Send Clients',
  'Services You Offer',
  'Country Details',
  'Commission Proposal',
  'Payment Method',
  'Operating Hours',
  'Agreement',
]
const TRACK_FROM_STEP2 = {
  'Study Abroad': 'Study',
  'Work Abroad': 'Work',
  Travel: 'Travel',
}
const PARTNER_ONBOARDING_DRAFT_KEY = 'majuu-partner-onboarding-draft-v1'

function hasText(value) {
  return String(value ?? '').trim().length > 0
}

function isStandardEmail(value) {
  return /^[^\s@]+@[^\s@]+\.com$/i.test(String(value ?? '').trim())
}

function isKenyanPhoneNumber(value) {
  const normalized = String(value ?? '').replace(/[\s-]/g, '')
  return /^(?:\+254|254|0)(?:7\d{8}|1\d{8})$/.test(normalized)
}

function id(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function sortTracks(tracks) {
  return [...tracks].sort(
    (a, b) => SERVICE_ASSIGNMENT_TRACKS.indexOf(a) - SERVICE_ASSIGNMENT_TRACKS.indexOf(b),
  )
}

function normalizeCountryTracks(tracks) {
  const allowed = new Set(SERVICE_ASSIGNMENT_TRACKS)
  return sortTracks(
    [...new Set((Array.isArray(tracks) ? tracks : []).filter((track) => allowed.has(track)))],
  )
}

function normalizeServiceTracksForCountry(serviceTracks, countryTracks) {
  const allowed = normalizeCountryTracks(countryTracks)
  if (allowed.length === 1) {
    return [allowed[0]]
  }
  if (!allowed.length) {
    return []
  }
  const allowedSet = new Set(allowed)
  const filtered = sortTracks(
    [...new Set((Array.isArray(serviceTracks) ? serviceTracks : []).filter((track) => allowedSet.has(track)))],
  )
  if (!filtered.length) {
    return [allowed[0]]
  }
  return sortTracks(
    [...new Set(filtered)],
  )
}

function normalizeTrackOverrides(trackOverrides, countryTracks) {
  const next = {}
  const normalizedTracks = normalizeCountryTracks(countryTracks)
  for (const track of normalizedTracks) {
    const existing = trackOverrides?.[track] || {}
    next[track] = {
      enabled: normalizedTracks.length === 1 ? true : Boolean(existing.enabled),
    }
  }
  return next
}

function createService(countryTracks = []) {
  return {
    localId: id('service'),
    serviceName: '',
    description: '',
    requiredInformation: '',
    estimatedProcessingTime: '',
    tracks: normalizeServiceTracksForCountry([], countryTracks),
  }
}

function createDestinationCountry(defaultTracks = []) {
  const normalizedTracks = normalizeCountryTracks(defaultTracks)
  return {
    localId: id('dest-country'),
    name: '',
    tracks: normalizedTracks,
    services: [createService(normalizedTracks)],
    details: {
      whyChooseCountry: '',
      topCareerFields: '',
      visaProcessingTime: '',
      totalProcessTime: '',
      visaSuccessRate: '',
      scholarshipAvailabilityPercent: '',
      costEstimate: '',
      startingBudget: '',
      requirements: '',
      notes: '',
      trackOverrides: normalizeTrackOverrides({}, normalizedTracks),
    },
  }
}

function createBranch(country) {
  return {
    localId: id('branch'),
    branchName: '',
    country: country || '',
    cityTown: '',
    primaryCounty: '',
    nearbyCountiesServed: '',
  }
}

function createAdmin() {
  return {
    localId: id('admin'),
    email: '',
    assignedBranch: '',
    cityTown: '',
    maxRequestsCapacity: '',
  }
}

function Card({ title, subtitle, children }) {
  return (
    <section className="space-y-3">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({
  label,
  children,
  helperText = '',
  error = '',
  fieldId = '',
  requirement = '',
}) {
  const child = isValidElement(children)
    ? cloneElement(children, {
        invalid: Boolean(error),
      })
    : children
  return (
    <label className="block" data-field-id={fieldId || undefined}>
      <span className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
        <span>{label}</span>
        {requirement && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] ${
              requirement === 'required'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {requirement}
          </span>
        )}
      </span>
      {child}
      {error ? (
        <span className="mt-1 block text-xs text-rose-600">{error}</span>
      ) : (
        helperText && <span className="mt-1 block text-xs text-slate-500">{helperText}</span>
      )}
    </label>
  )
}

function Input({ invalid = false, ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition ${
        invalid
          ? 'border-rose-300 focus:border-rose-400'
          : 'border-slate-200 focus:border-emerald-400'
      }`}
    />
  )
}

function Textarea({ invalid = false, ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition ${
        invalid
          ? 'border-rose-300 focus:border-rose-400'
          : 'border-slate-200 focus:border-emerald-400'
      }`}
    />
  )
}

function Select({ invalid = false, ...props }) {
  return (
    <select
      {...props}
      className={`w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none transition ${
        invalid
          ? 'border-rose-300 focus:border-rose-400'
          : 'border-slate-200 focus:border-emerald-400'
      }`}
    />
  )
}

function Choice({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
        active
          ? 'border-emerald-300 bg-emerald-100 text-emerald-900'
          : 'border-slate-200 bg-white text-slate-700'
      }`}
    >
      {children}
    </button>
  )
}

function InlineError({ message }) {
  if (!message) {
    return null
  }
  return <p className="mt-1 text-xs text-rose-600">{message}</p>
}

function createInitialForm() {
  return {
    organizationName: '',
    businessStatus: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    description: '',
    serviceTracks: [],
    homeCountries: [],
    branches: [createBranch('')],
    admins: [createAdmin()],
    destinationCountries: [createDestinationCountry()],
    proposedCommission: '',
    paymentMethods: [],
    operatingHours: { daysOpen: [], openingTime: '', closingTime: '' },
    agreementAccepted: false,
  }
}

function toStringArray(value) {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function normalizeBooleanMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  const result = {}
  for (const [key, item] of Object.entries(value)) {
    result[key] = Boolean(item)
  }
  return result
}

function clampStep(value) {
  const numericStep = Number(value)
  if (!Number.isFinite(numericStep)) return 0
  return Math.min(Math.max(Math.trunc(numericStep), 0), STEPS.length - 1)
}

function normalizeDraftForm(rawForm) {
  const base = createInitialForm()
  if (!rawForm || typeof rawForm !== 'object' || Array.isArray(rawForm)) {
    return base
  }

  const serviceTracks = toStringArray(rawForm.serviceTracks).filter((track) =>
    SERVICE_TRACKS.includes(track),
  )
  const homeCountries = toStringArray(rawForm.homeCountries).filter(Boolean)

  const branches = (Array.isArray(rawForm.branches) ? rawForm.branches : [])
    .map((branch) => ({
      localId: hasText(branch?.localId) ? String(branch.localId) : id('branch'),
      branchName: String(branch?.branchName ?? ''),
      country: String(branch?.country ?? ''),
      cityTown: String(branch?.cityTown ?? ''),
      primaryCounty: String(branch?.primaryCounty ?? ''),
      nearbyCountiesServed: String(branch?.nearbyCountiesServed ?? ''),
    }))
    .filter((branch) => branch.localId)

  const admins = (Array.isArray(rawForm.admins) ? rawForm.admins : [])
    .map((admin) => ({
      localId: hasText(admin?.localId) ? String(admin.localId) : id('admin'),
      email: String(admin?.email ?? ''),
      assignedBranch: String(admin?.assignedBranch ?? ''),
      cityTown: String(admin?.cityTown ?? ''),
      maxRequestsCapacity: String(admin?.maxRequestsCapacity ?? ''),
    }))
    .filter((admin) => admin.localId)

  const destinationCountries = (Array.isArray(rawForm.destinationCountries) ? rawForm.destinationCountries : [])
    .map((country) => {
      const tracks = normalizeCountryTracks(country?.tracks)
      const services = (Array.isArray(country?.services) ? country.services : [])
        .map((service) => ({
          localId: hasText(service?.localId) ? String(service.localId) : id('service'),
          serviceName: String(service?.serviceName ?? ''),
          description: String(service?.description ?? ''),
          requiredInformation: String(service?.requiredInformation ?? ''),
          estimatedProcessingTime: String(service?.estimatedProcessingTime ?? ''),
          tracks: normalizeServiceTracksForCountry(service?.tracks, tracks),
        }))
        .filter((service) => service.localId)

      const details = country?.details || {}
      return {
        localId: hasText(country?.localId) ? String(country.localId) : id('dest-country'),
        name: String(country?.name ?? ''),
        tracks,
        services: services.length ? services : [createService(tracks)],
        details: {
          whyChooseCountry: String(details.whyChooseCountry ?? ''),
          topCareerFields: String(details.topCareerFields ?? ''),
          visaProcessingTime: String(details.visaProcessingTime ?? ''),
          totalProcessTime: String(details.totalProcessTime ?? ''),
          visaSuccessRate: String(details.visaSuccessRate ?? ''),
          scholarshipAvailabilityPercent: String(details.scholarshipAvailabilityPercent ?? ''),
          costEstimate: String(details.costEstimate ?? ''),
          startingBudget: String(details.startingBudget ?? ''),
          requirements: String(details.requirements ?? ''),
          notes: String(details.notes ?? ''),
          trackOverrides: normalizeTrackOverrides(details.trackOverrides, tracks),
        },
      }
    })
    .filter((country) => country.localId)

  return {
    organizationName: String(rawForm.organizationName ?? ''),
    businessStatus: String(rawForm.businessStatus ?? ''),
    contactEmail: String(rawForm.contactEmail ?? ''),
    contactPhone: String(rawForm.contactPhone ?? ''),
    website: String(rawForm.website ?? ''),
    description: String(rawForm.description ?? ''),
    serviceTracks,
    homeCountries,
    branches: branches.length ? branches : base.branches,
    admins: admins.length ? admins : base.admins,
    destinationCountries: destinationCountries.length ? destinationCountries : base.destinationCountries,
    proposedCommission: String(rawForm.proposedCommission ?? ''),
    paymentMethods: toStringArray(rawForm.paymentMethods).filter((method) =>
      PAYMENT_METHODS.includes(method),
    ),
    operatingHours: {
      daysOpen: toStringArray(rawForm?.operatingHours?.daysOpen).filter((day) => DAYS.includes(day)),
      openingTime: String(rawForm?.operatingHours?.openingTime ?? ''),
      closingTime: String(rawForm?.operatingHours?.closingTime ?? ''),
    },
    agreementAccepted: Boolean(rawForm.agreementAccepted),
  }
}

function readSavedPartnerOnboardingDraft() {
  if (typeof window === 'undefined') {
    return null
  }
  try {
    const raw = window.localStorage.getItem(PARTNER_ONBOARDING_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}
export function BecomePartnerPage() {
    const [initialDraft] = useState(() => readSavedPartnerOnboardingDraft())
  const [form, setForm] = useState(() => normalizeDraftForm(initialDraft?.form))
  const [step, setStep] = useState(() => clampStep(initialDraft?.step))
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [submittedSnapshot, setSubmittedSnapshot] = useState(null)
  const [expandedServiceCountries, setExpandedServiceCountries] = useState(() =>
    normalizeBooleanMap(initialDraft?.expandedServiceCountries),
  )
  const [expandedDetailCountries, setExpandedDetailCountries] = useState(() =>
    normalizeBooleanMap(initialDraft?.expandedDetailCountries),
  )
  const [homeCountryMenuOpen, setHomeCountryMenuOpen] = useState(false)
  const [attemptedSteps, setAttemptedSteps] = useState(() =>
    normalizeBooleanMap(initialDraft?.attemptedSteps),
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const payload = {
      step,
      form,
      expandedServiceCountries,
      expandedDetailCountries,
      attemptedSteps,
      updatedAt: new Date().toISOString(),
    }

    try {
      window.localStorage.setItem(PARTNER_ONBOARDING_DRAFT_KEY, JSON.stringify(payload))
    } catch {
      // Keep onboarding usable even if localStorage is unavailable.
    }
  }, [attemptedSteps, expandedDetailCountries, expandedServiceCountries, form, step])

  const defaultDestinationTracksFromStep2 = useMemo(
    () =>
      normalizeCountryTracks(
        (form.serviceTracks || []).map((track) => TRACK_FROM_STEP2[track]).filter(Boolean),
      ),
    [form.serviceTracks],
  )

  const validateStepData = useCallback((targetStep, data) => {
    const nextErrors = {}
    const expandServices = {}
    const expandDetails = {}
    let firstErrorField = ''

    const addError = (fieldId, message) => {
      if (!nextErrors[fieldId]) {
        nextErrors[fieldId] = message
      }
      if (!firstErrorField) {
        firstErrorField = fieldId
      }
    }

    if (targetStep === 0) {
      if (!hasText(data.organizationName)) addError('org_name', 'Organization name is required.')
      if (!hasText(data.businessStatus)) addError('business_status', 'Business status is required.')
      if (!hasText(data.contactEmail)) addError('contact_email', 'Contact email is required.')
      if (hasText(data.contactEmail) && !isStandardEmail(data.contactEmail))
        addError('contact_email', 'Use a valid email with @ and .com (e.g. name@example.com).')
      if (!hasText(data.contactPhone)) addError('contact_phone', 'Phone number is required.')
      if (hasText(data.contactPhone) && !isKenyanPhoneNumber(data.contactPhone))
        addError('contact_phone', 'Use a valid Kenyan number (e.g. 07XXXXXXXX or +2547XXXXXXXX).')
    }

    if (targetStep === 1) {
      if (!data.serviceTracks?.length) {
        addError('service_tracks', 'Select at least one track.')
      }
    }

    if (targetStep === 2) {
      if (!data.homeCountries?.length) {
        addError('home_countries', 'Select at least one home country.')
      }
    }

    if (targetStep === 3) {
      if (!data.branches?.length) {
        addError('branches_list', 'Add at least one branch.')
      }
      ;(data.branches || []).forEach((branch) => {
        if (!hasText(branch.branchName)) addError(`branch_${branch.localId}_name`, 'Branch name is required.')
        if (!hasText(branch.country)) addError(`branch_${branch.localId}_country`, 'Country is required.')
        if (!hasText(branch.cityTown)) addError(`branch_${branch.localId}_city`, 'City / Town is required.')
        if (!hasText(branch.primaryCounty))
          addError(`branch_${branch.localId}_primary_county`, 'Primary county is required.')
        if (!hasText(branch.nearbyCountiesServed))
          addError(`branch_${branch.localId}_nearby_counties`, 'Nearby counties served is required.')
      })
    }

    if (targetStep === 4) {
      if (!data.admins?.length) {
        addError('admins_list', 'Add at least one admin.')
      }
      ;(data.admins || []).forEach((admin) => {
        if (!hasText(admin.email)) addError(`admin_${admin.localId}_email`, 'Admin email is required.')
        if (hasText(admin.email) && !isStandardEmail(admin.email))
          addError(`admin_${admin.localId}_email`, 'Use a valid email with @ and .com.')
        if (!hasText(admin.assignedBranch))
          addError(`admin_${admin.localId}_branch`, 'Assigned branch is required.')
        if (!hasText(admin.cityTown)) addError(`admin_${admin.localId}_city`, 'City / Town is required.')
        if (!hasText(admin.maxRequestsCapacity))
          addError(`admin_${admin.localId}_capacity`, 'Max requests is required.')
      })
    }

    if (targetStep === 5) {
      if (!data.destinationCountries?.length) {
        addError('destination_list', 'Add at least one destination country.')
      }
      ;(data.destinationCountries || []).forEach((country) => {
        if (!hasText(country.name)) addError(`dest_${country.localId}_name`, 'Country name is required.')
        if (!normalizeCountryTracks(country.tracks).length) {
          addError(`dest_${country.localId}_tracks`, 'Select at least one track.')
        }
      })
    }

    if (targetStep === 6) {
      ;(data.destinationCountries || []).forEach((country) => {
        const countryHasErrorsStart = Object.keys(nextErrors).length
        if (!country.services?.length) {
          addError(`services_${country.localId}_list`, 'Add at least one service.')
        }
        ;(country.services || []).forEach((service) => {
          if (!hasText(service.serviceName))
            addError(`service_${country.localId}_${service.localId}_name`, 'Service name is required.')
          if (!hasText(service.description))
            addError(`service_${country.localId}_${service.localId}_description`, 'Description is required.')
          if (!hasText(service.requiredInformation))
            addError(
              `service_${country.localId}_${service.localId}_required_information`,
              'Required information is required.',
            )
          if (!normalizeServiceTracksForCountry(service.tracks, country.tracks).length)
            addError(`service_${country.localId}_${service.localId}_tracks`, 'Select at least one track.')
        })
        if (Object.keys(nextErrors).length > countryHasErrorsStart) {
          expandServices[country.localId] = true
        }
      })
    }

    if (targetStep === 7) {
      ;(data.destinationCountries || []).forEach((country) => {
        const details = country.details || {}
        const top = hasText(details.topCareerFields)
        const visa = hasText(details.visaProcessingTime)
        const cost = hasText(details.costEstimate)
        const countryHasErrorsStart = Object.keys(nextErrors).length

        if (!top) addError(`details_${country.localId}_top`, 'Top opportunities / fields is required.')
        if (!visa) addError(`details_${country.localId}_visa`, 'Visa processing time is required.')
        if (!cost) addError(`details_${country.localId}_cost`, 'Estimated total cost is required.')

        if (Object.keys(nextErrors).length > countryHasErrorsStart) {
          expandDetails[country.localId] = true
        }
      })
    }

    if (targetStep === 8) {
      if (!hasText(data.proposedCommission)) {
        addError('proposed_commission', 'Commission percentage is required.')
      }
    }

    if (targetStep === 9) {
      if (!data.paymentMethods?.length) {
        addError('payment_methods', 'Select at least one payment method.')
      }
    }

    if (targetStep === 10) {
      if (!data.operatingHours?.daysOpen?.length) addError('operating_days', 'Select days open.')
      if (!hasText(data.operatingHours?.openingTime)) addError('operating_open', 'Opening time is required.')
      if (!hasText(data.operatingHours?.closingTime)) addError('operating_close', 'Closing time is required.')
    }

    if (targetStep === 11) {
      if (!data.agreementAccepted) {
        addError('agreement', 'You must accept the agreement.')
      }
    }

    return {
      isValid: Object.keys(nextErrors).length === 0,
      errors: nextErrors,
      firstErrorField,
      expandServices,
      expandDetails,
    }
  }, [])

  const currentStepValidation = useMemo(
    () => validateStepData(step, form),
    [step, form, validateStepData],
  )
  const canProceedStep = currentStepValidation.isValid
  const errors = useMemo(
    () => (attemptedSteps[step] ? currentStepValidation.errors : {}),
    [attemptedSteps, currentStepValidation.errors, step],
  )

  const applyValidationUi = (validationResult) => {
    if (Object.keys(validationResult.expandServices).length) {
      const nextExpanded = {}
      for (const country of form.destinationCountries || []) {
        nextExpanded[country.localId] = Boolean(validationResult.expandServices[country.localId])
      }
      setExpandedServiceCountries(nextExpanded)
    }

    if (Object.keys(validationResult.expandDetails).length) {
      const nextExpanded = {}
      for (const country of form.destinationCountries || []) {
        nextExpanded[country.localId] = Boolean(validationResult.expandDetails[country.localId])
      }
      setExpandedDetailCountries(nextExpanded)
    }
  }

  const scrollToInvalidField = (fieldId) => {
    if (!fieldId) {
      return
    }
    window.setTimeout(() => {
      let target = document.querySelector(`[data-field-id="${fieldId}"]`)
      if (!target && fieldId.includes('_tracks')) {
        target = document.querySelector(`[data-field-id="${fieldId.replace('_tracks', '_set')}"]`)
      }
      if (!target) return
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const focusable = target.querySelector('input, textarea, select, button')
      if (focusable && typeof focusable.focus === 'function') {
        focusable.focus({ preventScroll: true })
      }
    }, 80)
  }

  const branchOptions = useMemo(
    () =>
      form.branches
        .filter((branch) => branch.branchName.trim())
        .map((branch) => ({ value: branch.branchName, label: branch.branchName })),
    [form.branches],
  )

  const patchList = (listKey, localId, patch) => {
    setForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((item) =>
        item.localId === localId ? { ...item, ...patch } : item,
      ),
    }))
  }

  const toggleInArray = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item) => item !== value)
        : [...prev[key], value],
    }))
  }

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        daysOpen: prev.operatingHours.daysOpen.includes(day)
          ? prev.operatingHours.daysOpen.filter((item) => item !== day)
          : [...prev.operatingHours.daysOpen, day],
      },
    }))
  }

  const patchDestination = (countryId, patch) => {
    setForm((prev) => ({
      ...prev,
      destinationCountries: prev.destinationCountries.map((country) =>
        country.localId === countryId ? { ...country, ...patch } : country,
      ),
    }))
  }

  const toggleHomeCountry = (countryValue) => {
    setForm((prev) => {
      const exists = prev.homeCountries.includes(countryValue)
      const nextHomeCountries = exists
        ? prev.homeCountries.filter((item) => item !== countryValue)
        : [...prev.homeCountries, countryValue]
      const primaryCountry = nextHomeCountries[0] || ''

      return {
        ...prev,
        homeCountries: nextHomeCountries,
        branches: prev.branches.map((branch) =>
          branch.country ? branch : { ...branch, country: primaryCountry },
        ),
      }
    })
  }

  const toggleDestinationTrack = (countryId, track) => {
    setForm((prev) => ({
      ...prev,
      destinationCountries: prev.destinationCountries.map((country) => {
        if (country.localId !== countryId) {
          return country
        }

        const currentTracks = normalizeCountryTracks(country.tracks)
        const nextTracks = currentTracks.includes(track)
          ? currentTracks.filter((item) => item !== track)
          : sortTracks([...currentTracks, track])

        const nextTrackOverrides = normalizeTrackOverrides(country.details?.trackOverrides, nextTracks)
        if (nextTracks.length === 1) {
          const onlyTrack = nextTracks[0]
          nextTrackOverrides[onlyTrack] = {
            enabled: true,
          }
        }

        return {
          ...country,
          tracks: nextTracks,
          services: (country.services || []).map((service) => ({
            ...service,
            tracks: normalizeServiceTracksForCountry(service.tracks, nextTracks),
          })),
          details: {
            ...country.details,
            trackOverrides: nextTrackOverrides,
          },
        }
      }),
    }))
  }

  const patchDestinationDetails = (countryId, key, value) => {
    setForm((prev) => ({
      ...prev,
      destinationCountries: prev.destinationCountries.map((country) =>
        country.localId === countryId
          ? { ...country, details: { ...country.details, [key]: value } }
          : country,
      ),
    }))
  }

  const patchCountryService = (countryId, serviceId, patch) => {
    setForm((prev) => ({
      ...prev,
      destinationCountries: prev.destinationCountries.map((country) =>
        country.localId === countryId
          ? {
              ...country,
              services: country.services.map((service) =>
                service.localId === serviceId ? { ...service, ...patch } : service,
              ),
            }
          : country,
      ),
    }))
  }

  const toggleServiceTrack = (countryId, serviceId, track) => {
    setForm((prev) => ({
      ...prev,
      destinationCountries: prev.destinationCountries.map((country) =>
        country.localId === countryId
          ? {
              ...country,
              services: country.services.map((service) =>
                service.localId === serviceId
                  ? {
                      ...service,
                      tracks: normalizeServiceTracksForCountry(
                        service.tracks.includes(track)
                          ? service.tracks.filter((item) => item !== track)
                          : [...service.tracks, track],
                        country.tracks,
                      ),
                    }
                  : service,
              ),
            }
          : country,
      ),
    }))
  }

  const submissionSnapshot = useMemo(
    () => ({
      ...form,
      destinationCountries: form.destinationCountries.map((country) => {
        const countryTracks = normalizeCountryTracks(country.tracks)
        return {
          ...country,
          tracks: countryTracks,
          services: (country.services || []).map((service) => ({
            ...service,
            tracks: normalizeServiceTracksForCountry(service.tracks, countryTracks),
          })),
          details: {
            ...country.details,
            trackOverrides: normalizeTrackOverrides(country.details?.trackOverrides, countryTracks),
          },
        }
      }),
      submittedAt: new Date().toISOString(),
    }),
    [form],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    for (let targetStep = 0; targetStep < STEPS.length; targetStep += 1) {
      const validation = validateStepData(targetStep, submissionSnapshot)
      if (!validation.isValid) {
        setAttemptedSteps((prev) => ({ ...prev, [targetStep]: true }))
        setStep(targetStep)
        applyValidationUi(validation)
        scrollToInvalidField(validation.firstErrorField)
        setStatus({ type: 'error', message: 'Please complete the required fields to continue.' })
        return
      }
    }

    setStatus({ type: 'loading', message: 'Submitting onboarding profile...' })
    try {
      await createPartnerOnboardingSubmission(submissionSnapshot)
      setStatus({ type: 'success', message: 'Submission received successfully.' })
      setSubmittedSnapshot(submissionSnapshot)
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(PARTNER_ONBOARDING_DRAFT_KEY)
        } catch {
          // Ignore storage cleanup errors after successful submit.
        }
      }
    } catch {
      setStatus({
        type: 'error',
        message: 'Something went wrong while submitting. Please try again.',
      })
    }
  }

  const handleNext = () => {
    setAttemptedSteps((prev) => ({ ...prev, [step]: true }))
    const validation = validateStepData(step, submissionSnapshot)
    if (!validation.isValid) {
      applyValidationUi(validation)
      scrollToInvalidField(validation.firstErrorField)
      return
    }
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const renderStep = () => {
    if (step === 0) {
      return (
        <Card title="Tell us about your organization">
          <Field
            label="Organization Name"
            fieldId="org_name"
            error={errors.org_name}
            requirement="required"
          >
            <Input
              value={form.organizationName}
              onChange={(e) => setForm((prev) => ({ ...prev, organizationName: e.target.value }))}
              placeholder="Enter your organization name"
              required
            />
          </Field>
          <Field
            label="Business Status"
            fieldId="business_status"
            error={errors.business_status}
            requirement="required"
          >
            <Select
              value={form.businessStatus}
              onChange={(e) => setForm((prev) => ({ ...prev, businessStatus: e.target.value }))}
              required
            >
              <option value="">Select an option</option>
              <option value="Registered">Registered</option>
              <option value="Not Registered">Not Registered</option>
            </Select>
          </Field>
          <Field
            label="Contact Email"
            fieldId="contact_email"
            error={errors.contact_email}
            requirement="required"
          >
            <Input
              type="email"
              inputMode="email"
              value={form.contactEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="name@organization.com"
              required
            />
          </Field>
          <Field
            label="Phone Number"
            fieldId="contact_phone"
            error={errors.contact_phone}
            requirement="required"
          >
            <Input
              type="tel"
              inputMode="tel"
              value={form.contactPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
              placeholder="e.g. 0712345678 or +254712345678"
              required
            />
          </Field>
          <Field label="Website" requirement="optional">
            <Input
              value={form.website}
              onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </Field>
          <Field label="Description" requirement="optional">
            <Textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Tell us about your organization (experience, achievements, awards, etc.)"
            />
          </Field>
        </Card>
      )
    }

    if (step === 1) {
      return (
        <Card title="What services do you offer?">
          <p className="text-xs font-medium text-slate-600">Track Selection (Required)</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" data-field-id="service_tracks">
            {SERVICE_TRACKS.map((track) => (
              <Choice
                key={track}
                active={form.serviceTracks.includes(track)}
                onClick={() =>
                  setForm((prev) => {
                    const nextServiceTracks = prev.serviceTracks.includes(track)
                      ? prev.serviceTracks.filter((item) => item !== track)
                      : [...prev.serviceTracks, track]
                    const nextDefaultTracks = normalizeCountryTracks(
                      nextServiceTracks.map((item) => TRACK_FROM_STEP2[item]).filter(Boolean),
                    )
                    return {
                      ...prev,
                      serviceTracks: nextServiceTracks,
                      destinationCountries: prev.destinationCountries.map((country) => {
                        if (normalizeCountryTracks(country.tracks).length) {
                          return country
                        }
                        return {
                          ...country,
                          tracks: nextDefaultTracks,
                          services: (country.services || []).map((service) => ({
                            ...service,
                            tracks: normalizeServiceTracksForCountry(service.tracks, nextDefaultTracks),
                          })),
                          details: {
                            ...country.details,
                            trackOverrides: normalizeTrackOverrides(
                              country.details?.trackOverrides,
                              nextDefaultTracks,
                            ),
                          },
                        }
                      }),
                    }
                  })
                }
              >
                {track}
              </Choice>
            ))}
          </div>
          <InlineError message={errors.service_tracks} />
        </Card>
      )
    }

    if (step === 2) {
      const selectedHomeCountries = HOME_COUNTRIES.filter((country) =>
        form.homeCountries.includes(country.value),
      )
      return (
        <Card title="Which country is your organization based in?">
          <Field
            label="Home Country"
            fieldId="home_countries"
            error={errors.home_countries}
            requirement="required"
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setHomeCountryMenuOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
              >
                <span className="truncate">
                  {selectedHomeCountries.length
                    ? selectedHomeCountries.map((country) => `${country.flag} ${country.label}`).join(', ')
                    : 'Select one or more countries'}
                </span>
                <span className="ml-3 text-xs font-semibold text-slate-500">
                  {homeCountryMenuOpen ? 'Hide' : 'Select'}
                </span>
              </button>
              {homeCountryMenuOpen && (
                <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  {HOME_COUNTRIES.map((country) => {
                    const isSelected = form.homeCountries.includes(country.value)
                    return (
                      <button
                        key={country.value}
                        type="button"
                        onClick={() => toggleHomeCountry(country.value)}
                        className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition last:mb-0 ${
                          isSelected ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.label}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          {country.comingSoon && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-700">
                              Coming Soon
                            </span>
                          )}
                          {isSelected && <span className="text-xs font-semibold text-emerald-700">Selected</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </Field>
        </Card>
      )
    }

    if (step === 3) {
      return (
        <Card title="Where are your offices located?">
          <div data-field-id="branches_list">
            <InlineError message={errors.branches_list} />
          </div>
          {form.branches.map((branch, index) => (
            <div key={branch.localId} className="space-y-3 border-b border-slate-200 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Branch {index + 1}
                </p>
                {form.branches.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        branches: prev.branches.filter((item) => item.localId !== branch.localId),
                      }))
                    }
                    className="text-xs font-medium text-rose-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <Field
                  label="Branch Name"
                  fieldId={`branch_${branch.localId}_name`}
                  error={errors[`branch_${branch.localId}_name`]}
                  requirement="required"
                >
                  <Input
                    value={branch.branchName}
                    onChange={(e) => patchList('branches', branch.localId, { branchName: e.target.value })}
                    placeholder="e.g. Nairobi Main Office"
                  />
                </Field>
                <Field
                  label="Country"
                  fieldId={`branch_${branch.localId}_country`}
                  error={errors[`branch_${branch.localId}_country`]}
                  requirement="required"
                >
                  <Input
                    value={branch.country}
                    onChange={(e) => patchList('branches', branch.localId, { country: e.target.value })}
                    placeholder={form.homeCountries[0] || 'e.g. Kenya'}
                  />
                </Field>
                <Field
                  label="City / Town"
                  fieldId={`branch_${branch.localId}_city`}
                  error={errors[`branch_${branch.localId}_city`]}
                  requirement="required"
                >
                  <Input
                    value={branch.cityTown}
                    onChange={(e) => patchList('branches', branch.localId, { cityTown: e.target.value })}
                    placeholder="e.g. Nairobi"
                  />
                </Field>
                <Field
                  label="Primary County"
                  fieldId={`branch_${branch.localId}_primary_county`}
                  error={errors[`branch_${branch.localId}_primary_county`]}
                  requirement="required"
                >
                  <Input
                    value={branch.primaryCounty}
                    onChange={(e) => patchList('branches', branch.localId, { primaryCounty: e.target.value })}
                    placeholder="e.g. Nairobi County"
                  />
                </Field>
                <Field
                  label="Nearby Counties Served"
                  fieldId={`branch_${branch.localId}_nearby_counties`}
                  error={errors[`branch_${branch.localId}_nearby_counties`]}
                  requirement="required"
                >
                  <Input
                    value={branch.nearbyCountiesServed}
                    onChange={(e) =>
                      patchList('branches', branch.localId, { nearbyCountiesServed: e.target.value })
                    }
                    placeholder="e.g. Kiambu, Machakos"
                  />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                branches: [...prev.branches, createBranch(prev.homeCountries[0] || '')],
              }))
            }
            className="inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Add Branch
          </button>
        </Card>
      )
    }

    if (step === 4) {
      return (
        <Card title="Who will handle client requests?">
          <div data-field-id="admins_list">
            <InlineError message={errors.admins_list} />
          </div>
          {form.admins.map((admin, index) => (
            <div key={admin.localId} className="space-y-3 border-b border-slate-200 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Admin {index + 1}
                </p>
                {form.admins.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        admins: prev.admins.filter((item) => item.localId !== admin.localId),
                      }))
                    }
                    className="text-xs font-medium text-rose-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <Field
                  label="Admin Email"
                  fieldId={`admin_${admin.localId}_email`}
                  error={errors[`admin_${admin.localId}_email`]}
                  requirement="required"
                >
                  <Input
                    type="email"
                    inputMode="email"
                    value={admin.email}
                    onChange={(e) => patchList('admins', admin.localId, { email: e.target.value })}
                    placeholder="admin@organization.com"
                  />
                </Field>
                <Field
                  label="Assigned Branch"
                  fieldId={`admin_${admin.localId}_branch`}
                  error={errors[`admin_${admin.localId}_branch`]}
                  requirement="required"
                >
                  <Select
                    value={admin.assignedBranch}
                    onChange={(e) => patchList('admins', admin.localId, { assignedBranch: e.target.value })}
                  >
                    <option value="">Select an option</option>
                    {branchOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="City / Town"
                  fieldId={`admin_${admin.localId}_city`}
                  error={errors[`admin_${admin.localId}_city`]}
                  requirement="required"
                >
                  <Input
                    value={admin.cityTown}
                    onChange={(e) => patchList('admins', admin.localId, { cityTown: e.target.value })}
                    placeholder="e.g. Mombasa"
                  />
                </Field>
                <Field
                  label="Max Requests"
                  fieldId={`admin_${admin.localId}_capacity`}
                  error={errors[`admin_${admin.localId}_capacity`]}
                  requirement="required"
                >
                  <Input
                    type="number"
                    value={admin.maxRequestsCapacity}
                    onChange={(e) =>
                      patchList('admins', admin.localId, { maxRequestsCapacity: e.target.value })
                    }
                    placeholder="e.g. 40"
                  />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                admins: [...prev.admins, createAdmin()],
              }))
            }
            className="inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Add Admin
          </button>
        </Card>
      )
    }

    if (step === 5) {
      return (
        <Card title="Which countries do you send clients to?">
          <div data-field-id="destination_list">
            <InlineError message={errors.destination_list} />
          </div>
          {form.destinationCountries.map((country, index) => (
            <div key={country.localId} className="space-y-3 border-b border-slate-200 pb-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Destination {index + 1}
                </p>
                {form.destinationCountries.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        destinationCountries: prev.destinationCountries.filter(
                          (item) => item.localId !== country.localId,
                        ),
                      }))
                    }
                    className="text-xs font-medium text-rose-700"
                  >
                    Remove
                  </button>
                )}
              </div>
              <Field
                label="Country Name"
                fieldId={`dest_${country.localId}_name`}
                error={errors[`dest_${country.localId}_name`]}
                requirement="required"
              >
                <Input
                  value={country.name}
                  onChange={(e) => patchDestination(country.localId, { name: e.target.value })}
                  placeholder="e.g. Canada"
                />
              </Field>
              <Field
                label="Tracks Offered"
                fieldId={`dest_${country.localId}_tracks`}
                error={errors[`dest_${country.localId}_tracks`]}
                requirement="required"
              >
                <div className="grid grid-cols-3 gap-2">
                  {SERVICE_ASSIGNMENT_TRACKS.map((track) => (
                    <Choice
                      key={`${country.localId}-${track}`}
                      active={(country.tracks || []).includes(track)}
                      onClick={() => toggleDestinationTrack(country.localId, track)}
                    >
                      {track}
                    </Choice>
                  ))}
                </div>
              </Field>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                destinationCountries: [
                  ...prev.destinationCountries,
                  createDestinationCountry(defaultDestinationTracksFromStep2),
                ],
              }))
            }
            className="inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Add Country
          </button>
        </Card>
      )
    }

    if (step === 6) {
      return (
        <Card title="What services do you offer per destination?">
          {form.destinationCountries.map((country, countryIndex) => (
            <div key={country.localId} className="space-y-3 border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={() =>
                  setExpandedServiceCountries((prev) => ({
                    ...prev,
                    [country.localId]: !prev[country.localId],
                  }))
                }
                className="flex w-full items-center justify-between text-left"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {country.name || `Destination ${countryIndex + 1}`}
                </p>
                <span className="text-xs font-semibold text-slate-500">
                  {expandedServiceCountries[country.localId] ? 'Hide' : 'Show'}
                </span>
              </button>
              <div data-field-id={`services_${country.localId}_list`}>
                <InlineError message={errors[`services_${country.localId}_list`]} />
              </div>

              {expandedServiceCountries[country.localId] && (
                <div className="mt-3 space-y-3">
                  {country.services.map((service, serviceIndex) => (
                    <div key={service.localId} className="space-y-3 border-l-2 border-slate-200 pl-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                          Service {serviceIndex + 1}
                        </p>
                        {country.services.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              patchDestination(country.localId, {
                                services: country.services.filter(
                                  (item) => item.localId !== service.localId,
                                ),
                              })
                            }
                            className="text-xs font-medium text-rose-700"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Field
                          label="Service Name"
                          fieldId={`service_${country.localId}_${service.localId}_name`}
                          error={errors[`service_${country.localId}_${service.localId}_name`]}
                          requirement="required"
                        >
                          <Input
                            value={service.serviceName}
                            onChange={(e) =>
                              patchCountryService(country.localId, service.localId, {
                                serviceName: e.target.value,
                              })
                            }
                            placeholder="e.g. Student Visa Guidance"
                            required
                          />
                        </Field>
                        <Field
                          label="Description"
                          fieldId={`service_${country.localId}_${service.localId}_description`}
                          error={errors[`service_${country.localId}_${service.localId}_description`]}
                          requirement="required"
                        >
                          <Textarea
                            rows={3}
                            value={service.description}
                            onChange={(e) =>
                              patchCountryService(country.localId, service.localId, {
                                description: e.target.value,
                              })
                            }
                            placeholder="Describe what this service includes"
                            required
                          />
                        </Field>
                        <Field
                          label="Required Information"
                          fieldId={`service_${country.localId}_${service.localId}_required_information`}
                          error={errors[`service_${country.localId}_${service.localId}_required_information`]}
                          requirement="required"
                        >
                          <Textarea
                            rows={3}
                            value={service.requiredInformation}
                            onChange={(e) =>
                              patchCountryService(country.localId, service.localId, {
                                requiredInformation: e.target.value,
                              })
                            }
                            placeholder="What additional information or documents do you need from clients?"
                          />
                        </Field>
                        <Field label="Estimated Processing Time" requirement="optional">
                          <Input
                            value={service.estimatedProcessingTime}
                            onChange={(e) =>
                              patchCountryService(country.localId, service.localId, {
                                estimatedProcessingTime: e.target.value,
                              })
                            }
                            placeholder="e.g. 3 - 6 weeks"
                          />
                        </Field>
                        <Field
                          label="Tracks"
                          fieldId={`service_${country.localId}_${service.localId}_tracks`}
                          error={errors[`service_${country.localId}_${service.localId}_tracks`]}
                          requirement="required"
                        >
                          {normalizeCountryTracks(country.tracks).length === 0 ? (
                            <p className="text-xs text-slate-500">
                              Select tracks for this country in the previous step.
                            </p>
                          ) : normalizeCountryTracks(country.tracks).length === 1 ? (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
                              {normalizeCountryTracks(country.tracks)[0]} (auto-selected)
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {normalizeCountryTracks(country.tracks).map((track) => (
                                <Choice
                                  key={track}
                                  active={service.tracks.includes(track)}
                                  onClick={() =>
                                    toggleServiceTrack(country.localId, service.localId, track)
                                  }
                                >
                                  {track}
                                </Choice>
                              ))}
                            </div>
                          )}
                        </Field>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      patchDestination(country.localId, {
                        services: [...country.services, createService(country.tracks || [])],
                      })
                    }
                    className="inline-flex items-center text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                  >
                    Add Service
                  </button>
                </div>
              )}
            </div>
          ))}
        </Card>
      )
    }

    if (step === 7) {
      return (
        <Card
          title="Provide details for each destination"
          subtitle="This helps clients understand and choose the right destination."
        >
          {form.destinationCountries.map((country, index) => (
            <div key={country.localId} className="space-y-3 border-b border-slate-200 pb-4">
              <button
                type="button"
                onClick={() =>
                  setExpandedDetailCountries((prev) => ({
                    ...prev,
                    [country.localId]: !prev[country.localId],
                  }))
                }
                className="flex w-full items-center justify-between text-left"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {country.name || `Destination ${index + 1}`}
                </p>
                <span className="text-xs font-semibold text-slate-500">
                  {expandedDetailCountries[country.localId] ? 'Hide' : 'Show'}
                </span>
              </button>

              {expandedDetailCountries[country.localId] && (
                <div className="mt-3 space-y-3">
                  <Field
                    label="Why choose this country?"
                    fieldId={`details_${country.localId}_why`}
                    error={errors[`details_${country.localId}_why`]}
                    requirement="optional"
                  >
                    <Textarea
                      value={country.details.whyChooseCountry}
                      onChange={(e) => patchDestinationDetails(country.localId, 'whyChooseCountry', e.target.value)}
                      placeholder="Explain what makes this destination attractive"
                    />
                  </Field>
                  <Field
                    label="Top opportunities / fields"
                    fieldId={`details_${country.localId}_top`}
                    error={errors[`details_${country.localId}_top`]}
                    requirement="required"
                  >
                    <Input
                      value={country.details.topCareerFields}
                      onChange={(e) => patchDestinationDetails(country.localId, 'topCareerFields', e.target.value)}
                      placeholder="e.g. Nursing, IT, Hospitality"
                    />
                  </Field>
                  <Field
                    label="Visa processing time"
                    fieldId={`details_${country.localId}_visa`}
                    error={errors[`details_${country.localId}_visa`]}
                    requirement="required"
                  >
                    <Input
                      value={country.details.visaProcessingTime}
                      onChange={(e) => patchDestinationDetails(country.localId, 'visaProcessingTime', e.target.value)}
                      placeholder="e.g. 4 weeks"
                    />
                  </Field>
                  <Field label="Total process duration" requirement="optional">
                    <Input
                      value={country.details.totalProcessTime}
                      onChange={(e) => patchDestinationDetails(country.localId, 'totalProcessTime', e.target.value)}
                      placeholder="e.g. 2 - 4 months"
                    />
                  </Field>
                  <Field label="Visa success rate (%)" requirement="optional">
                    <Input
                      value={country.details.visaSuccessRate}
                      onChange={(e) => patchDestinationDetails(country.localId, 'visaSuccessRate', e.target.value)}
                      placeholder="e.g. 85"
                    />
                  </Field>
                  <Field label="Scholarship availability (%)" requirement="optional">
                    <Input
                      value={country.details.scholarshipAvailabilityPercent}
                      onChange={(e) =>
                        patchDestinationDetails(
                          country.localId,
                          'scholarshipAvailabilityPercent',
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 30"
                    />
                  </Field>
                  <Field
                    label="Estimated total cost"
                    fieldId={`details_${country.localId}_cost`}
                    error={errors[`details_${country.localId}_cost`]}
                    requirement="required"
                  >
                    <Input
                      value={country.details.costEstimate}
                      onChange={(e) => patchDestinationDetails(country.localId, 'costEstimate', e.target.value)}
                      placeholder="e.g. USD 8,000 - 12,000"
                    />
                  </Field>
                  <Field label="Recommended starting budget" requirement="optional">
                    <Input
                      value={country.details.startingBudget}
                      onChange={(e) => patchDestinationDetails(country.localId, 'startingBudget', e.target.value)}
                      placeholder="e.g. USD 2,500"
                    />
                  </Field>
                  <Field label="Key requirements" requirement="optional">
                    <Textarea
                      value={country.details.requirements}
                      onChange={(e) => patchDestinationDetails(country.localId, 'requirements', e.target.value)}
                      placeholder="List key documents or eligibility requirements"
                    />
                  </Field>
                  <Field label="Additional notes" requirement="optional">
                    <Textarea
                      value={country.details.notes}
                      onChange={(e) => patchDestinationDetails(country.localId, 'notes', e.target.value)}
                      placeholder="Any extra guidance clients should know"
                    />
                  </Field>

                  <div className="border-l-2 border-slate-200 pl-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      Select Track
                    </p>
                    <div className="mt-3 space-y-3">
                      {normalizeCountryTracks(country.tracks).length === 0 && (
                        <p className="text-xs text-slate-500">
                          Select tracks for this country in the previous step.
                        </p>
                      )}

                      {normalizeCountryTracks(country.tracks).length === 1 && (() => {
                        const track = normalizeCountryTracks(country.tracks)[0]
                        const isSelected = Boolean(country.details.trackOverrides?.[track]?.enabled)
                        return (
                          <div key={track} className="py-1">
                            <p className="text-sm font-medium text-emerald-900">
                              {track} {isSelected ? 'selected' : 'selected automatically'}
                            </p>
                          </div>
                        )
                      })()}

                      {normalizeCountryTracks(country.tracks).length > 1 &&
                        normalizeCountryTracks(country.tracks).map((track) => {
                          const override = country.details.trackOverrides?.[track] || {
                            enabled: false,
                          }
                          return (
                            <div key={track} className="py-1">
                              <Choice
                                active={override.enabled}
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    destinationCountries: prev.destinationCountries.map((item) =>
                                      item.localId === country.localId
                                        ? {
                                            ...item,
                                            details: {
                                              ...item.details,
                                              trackOverrides: {
                                                ...normalizeTrackOverrides(
                                                  item.details.trackOverrides,
                                                  item.tracks,
                                                ),
                                                [track]: {
                                                  enabled: !override.enabled,
                                                },
                                              },
                                            },
                                          }
                                        : item,
                                    ),
                                  }))
                                }
                              >
                                {track}
                              </Choice>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )
    }

    if (step === 8) {
      return (
        <Card title="Your proposed commission (%)">
          <Field
            label="Proposed Commission (%)"
            helperText="This will be discussed and finalized later."
            fieldId="proposed_commission"
            error={errors.proposed_commission}
            requirement="required"
          >
            <Input
              type="number"
              value={form.proposedCommission}
              onChange={(e) => setForm((prev) => ({ ...prev, proposedCommission: e.target.value }))}
              placeholder="e.g. 10"
            />
          </Field>
        </Card>
      )
    }

    if (step === 9) {
      return (
        <Card title="How do you usually receive payments?">
          <p className="text-xs font-medium text-slate-600">Payment Method (Required)</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" data-field-id="payment_methods">
            {PAYMENT_METHODS.map((method) => (
              <Choice
                key={method}
                active={form.paymentMethods.includes(method)}
                onClick={() => toggleInArray('paymentMethods', method)}
              >
                {method}
              </Choice>
            ))}
          </div>
          <InlineError message={errors.payment_methods} />
        </Card>
      )
    }

    if (step === 10) {
      return (
        <Card title="When are you available?">
          <div data-field-id="operating_days">
            <p className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
              <span>Days Open</span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700">
                Required
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DAYS.map((day) => (
                <Choice
                  key={day}
                  active={form.operatingHours.daysOpen.includes(day)}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </Choice>
              ))}
            </div>
            <InlineError message={errors.operating_days} />
          </div>
          <Field
            label="Opening Time"
            fieldId="operating_open"
            error={errors.operating_open}
            requirement="required"
          >
            <Input
              type="time"
              value={form.operatingHours.openingTime}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  operatingHours: { ...prev.operatingHours, openingTime: e.target.value },
                }))
              }
              placeholder="Select opening time"
            />
          </Field>
          <Field
            label="Closing Time"
            fieldId="operating_close"
            error={errors.operating_close}
            requirement="required"
          >
            <Input
              type="time"
              value={form.operatingHours.closingTime}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  operatingHours: { ...prev.operatingHours, closingTime: e.target.value },
                }))
              }
              placeholder="Select closing time"
            />
          </Field>
        </Card>
      )
    }

    return (
      <Card title="Agreement">
        <p className="text-xs font-medium text-slate-600">Agreement Confirmation (Required)</p>
        <label
          className={`flex items-start gap-3 rounded-xl border bg-white p-3 ${
            errors.agreement ? 'border-rose-300' : 'border-slate-200'
          }`}
          data-field-id="agreement"
        >
          <input
            type="checkbox"
            checked={form.agreementAccepted}
            onChange={(e) => setForm((prev) => ({ ...prev, agreementAccepted: e.target.checked }))}
            className="mt-1"
          />
          <span className="text-sm text-slate-700">
            I confirm that the information provided is accurate and I will handle clients
            professionally.
          </span>
        </label>
        <InlineError message={errors.agreement} />
      </Card>
    )
  }

  if (status.type === 'success' && submittedSnapshot) {
    return (
      <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
          Submitted Successfully
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-emerald-900">
          Your partner profile is in review
        </h2>
        <p className="mt-2 text-sm leading-6 text-emerald-900/90">
          Thank you for submitting your onboarding profile. We will get back to you soon as soon as
          we review your profile.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => downloadPartnerSubmissionPdf(submittedSnapshot)}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Download Submission
          </button>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="px-1">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Step {step + 1} of {STEPS.length}
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{STEPS[step]}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {renderStep()}

      {status.message && (
        <p
          className={`text-sm ${
            status.type === 'error'
              ? 'text-rose-700'
              : status.type === 'success'
                ? 'text-emerald-700'
                : 'text-slate-600'
          }`}
        >
          {status.message}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
          disabled={step === 0}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
        >
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            aria-disabled={!canProceedStep}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
              canProceedStep
                ? 'bg-emerald-700'
                : 'cursor-not-allowed bg-slate-300'
            }`}
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={status.type === 'loading' || !canProceedStep}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {status.type === 'loading' ? 'Submitting...' : 'Submit Onboarding'}
          </button>
        )}
      </div>
    </form>
  )
}







