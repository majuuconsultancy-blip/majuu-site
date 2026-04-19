import { checkAdminAccess } from './admin'
import { isSupabaseConfigured, supabase } from './client'

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Confirm VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.',
    )
  }

  return supabase
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

const TRACK_OPTIONS = ['Study', 'Work', 'Travel']

function normalizeTracks(tracks) {
  const allowed = new Set(TRACK_OPTIONS)
  const list = Array.isArray(tracks) ? tracks : []
  return [...new Set(list.filter((track) => allowed.has(track)))].sort(
    (a, b) => TRACK_OPTIONS.indexOf(a) - TRACK_OPTIONS.indexOf(b),
  )
}

function normalizeServiceTracks(serviceTracks, countryTracks) {
  const allowed = normalizeTracks(countryTracks)
  if (allowed.length === 1) {
    return [allowed[0]]
  }
  if (!allowed.length) {
    return []
  }
  const allowedSet = new Set(allowed)
  return normalizeTracks(serviceTracks).filter((track) => allowedSet.has(track))
}

function isInsertRlsError(error, tableName) {
  const message = String(error?.message ?? '').toLowerCase()
  return (
    message.includes('violates row-level security policy') &&
    message.includes(`table "${tableName}"`)
  )
}

function toFriendlySubmissionError(error) {
  const rawMessage = String(error?.message ?? '').toLowerCase()
  if (rawMessage.includes('failed to fetch') || rawMessage.includes('networkerror')) {
    return new Error('Something went wrong while submitting. Please try again.')
  }

  return error
}

function isMissingPartnerColumnsError(error) {
  const message = String(error?.message ?? '').toLowerCase()
  return (
    (message.includes('schema cache') &&
      (message.includes('business_status') ||
        message.includes('home_country') ||
        message.includes('home_countries'))) ||
    message.includes('column partners.business_status does not exist') ||
    message.includes('column partners.home_country does not exist') ||
    message.includes('column partners.home_countries does not exist')
  )
}

function isMissingServiceColumnsError(error) {
  const message = String(error?.message ?? '').toLowerCase()
  return (
    (message.includes('schema cache') &&
      (message.includes('destination_country') ||
        message.includes('required_information') ||
        message.includes('tracks'))) ||
    message.includes('column services.destination_country does not exist') ||
    message.includes('column services.required_information does not exist') ||
    message.includes('column services.tracks does not exist')
  )
}

