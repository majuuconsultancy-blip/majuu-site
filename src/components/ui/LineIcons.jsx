import {
  ArrowRightLeft,
  BadgeAlert,
  CircleX,
  BriefcaseBusiness,
  ChartNoAxesColumn,
  Compass,
  CreditCard,
  FileText,
  GraduationCap,
  HandHelping,
  House,
  Mail,
  MessageSquareText,
  MessageCircleMore,
  Phone,
  PlaneTakeoff,
  Search,
  ShieldCheck,
} from 'lucide-react'

function IconFrame({ children, className = '' }) {
  return (
    <span
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-900/8 bg-white text-slate-700 shadow-[0_12px_32px_rgba(15,23,42,0.08)] ${className}`}
    >
      {children}
    </span>
  )
}

function renderIcon(IconComponent, className = '') {
  return <IconComponent aria-hidden="true" strokeWidth={1.8} className={className} />
}

export function WorkIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(BriefcaseBusiness, 'h-5 w-5')}
    </IconFrame>
  )
}

export function StudyIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(GraduationCap, 'h-5 w-5')}
    </IconFrame>
  )
}

export function TravelIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(PlaneTakeoff, 'h-5 w-5')}
    </IconFrame>
  )
}

export function HomeIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(House, 'h-5 w-5')}
    </IconFrame>
  )
}

export function SupportIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(HandHelping, 'h-5 w-5')}
    </IconFrame>
  )
}

export function DiscoverIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(Compass, 'h-5 w-5')}
    </IconFrame>
  )
}

export function RiskIcon({ className = '' }) {
  return (
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-500 ${className}`}
    >
      {renderIcon(BadgeAlert, 'h-4 w-4')}
    </span>
  )
}

function PainPointIcon({ icon: IconComponent, className = '' }) {
  return (
    <span
      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-[linear-gradient(180deg,#fff6f6,#ffeceb)] text-rose-600 shadow-[0_10px_24px_rgba(225,29,72,0.1)] ${className}`}
    >
      {renderIcon(IconComponent, 'h-5 w-5')}
      <span className="absolute -right-1 -top-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white bg-rose-500 text-white shadow-[0_6px_16px_rgba(225,29,72,0.22)]">
        {renderIcon(CircleX, 'h-3.5 w-3.5')}
      </span>
    </span>
  )
}

export function UnverifiedAgenciesIcon({ className = '' }) {
  return <PainPointIcon icon={BriefcaseBusiness} className={className} />
}

export function UnclearInformationIcon({ className = '' }) {
  return <PainPointIcon icon={FileText} className={className} />
}

export function InsecurePaymentsIcon({ className = '' }) {
  return <PainPointIcon icon={CreditCard} className={className} />
}

export function UnreliableCommunicationIcon({ className = '' }) {
  return <PainPointIcon icon={MessageSquareText} className={className} />
}

export function TrustIcon({ className = '' }) {
  return (
    <span
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 ${className}`}
    >
      {renderIcon(ShieldCheck, 'h-5 w-5')}
    </span>
  )
}

export function ExploreIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(Search, 'h-5 w-5')}
    </IconFrame>
  )
}

export function ChoiceIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(ArrowRightLeft, 'h-5 w-5')}
    </IconFrame>
  )
}

export function ProgressIcon({ className = '' }) {
  return (
    <IconFrame className={className}>
      {renderIcon(ChartNoAxesColumn, 'h-5 w-5')}
    </IconFrame>
  )
}

export function WhatsAppIcon({ className = '' }) {
  return renderIcon(MessageCircleMore, className)
}

export function PhoneIcon({ className = '' }) {
  return renderIcon(Phone, className)
}

export function MailIcon({ className = '' }) {
  return renderIcon(Mail, className)
}
