import { SectionWrapper } from '../layout/SectionWrapper'

export function ContactSection({ content }) {
  return (
    <SectionWrapper
      id="contact"
      title={content.title}
      description={content.text}
      className="pt-10 sm:pt-12"
      headerClassName="mx-auto max-w-3xl text-center"
      titleClassName="mx-auto max-w-[14ch] text-3xl font-semibold tracking-tight text-white sm:text-5xl"
      descriptionClassName="mx-auto max-w-xl text-base leading-7 text-white/72 sm:text-lg"
    >
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {content.actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-5 text-sm text-white/88 transition hover:border-emerald-200/24 hover:text-emerald-100"
          >
            {action.label}
          </a>
        ))}
      </div>

      <div className="mt-5 space-y-2 text-center text-sm text-white/64 sm:text-base">
        <p>{content.phoneDisplay}</p>
        <p>{content.email}</p>
      </div>
    </SectionWrapper>
  )
}
