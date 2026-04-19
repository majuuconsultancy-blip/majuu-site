import { contactContent } from '../../../data/landingContent'
import { MailIcon, PhoneIcon, WhatsAppIcon } from '../../ui/LineIcons'

function getActionHref(label) {
  return (contactContent.actions || []).find((action) => action.label === label)?.href || '#'
}

const iconByLabel = {
  WhatsApp: WhatsAppIcon,
  Call: PhoneIcon,
  Email: MailIcon,
}

export function HelpPage() {
  return (
    <section className="space-y-7 text-sm leading-7 text-slate-700">
      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-900">Find Guidance and Support</p>
        <p>Get guidance and support for waitlist, referrals, onboarding, and contact options.</p>
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">Joining Waitlist</p>
        <p>Tap Join Waitlist, enter your details, submit, then receive your referral code.</p>
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">Referrals System</p>
        <p>Each referral is worth 10 points.</p>
        <p>Join the waitlist first, get your referral code, share it, and others can enter it when joining.</p>
      </div>

      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">Partner Onboarding Help</p>
        <p>Fill your organization details, add branches, add services by destination country, then submit.</p>
      </div>

      <div className="space-y-3">
        <p className="text-base font-semibold text-slate-900">Contact Support</p>
        <div className="flex flex-wrap gap-3">
          {(contactContent.actions || []).map((action) => {
            const Icon = iconByLabel[action.label]
            return (
              <a
                key={action.label}
                href={action.href}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-900/8 bg-white px-5 text-sm font-medium text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-emerald-700/16 hover:text-emerald-700"
              >
                {Icon && <Icon className="h-4 w-4" />}
                {action.label}
              </a>
            )
          })}
        </div>
        <p className="text-xs text-slate-500">
          Call: {getActionHref('Call')} | WhatsApp: {contactContent.phoneDisplay || '-'} | Email:{' '}
          {contactContent.email || '-'}
        </p>
      </div>
    </section>
  )
}
