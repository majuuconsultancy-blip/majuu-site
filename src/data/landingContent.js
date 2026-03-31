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
  stages: ['Work', 'Study', 'Travel'],
  stageSuffix: 'Abroad',
  title: 'Made Accessible',
  subtitle:
    'A safer and smarter way to explore opportunities abroad, all in one place.',
}

export const whatIsMajuuContent = {
  title: 'What is MAJUU?',
  paragraphs: [
    'MAJUU is a platform that helps people explore study, work, and travel abroad opportunities with more clarity, control, and confidence.',
    'Discover countries, compare options, find schools and jobs, move independently, or choose support from a list of verified partners.',
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
      image: '/screenshots/home-screen.png',
      alt: 'MAJUU home screen preview',
    },
    {
      id: 'path-choice',
      label: 'PathChoice',
      title: 'Choose to move independently or get guided support.',
      text: 'Keep your momentum with clear choices and verified help when you need it.',
      image: '/screenshots/path-choice-screen.png',
      alt: 'MAJUU path choice screen preview',
    },
    {
      id: 'discovery',
      label: 'Discover',
      title: 'Compare countries, find schools and jobs, and explore what fits you best.',
      text: 'See the details that matter before you decide where to go next.',
      image: '/screenshots/discovery-screen.png',
      alt: 'MAJUU discovery screen preview',
    },
  ],
}

export const whyMajuuMattersContent = {
  title: 'Why MAJUU Matters',
  intro:
    'Too many people pursuing opportunities abroad are misled, overcharged, or left in the dark.',
  painPoints: [
    'Unverified agencies',
    'Unclear information',
    'Insecure payments',
    'Unreliable communication',
  ],
}

export const solutionContent = {
  title: 'The Better Way Forward',
  text:
    'MAJUU makes the process more transparent, secure, and accessible, whether you choose to move independently or with verified support of your choice. This is because people deserve clarity, guidance, and the right information before making life-changing decisions.',
}

export const howItWorksContent = {
  title: 'How it works',
  steps: [
    {
      title: 'Explore',
      text: 'Discover countries and opportunities that match what you want next.',
    },
    {
      title: 'Choose Help',
      text: 'Go independently for free or choose guided support from verified partners.',
    },
    {
      title: 'Track Progress',
      text: 'Follow your journey, documents, and application progress in one place.',
    },
  ],
}

export const downloadSectionContent = {
  title: 'Start Exploring with MAJUU',
  subtitle:
    'Download the official MAJUU Android app and begin your journey with clarity.',
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
  brand: 'MAJUU Platform',
  copyright: '© 2026 MAJUU Platform. All rights reserved.',
  links: [
    { label: 'Platform', href: '#what-is-majuu' },
    { label: 'Privacy', href: privacyUrl },
    { label: 'Terms', href: termsUrl },
  ],
}
