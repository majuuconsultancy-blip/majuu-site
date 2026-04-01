import { useEffect, useMemo, useState } from 'react'
import {
  communityContent,
  contactContent,
  downloadNoticeContent,
  downloadSectionContent,
  footerContent,
  heroContent,
  howItWorksContent,
  phoneShowcaseContent,
  siteHeaderContent,
  solutionContent,
  whatIsMajuuContent,
  whyMajuuMattersContent,
} from './data/landingContent'
import { AdminApp } from './components/admin/AdminApp'
import { ContactSection } from './components/sections/ContactSection'
import { DownloadCtaSection } from './components/sections/DownloadCtaSection'
import { EmailCaptureSection } from './components/sections/EmailCaptureSection'
import { FooterSection } from './components/sections/FooterSection'
import { HeroSection } from './components/sections/HeroSection'
import { HowItWorksSection } from './components/sections/HowItWorksSection'
import { PainPointsSection } from './components/sections/PainPointsSection'
import { PhoneShowcaseSection } from './components/sections/PhoneShowcaseSection'
import { SiteHeader } from './components/sections/SiteHeader'
import { SolutionSection } from './components/sections/SolutionSection'
import { WhatIsMajuuSection } from './components/sections/WhatIsMajuuSection'
import { DownloadNoticeModal } from './components/ui/DownloadNoticeModal'
import {
  getDownloadsEnabled,
  incrementSiteVisitCount,
} from './lib/supabase/landing'

const visitStorageKey = 'majuu-site-visitor-v1'

function App() {
  const isAdminRoute =
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  const [isDownloadNoticeOpen, setIsDownloadNoticeOpen] = useState(false)
  const [downloadsEnabled, setDownloadsEnabled] = useState(
    siteHeaderContent.downloadsEnabled,
  )

  useEffect(() => {
    if (isAdminRoute) {
      return
    }

    let isMounted = true

    getDownloadsEnabled()
      .then((enabled) => {
        if (isMounted) {
          setDownloadsEnabled(enabled)
        }
      })
      .catch(() => {
        if (isMounted) {
          setDownloadsEnabled(siteHeaderContent.downloadsEnabled)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isAdminRoute])

  useEffect(() => {
    if (isAdminRoute || typeof window === 'undefined') {
      return
    }

    if (window.localStorage.getItem(visitStorageKey)) {
      return
    }

    incrementSiteVisitCount()
      .then(() => {
        window.localStorage.setItem(visitStorageKey, '1')
      })
      .catch(() => {
        // Leave the metric best-effort only.
      })
  }, [isAdminRoute])

  const resolvedHeaderContent = useMemo(
    () => ({
      ...siteHeaderContent,
      downloadsEnabled,
    }),
    [downloadsEnabled],
  )

  const resolvedDownloadContent = useMemo(
    () => ({
      ...downloadSectionContent,
      downloadsEnabled,
    }),
    [downloadsEnabled],
  )

  if (isAdminRoute) {
    return <AdminApp />
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-950">
      <SiteHeader
        content={resolvedHeaderContent}
        onDownloadUnavailable={() => setIsDownloadNoticeOpen(true)}
      />

      <main>
        <HeroSection content={heroContent} />
        <WhatIsMajuuSection content={whatIsMajuuContent} />
        <PhoneShowcaseSection content={phoneShowcaseContent} />
        <PainPointsSection content={whyMajuuMattersContent} />
        <SolutionSection content={solutionContent} />
        <HowItWorksSection content={howItWorksContent} />
        <DownloadCtaSection
          content={resolvedDownloadContent}
          onDownloadUnavailable={() => setIsDownloadNoticeOpen(true)}
        />
        <EmailCaptureSection content={communityContent} />
        <ContactSection content={contactContent} />
      </main>

      <FooterSection content={footerContent} />

      <DownloadNoticeModal
        content={downloadNoticeContent}
        open={isDownloadNoticeOpen}
        onClose={() => setIsDownloadNoticeOpen(false)}
      />
    </div>
  )
}

export default App