export async function createPartnerOnboardingSubmission(payload) {
  const client = requireSupabase()
  const homeCountries = Array.isArray(payload.homeCountries) ? payload.homeCountries : []
  const branchCountryByName = new Map(
    (payload.branches ?? []).map((branch) => [
      normalizeText(branch.branchName),
      normalizeText(branch.country),
    ]),
  )

  const partnerInsert = {
    organization_name: normalizeText(payload.organizationName),
    business_status: normalizeText(payload.businessStatus) || null,
    email: normalizeText(payload.contactEmail).toLowerCase(),
    phone_number: normalizeText(payload.contactPhone),
    home_country: normalizeText(homeCountries[0]) || null,
    home_countries: homeCountries,
    website: normalizeText(payload.website) || null,
    description: normalizeText(payload.description) || null,
    service_tracks: payload.serviceTracks ?? [],
    proposed_commission: Number(payload.proposedCommission || 0),
    payment_details: {
      methods: payload.paymentMethods ?? [],
    },
    operating_hours: payload.operatingHours ?? {},
    agreement_accepted: Boolean(payload.agreementAccepted),
    status: 'pending',
  }

  if (!partnerInsert.organization_name || !partnerInsert.email) {
    throw new Error('Organization name and contact email are required.')
  }

  let { data: partner, error: partnerError } = await client
    .from('partners')
    .insert(partnerInsert)
    .select('id')
    .single()

  if (partnerError && isMissingPartnerColumnsError(partnerError)) {
    const fallbackPartnerInsert = {
      organization_name: partnerInsert.organization_name,
      email: partnerInsert.email,
      phone_number: partnerInsert.phone_number,
      website: partnerInsert.website,
      description: partnerInsert.description,
      service_tracks: partnerInsert.service_tracks,
      proposed_commission: partnerInsert.proposed_commission,
      payment_details: partnerInsert.payment_details,
      operating_hours: partnerInsert.operating_hours,
      agreement_accepted: partnerInsert.agreement_accepted,
      status: partnerInsert.status,
    }

    const fallbackResult = await client
      .from('partners')
      .insert(fallbackPartnerInsert)
      .select('id')
      .single()

    partner = fallbackResult.data
    partnerError = fallbackResult.error
  }

  if (partnerError) {
    if (isInsertRlsError(partnerError, 'partners')) {
      throw new Error(
        'Submission is blocked by missing partner insert policies. Apply the latest SQL policy updates and retry.',
      )
    }
    throw toFriendlySubmissionError(partnerError)
  }

  const partnerId = partner.id

  const countryIdMap = new Map()

  for (const country of payload.destinationCountries ?? []) {
    const countryName = normalizeText(country.name)
    const countryTracks = normalizeTracks(country.tracks)
    if (!countryName) {
      continue
    }

    const { data: insertedCountry, error: countryError } = await client
      .from('countries')
      .insert({
        partner_id: partnerId,
        name: countryName,
      })
      .select('id')
      .single()

    if (countryError) {
      if (isInsertRlsError(countryError, 'countries')) {
        throw new Error(
          'Submission is blocked by missing country insert policies. Apply the latest SQL policy updates and retry.',
        )
      }
      throw toFriendlySubmissionError(countryError)
    }

    countryIdMap.set(String(country.localId), insertedCountry.id)

    const details = country.details ?? {}
    const { error: detailError } = await client.from('country_details').insert({
      country_id: insertedCountry.id,
      why_choose_country: normalizeText(details.whyChooseCountry) || null,
      top_career_fields: normalizeText(details.topCareerFields) || null,
      visa_processing_time: normalizeText(details.visaProcessingTime) || null,
      total_process_time: normalizeText(details.totalProcessTime) || null,
      visa_acceptance_rate: normalizeText(details.visaSuccessRate) || null,
      scholarship_availability_percent: normalizeText(details.scholarshipAvailabilityPercent) || null,
      cost_estimate: normalizeText(details.costEstimate) || null,
      starting_budget: normalizeText(details.startingBudget) || null,
      requirements: normalizeText(details.requirements) || null,
      notes: normalizeText(details.notes) || null,
      details_json: {
        ...details,
        countryTracks,
      },
    })

    if (detailError) {
      throw toFriendlySubmissionError(detailError)
    }
  }

  const branchesPayload = (payload.branches ?? [])
    .map((branch) => ({
      partner_id: partnerId,
      branch_name: normalizeText(branch.branchName),
      country: normalizeText(branch.country),
      city_town: normalizeText(branch.cityTown) || null,
      primary_county: normalizeText(branch.primaryCounty) || null,
      secondary_counties: branch.nearbyCountiesServed
        ? String(branch.nearbyCountiesServed)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    }))
    .filter((branch) => branch.branch_name)

  if (branchesPayload.length) {
    const { error: branchesError } = await client.from('branches').insert(branchesPayload)

    if (branchesError) {
      if (isInsertRlsError(branchesError, 'branches')) {
        throw new Error(
          'Submission is blocked by missing branch insert policies. Apply the latest SQL policy updates and retry.',
        )
      }
      throw toFriendlySubmissionError(branchesError)
    }
  }

  const servicesPayload = (payload.destinationCountries ?? [])
    .flatMap((country) => {
      const countryTracks = normalizeTracks(country.tracks)
      return (country.services ?? []).map((service) => ({
        partner_id: partnerId,
        destination_country: normalizeText(country.name) || null,
        service_name: normalizeText(service.serviceName),
        description: normalizeText(service.description) || null,
        required_information: normalizeText(service.requiredInformation) || null,
        tracks: normalizeServiceTracks(service.tracks, countryTracks),
        requirements_json: normalizeText(service.requiredInformation)
          ? { required_information: normalizeText(service.requiredInformation) }
          : {},
        estimated_processing_time: normalizeText(service.estimatedProcessingTime) || null,
        notes: null,
      }))
    })
    .filter((service) => service.service_name)

  if (servicesPayload.length) {
    let { error: servicesError } = await client.from('services').insert(servicesPayload)

    if (servicesError && isMissingServiceColumnsError(servicesError)) {
      const fallbackServicesPayload = servicesPayload.map((service) => ({
        partner_id: service.partner_id,
        service_name: service.service_name,
        description: service.description,
        requirements_json: service.requirements_json,
        estimated_processing_time: service.estimated_processing_time,
        notes: service.notes,
      }))

      const fallbackServicesResult = await client.from('services').insert(fallbackServicesPayload)
      servicesError = fallbackServicesResult.error
    }

    if (servicesError) {
      if (isInsertRlsError(servicesError, 'services')) {
        throw new Error(
          'Submission is blocked by missing service insert policies. Apply the latest SQL policy updates and retry.',
        )
      }
      throw toFriendlySubmissionError(servicesError)
    }
  }

  const adminsPayload = (payload.admins ?? [])
    .map((admin) => ({
      partner_id: partnerId,
      email: normalizeText(admin.email).toLowerCase(),
      assigned_branch: normalizeText(admin.assignedBranch) || null,
      stationed_country:
        branchCountryByName.get(normalizeText(admin.assignedBranch)) ||
        normalizeText(homeCountries[0]) ||
        null,
      city_town: normalizeText(admin.cityTown) || null,
      max_requests_capacity:
        admin.maxRequestsCapacity === '' || admin.maxRequestsCapacity === null
          ? null
          : Number(admin.maxRequestsCapacity),
    }))
    .filter((admin) => admin.email)

  if (adminsPayload.length) {
    const { error: adminsError } = await client.from('admins').insert(adminsPayload)

    if (adminsError) {
      if (isInsertRlsError(adminsError, 'admins')) {
        throw new Error(
          'Submission is blocked by missing admin insert policies. Apply the latest SQL policy updates and retry.',
        )
      }
      throw toFriendlySubmissionError(adminsError)
    }
  }

  return {
    partnerId,
    countryIdMap,
  }
}

