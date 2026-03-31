import { SectionWrapper } from '../layout/SectionWrapper'
import { MailIcon, PhoneIcon, WhatsAppIcon } from '../ui/LineIcons'

const iconByLabel = {
  WhatsApp: WhatsAppIcon,
  Call: PhoneIcon,
  Email: MailIcon,
}

export function ContactSection({ content }) {
  return (
    <SectionWrapper
      id="contact"
      title={content.title}
      description={content.text}
      className="pt-12 sm:pt-14"
      headerClassName="mx-auto max-w-3xl text-center"
      titleClassName="mx-auto max-w-[14ch] text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl"
      descriptionClassName="mx-auto max-w-xl text-base leading-8 text-slate-700 sm:text-lg sm:leading-[1.75]"
    >
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {content.actions.map((action) => {
          const Icon = iconByLabel[action.label]

          return (
            <a
              key={action.label}
              href={action.href}
              aria-label={
                action.label === 'WhatsApp'
                  ? `Chat with MAJUU on WhatsApp at ${content.phoneDisplay}`
                  : action.label === 'Call'
                    ? `Call MAJUU at ${content.phoneDisplay}`
                    : `Email MAJUU at ${content.email}`
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-900/8 bg-white px-5 text-sm font-medium text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-emerald-700/16 hover:text-emerald-700"
            >
              {Icon && <Icon className="h-4 w-4" />}
              {action.label}
            </a>
          )
        })}
      </div>

      <div className="mt-6 space-y-2 text-center text-sm text-slate-500 sm:text-base">
        <p>{content.phoneDisplay}</p>
        <p>{content.email}</p>
      </div>
    </SectionWrapper>
  )
}
