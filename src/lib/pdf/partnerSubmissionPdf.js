function safeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?')
}

function wrapLine(text, maxLength = 92) {
  const clean = safeText(text)
  if (!clean) {
    return ['']
  }

  const words = clean.split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxLength) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function escapePdfString(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildSubmissionLines(snapshot) {
  const lines = []
  const branchCountryByName = new Map(
    (snapshot.branches || []).map((branch) => [String(branch.branchName || ''), branch.country || '-']),
  )
  const push = (text = '') => {
    wrapLine(text).forEach((line) => lines.push(line))
  }

  const pushSection = (title) => {
    if (lines.length) lines.push('')
    push(title)
  }

  push('MAJUU Partner Onboarding Submission')
  push(`Generated: ${new Date(snapshot.submittedAt || Date.now()).toLocaleString('en-KE')}`)

  pushSection('Organization Info')
  push(`Organization Name: ${snapshot.organizationName || '-'}`)
  push(`Business Status: ${snapshot.businessStatus || '-'}`)
  push(`Contact Email: ${snapshot.contactEmail || '-'}`)
  push(`Phone Number: ${snapshot.contactPhone || '-'}`)
  push(`Website: ${snapshot.website || '-'}`)
  push(`Description: ${snapshot.description || '-'}`)

  pushSection('Services')
  push(`What You Help With: ${(snapshot.serviceTracks || []).join(', ') || '-'}`)

  pushSection('Home Country')
  push((snapshot.homeCountries || []).join(', ') || snapshot.homeCountry || '-')

  pushSection('Branches')
  if (!snapshot.branches?.length) {
    push('-')
  } else {
    snapshot.branches.forEach((branch, index) => {
      push(`Branch ${index + 1}: ${branch.branchName || '-'}`)
      push(`  Country: ${branch.country || '-'}`)
      push(`  City / Town: ${branch.cityTown || '-'}`)
      push(`  Primary County: ${branch.primaryCounty || '-'}`)
      push(`  Nearby Counties Served: ${branch.nearbyCountiesServed || '-'}`)
    })
  }

  pushSection('Admins')
  if (!snapshot.admins?.length) {
    push('-')
  } else {
    snapshot.admins.forEach((admin, index) => {
      push(`Admin ${index + 1}: ${admin.email || '-'}`)
      push(`  Assigned Branch: ${admin.assignedBranch || '-'}`)
      push(`  Country: ${branchCountryByName.get(admin.assignedBranch || '') || '-'}`)
      push(`  City / Town: ${admin.cityTown || '-'}`)
      push(`  Max Requests Capacity: ${admin.maxRequestsCapacity || '-'}`)
    })
  }

  pushSection('Destination Countries')
  if (!snapshot.destinationCountries?.length) {
    push('-')
  } else {
    snapshot.destinationCountries.forEach((country, index) => {
      push(`${index + 1}. ${country.name || '-'}`)
      push(`   Tracks Offered: ${(country.tracks || []).join(', ') || '-'}`)
    })
  }

  pushSection('Services per Country')
  if (!snapshot.destinationCountries?.length) {
    push('-')
  } else {
    snapshot.destinationCountries.forEach((country) => {
      push(`Country: ${country.name || '-'}`)
      if (!country.services?.length) {
        push('  - No services listed')
      } else {
        country.services.forEach((service, index) => {
          push(`  Service ${index + 1}: ${service.serviceName || '-'}`)
          push(`    Description: ${service.description || '-'}`)
          push(`    Required Information: ${service.requiredInformation || '-'}`)
          push(`    Estimated Processing Time: ${service.estimatedProcessingTime || '-'}`)
          push(`    Tracks: ${(service.tracks || []).join(', ') || '-'}`)
        })
      }
    })
  }

  pushSection('Country Details')
  if (!snapshot.destinationCountries?.length) {
    push('-')
  } else {
    snapshot.destinationCountries.forEach((country) => {
      const details = country.details || {}
      push(`Country: ${country.name || '-'}`)
      push(`  Why choose this country?: ${details.whyChooseCountry || '-'}`)
      push(`  Top opportunities / fields: ${details.topCareerFields || '-'}`)
      push(`  Visa processing time: ${details.visaProcessingTime || '-'}`)
      push(`  Total process duration: ${details.totalProcessTime || '-'}`)
      push(`  Visa success rate (%): ${details.visaSuccessRate || '-'}`)
      push(`  Scholarship availability (%): ${details.scholarshipAvailabilityPercent || '-'}`)
      push(`  Estimated total cost: ${details.costEstimate || '-'}`)
      push(`  Recommended starting budget: ${details.startingBudget || '-'}`)
      push(`  Key requirements: ${details.requirements || '-'}`)
      push(`  Additional notes: ${details.notes || '-'}`)
      const trackOverrides = details.trackOverrides || {}
      const enabledOverrides = Object.entries(trackOverrides).filter(([, value]) => value?.enabled)
      if (enabledOverrides.length) {
        enabledOverrides.forEach(([track, value]) => {
          push(`  ${track} notes: ${value.notes || '-'}`)
        })
      }
    })
  }

  pushSection('Commission')
  push(`${snapshot.proposedCommission || '-'}%`)

  pushSection('Payment Method')
  push((snapshot.paymentMethods || []).join(', ') || '-')

  pushSection('Operating Hours')
  push(`Days Open: ${(snapshot.operatingHours?.daysOpen || []).join(', ') || '-'}`)
  push(`Opening Time: ${snapshot.operatingHours?.openingTime || '-'}`)
  push(`Closing Time: ${snapshot.operatingHours?.closingTime || '-'}`)

  pushSection('Agreement')
  push(snapshot.agreementAccepted ? 'Accepted' : 'Not accepted')

  return lines
}

function buildPdf(lines) {
  const pageHeight = 842
  const startY = 790
  const lineHeight = 14
  const linesPerPage = Math.floor((startY - 50) / lineHeight)
  const pages = []

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage))
  }

  const objects = []
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'

  const fontObjectId = 3
  const firstPageId = 4
  const pageKids = []

  pages.forEach((pageLines, pageIndex) => {
    const pageId = firstPageId + pageIndex * 2
    const contentId = pageId + 1
    pageKids.push(`${pageId} 0 R`)

    const streamLines = ['BT', '/F1 11 Tf', `50 ${startY} Td`, `${lineHeight} TL`]
    pageLines.forEach((line, lineIndex) => {
      const escaped = escapePdfString(line || ' ')
      if (lineIndex === 0) {
        streamLines.push(`(${escaped}) Tj`)
      } else {
        streamLines.push(`T* (${escaped}) Tj`)
      }
    })
    streamLines.push('ET')

    const streamContent = `${streamLines.join('\n')}\n`
    objects[contentId] = `<< /Length ${new TextEncoder().encode(streamContent).length} >>\nstream\n${streamContent}endstream`
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 ${pageHeight}] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R >>`
  })

  objects[2] = `<< /Type /Pages /Kids [${pageKids.join(' ')}] /Count ${pages.length} >>`
  objects[fontObjectId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    offsets[objectId] = new TextEncoder().encode(pdf).length
    pdf += `${objectId} 0 obj\n${objects[objectId]}\nendobj\n`
  }

  const xrefOffset = new TextEncoder().encode(pdf).length
  pdf += `xref\n0 ${objects.length}\n`
  pdf += '0000000000 65535 f \n'

  for (let objectId = 1; objectId < objects.length; objectId += 1) {
    pdf += `${String(offsets[objectId]).padStart(10, '0')} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

export function downloadPartnerSubmissionPdf(snapshot) {
  const lines = buildSubmissionLines(snapshot)
  const blob = buildPdf(lines)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `partner-submission-${Date.now()}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
