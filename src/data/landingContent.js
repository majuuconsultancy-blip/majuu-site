const contactEmail =
  import.meta.env.VITE_MAJUU_CONTACT_EMAIL?.trim() || 'majuuapp@gmail.com'
const apkDownloadUrl =
  'https://github.com/majuuconsultancy-blip/majuu-app/releases/download/v0.1-BETA/Majuu-App.beta.apk'
const apkDownloadFileName = 'Majuu-App.beta.apk'
const privacyUrl = import.meta.env.VITE_MAJUU_PRIVACY_URL?.trim() || '#'
const termsUrl = import.meta.env.VITE_MAJUU_TERMS_URL?.trim() || '#'
const phoneDisplay = '0799 766 626'
const phoneInternational = '254799766626'

export const siteHeaderContent = {
  brand: 'MAJUU',
  downloadLabel: 'Download APK',
  downloadUrl: apkDownloadUrl,
  downloadFileName: apkDownloadFileName,
  logoSrc: '/logo.png',
}

export const heroContent = {
  stages: ['Study Abroad', 'Work Abroad', 'Travel Abroad'],
  title: 'Made Accessible',
  subtitle: 'A smarter way to explore opportunities abroad — all in one place.',
}

export const whatIsMajuuContent = {
  title: 'What is MAJUU?',
  intro:
    'MAJUU is a platform that helps people explore study, work, and travel opportunities abroad with more clarity, confidence, and control.',
  points: [
    'Discover countries',
    'Compare options',
    'Move independently',
    'Choose verified support',
  ],
}

export const phoneShowcaseContent = {
  // Replace these files in public/screenshots with your real app captures later.
  scenes: [
    {
      id: 'home',
      label: 'Home',
      title: 'Everything you need, in one place.',
      text: 'Stay informed, track progress, and move with clarity.',
      image: '/screenshots/home-screen.png',
      alt: 'MAJUU home screen preview',
    },
    {
      id: 'path-choice',
      label: 'Path Choice',
      title: 'Choose your path forward.',
      text: 'Continue independently or move with guided support when you need it.',
      image: '/screenshots/path-choice-screen.png',
      alt: 'MAJUU path choice screen preview',
    },
    {
      id: 'discovery',
      label: 'Discovery',
      title: 'Find the country that fits you best.',
      text: 'Compare countries and discover options tailored to your goals.',
      image: '/screenshots/discovery-screen.png',
      alt: 'MAJUU discovery screen preview',
    },
  ],
}

export const whyMajuuMattersContent = {
  title: 'Why MAJUU matters',
  intro:
    'For many people, pursuing opportunities abroad still feels confusing, risky, and hard to trust.',
  painPoints: [
    'Unverified agencies',
    'Unclear information',
    'Unsecured payments',
    'Lack of reliable communication',
  ],
  line:
    'People deserve clarity, guidance, and the right information before making life-changing decisions.',
}

export const solutionContent = {
  title: 'How MAJUU helps',
  text:
    'MAJUU makes the process more transparent, secure, and accessible — whether you choose to move independently or with verified support.',
}

export const howItWorksContent = {
  title: 'How it works',
  steps: [
    {
      title: 'Explore',
      text: 'Discover countries and paths that match what you want next.',
    },
    {
      title: 'Compare',
      text: 'Review your options side by side with more context and clarity.',
    },
    {
      title: 'Move Forward',
      text: 'Keep going on your own or choose verified support when you need it.',
    },
  ],
}

export const downloadSectionContent = {
  title: 'Start exploring with MAJUU',
  subtitle:
    'Download the official Android release to begin your journey with clarity.',
  installTitle: 'How to install',
  installSteps: [
    'Download the APK to your Android device.',
    'Open the downloaded file.',
    'If prompted, allow installation from this source.',
    'Install and launch MAJUU.',
  ],
  installNote:
    'Android may show a warning for apps installed outside the Play Store. This is normal for direct APK downloads.',
  buttonLabel: 'Download APK',
  counterLabel: 'early downloads',
  downloadUrl: apkDownloadUrl,
  downloadFileName: apkDownloadFileName,
}

export const communityContent = {
  waitlist: {
    title: 'Get updates from MAJUU',
    text: 'Be the first to hear about new releases, features, and launch updates.',
    placeholder: 'Enter your email',
    button: 'Join waitlist',
  },
  feedback: {
    title: 'Help shape MAJUU',
    text: 'Share feedback, questions, or ideas that could make the platform stronger.',
    fields: {
      name: 'Name (optional)',
      email: 'Email (optional)',
      message: 'Feedback message',
    },
    button: 'Send feedback',
  },
}

export const contactContent = {
  title: 'Need help or want to reach us?',
  text: 'We are here if you have questions, feedback, or need support.',
  phoneDisplay,
  email: contactEmail,
  actions: [
    {
      label: 'WhatsApp',
      href: `https://wa.me/${phoneInternational}`,
    },
    {
      label: 'Call',
      href: `tel:+${phoneInternational}`,
    },
    {
      label: 'Email',
      href: `mailto:${contactEmail}`,
    },
  ],
}

export const footerContent = {
  brand: 'MAJUU Platform',
  copyright: '© 2026 MAJUU Platform. All rights reserved.',
  links: [
    { label: 'Platform', href: '#what-is-majuu' },
    { label: 'Privacy', href: privacyUrl },
    { label: 'Terms', href: termsUrl },
  ],
}
