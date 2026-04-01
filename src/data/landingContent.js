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
  downloadsEnabled: false,
  downloadUrl: apkDownloadUrl,
  downloadFileName: apkDownloadFileName,
  logoSrc: '/logo.png',
}

export const heroContent = {
  stages: ['Work', 'Study', 'Travel'],
  stageSuffix: 'Abroad',
  searchPrompts: [
    'Explore study abroad opportunities',
    'Find work abroad programs',
    'Download the MAJUU APK',
    'Discover schools and jobs ',
    'Compare countries side by side',
    'Apply independently or with support',
    'Track your application progress',
    'Find scholarships',
    'Verified Agents',
    'Your journey, Your way',
  ],
  title: 'From Kenya',
  subtitle:
    'Explore scholarships, schools, jobs etc., and get verified support to help you move abroad from Kenya with more clarity and expert guidance.',
}

export const whatIsMajuuContent = {
  title: 'What is MAJUU?',
  paragraphs: [
    'MAJUU is a platform that helps people in Kenya explore study, work, and travel abroad opportunities with more clarity, control, and confidence.',
    'Discover countries, compare options, find scholarships, schools, and jobs, move independently, or choose support from a list of verified partners.',
  ],
}

export const phoneShowcaseContent = {
  // Replace these files in public/screenshots with your real app captures later.
  scenes: [
    {
      id: 'home',
      label: 'Home',
      title: 'Everything you need in one place.',
      text: 'Stay informed, track progress, and move with clarity.',
      image: '/screenshots/home-screen.webp',
      alt: 'MAJUU home screen showing study, work, and travel abroad options',
    },
    {
      id: 'path-choice',
      label: 'PathChoice',
      title: 'Choose to move independently or get guided support.',
      text: 'Keep your momentum with clear choices and verified help when you need it.',
      image: '/screenshots/path-choice-screen.webp',
      alt: 'MAJUU support choice screen for independent travel planning or verified support',
    },
    {
      id: 'discovery',
      label: 'Discover',
      title: 'Compare countries, schools, scholarships, and jobs abroad.',
      text: 'See the details that matter before you decide where to go next.',
      image: '/screenshots/discovery-screen.webp',
      alt: 'MAJUU discovery screen comparing countries, schools, scholarships, and jobs abroad',
    },
  ],
}

export const whyMajuuMattersContent = {
  title: 'Why MAJUU Matters',
  intro:
    ' Alot of people pursuing study/work abroad opportunities are misleed by unverified agents, unclear information, and unreliable support. This can lead to wasted time, money, and missed opportunities.',
  painPoints: [
    'Unverified agencies',
    'Unclear information',
    'Insecure payments',
    'Unreliable communication',
  ],
}

export const solutionContent = {
  title: 'The Answer',
  text:
    'MAJUU makes the process more transparent, secure, and accessible, whether you choose to move independently or with verified agency support of your choice. This is because people deserve clarity, guidance, and the right information before making life-changing decisions.',
}

export const howItWorksContent = {
  title: 'How it works',
  steps: [
    {
      title: 'Explore',
      text: 'Discover countries and opportunities that match your interests.',
    },
    {
      title: 'Choose Help',
      text: 'Go independently for free or choose guided support from verified partners.',
    },
    {
      title: 'Track Progress',
      text: 'Follow your journey and live application progress in one place.',
    },
  ],
}

export const downloadSectionContent = {
  title: 'Start Exploring with MAJUU',
  subtitle:
    'Download the official MAJUU Android app and explore study, work, and travel abroad options from Kenya with more clarity.',
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
  downloadsEnabled: false,
  counterLabel: 'early downloads',
  downloadUrl: apkDownloadUrl,
  downloadFileName: apkDownloadFileName,
}

export const downloadNoticeContent = {
  title: 'Early Tester Access',
  body:
    'APK downloads are currently limited to our first testers while we complete the final rollout.',
  note: 'MAJUU will be launching officially very soon.',
  waitlistTitle: 'Join the waitlist for launch updates',
  waitlistPlaceholder: 'Enter your email',
  waitlistButton: 'Join waitlist',
  buttonLabel: 'Got it',
}

export const communityContent = {
  waitlist: {
    title: 'Get updates from MAJUU',
    text: 'Be the first to hear about new releases, features, and launch updates.',
    placeholder: 'Enter your email',
    button: 'Get Updates',
  },
  feedback: {
    title: 'Help Shape MAJUU',
    text: 'Share feedback, questions, or ideas that could make the platform stronger.',
    fields: {
      name: 'Your name',
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
  brand: 'Majuu Platform\u2122',
  copyright: '© 2026 Majuu Platform\u2122. All rights reserved.',
  links: [
    { label: 'Platform', href: '#what-is-majuu' },
    { label: 'Privacy', href: privacyUrl },
    { label: 'Terms', href: termsUrl },
  ],
}
