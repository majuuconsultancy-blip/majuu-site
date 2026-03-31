import {
  communityContent,
  contactContent,
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

function App() {
  return (
    <div className="min-h-screen bg-transparent text-slate-950">
      <SiteHeader content={siteHeaderContent} />

      <main>
        <HeroSection content={heroContent} />
        <WhatIsMajuuSection content={whatIsMajuuContent} />
        <PhoneShowcaseSection content={phoneShowcaseContent} />
        <PainPointsSection content={whyMajuuMattersContent} />
        <SolutionSection content={solutionContent} />
        <HowItWorksSection content={howItWorksContent} />
        <DownloadCtaSection content={downloadSectionContent} />
        <EmailCaptureSection content={communityContent} />
        <ContactSection content={contactContent} />
      </main>

      <FooterSection content={footerContent} />
    </div>
  )
}

export default App
