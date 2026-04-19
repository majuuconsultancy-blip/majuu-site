import { PartnerPublicLayout } from './PartnerPublicLayout'
import { BecomePartnerPage } from './pages/BecomePartnerPage'
import { HelpPage } from './pages/HelpPage'
import { ReferralLookupPage } from './pages/ReferralLookupPage'

export function PartnerPortalApp({ pathname }) {
  if (pathname === '/referrals') {
    return (
      <PartnerPublicLayout
        key={pathname}
        currentPath={pathname}
        title="Referral Lookup"
        subtitle="Check referral count and points by email."
      >
        <ReferralLookupPage />
      </PartnerPublicLayout>
    )
  }

  if (pathname === '/help') {
    return (
      <PartnerPublicLayout
        key={pathname}
        currentPath={pathname}
        title="Help"
        subtitle="Get guidance for partner onboarding and support."
      >
        <HelpPage />
      </PartnerPublicLayout>
    )
  }

  return (
    <PartnerPublicLayout
      key="/become-partner"
      currentPath={'/become-partner'}
      title="Become a Partner"
      subtitle="Complete the step-by-step onboarding profile."
    >
      <BecomePartnerPage />
    </PartnerPublicLayout>
  )
}