export async function getPartnerAdminSnapshot() {
  const client = requireSupabase()

  const access = await checkAdminAccess()
  if (!access.authorized) {
    throw new Error('Access denied.')
  }

  const [
    partnersResult,
    countriesResult,
    waitlistResult,
    referralsResult,
    feedbackResult,
    settingsResult,
  ] = await Promise.all([
    client
      .from('partners')
      .select('id, organization_name, email, proposed_commission, status, created_at')
      .order('created_at', { ascending: false }),
    client.from('countries').select('partner_id, name'),
    client
      .from('waitlist_signups')
      .select('id, full_name, email, phone_number, created_at')
      .order('created_at', { ascending: false }),
    client
      .from('referrals')
      .select('id, referrer_email, referred_email, points, created_at')
      .order('created_at', { ascending: false }),
    client
      .from('feedback_entries')
      .select('id, name, email, message, created_at')
      .order('created_at', { ascending: false }),
    client.from('landing_settings').select('key, enabled').eq('key', 'downloads_enabled').maybeSingle(),
  ])

  if (partnersResult.error) throw partnersResult.error
  if (countriesResult.error) throw countriesResult.error
  if (waitlistResult.error) throw waitlistResult.error
  if (referralsResult.error) throw referralsResult.error
  if (feedbackResult.error) throw feedbackResult.error
  if (settingsResult.error) throw settingsResult.error

  const countriesByPartner = new Map()
  for (const row of countriesResult.data ?? []) {
    const list = countriesByPartner.get(row.partner_id) ?? []
    list.push(row.name)
    countriesByPartner.set(row.partner_id, list)
  }

  const partners = (partnersResult.data ?? []).map((partner) => ({
    ...partner,
    countries: countriesByPartner.get(partner.id) ?? [],
  }))

  const referralMap = new Map()
  for (const referral of referralsResult.data ?? []) {
    const email = String(referral.referrer_email ?? '').toLowerCase()
    if (!email) continue

    const existing = referralMap.get(email) ?? {
      referrer_email: email,
      total_referrals: 0,
      total_points: 0,
    }
    existing.total_referrals += 1
    existing.total_points += Number(referral.points ?? 0)
    referralMap.set(email, existing)
  }

  const referrals = Array.from(referralMap.values()).sort(
    (a, b) => b.total_referrals - a.total_referrals,
  )

  return {
    stats: {
      totalPartners: partners.length,
      totalWaitlistUsers: (waitlistResult.data ?? []).length,
      totalReferrals: (referralsResult.data ?? []).length,
    },
    downloadsEnabled: Boolean(settingsResult.data?.enabled),
    partners,
    waitlist: waitlistResult.data ?? [],
    referrals,
    feedback: feedbackResult.data ?? [],
  }
}

export async function getPartnerDetails(partnerId) {
  const client = requireSupabase()

  const [partnerResult, countriesResult, detailsResult, branchesResult, servicesResult, adminsResult] =
    await Promise.all([
      client.from('partners').select('*').eq('id', partnerId).single(),
      client.from('countries').select('*').eq('partner_id', partnerId),
      client
        .from('country_details')
        .select('*, countries!inner(id, partner_id, name)')
        .eq('countries.partner_id', partnerId),
      client.from('branches').select('*').eq('partner_id', partnerId),
      client.from('services').select('*').eq('partner_id', partnerId),
      client.from('admins').select('*').eq('partner_id', partnerId),
    ])

  if (partnerResult.error) throw partnerResult.error
  if (countriesResult.error) throw countriesResult.error
  if (detailsResult.error) throw detailsResult.error
  if (branchesResult.error) throw branchesResult.error
  if (servicesResult.error) throw servicesResult.error
  if (adminsResult.error) throw adminsResult.error

  const detailsByCountryId = new Map(
    (detailsResult.data ?? []).map((detail) => [detail.country_id, detail]),
  )

  const countries = (countriesResult.data ?? []).map((country) => ({
    ...country,
    detail: detailsByCountryId.get(country.id) ?? null,
  }))

  return {
    partner: partnerResult.data,
    countries,
    branches: branchesResult.data ?? [],
    services: servicesResult.data ?? [],
    admins: adminsResult.data ?? [],
  }
}

export async function lookupReferralsByEmail(email) {
  const client = requireSupabase()
  const normalizedEmail = normalizeText(email).toLowerCase()

  if (!normalizedEmail) {
    throw new Error('Email is required.')
  }

  const { data, error } = await client
    .from('referrals')
    .select('referred_email, points, created_at')
    .eq('referrer_email', normalizedEmail)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const referrals = data ?? []
  const points = referrals.reduce((sum, row) => sum + Number(row.points ?? 0), 0)

  return {
    referrerEmail: normalizedEmail,
    totalReferrals: referrals.length,
    points,
    referredUsers: referrals,
  }
}

