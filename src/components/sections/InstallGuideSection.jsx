import { SectionWrapper } from '../layout/SectionWrapper'

export function InstallGuideSection({ content }) {
  return (
    <SectionWrapper
      id="install-guide"
      title={content.title}
      className="pt-2 sm:pt-4"
      titleClassName="text-3xl leading-tight sm:text-5xl"
    >
      <div
        data-soft-reveal
        className="rounded-[1.75rem] border border-white/10 bg-black/34 p-5 shadow-[0_18px_48px_rgba(0,0,0,0.35)] sm:p-6"
      >
        <ol className="space-y-4">
          {content.steps.map((step) => (
            <li key={step} className="border-l border-white/14 pl-4 text-sm leading-6 text-white/78 sm:text-base">
              {step}
            </li>
          ))}
        </ol>

        <p className="mt-6 text-sm leading-6 text-white/62">{content.note}</p>

        <button
          type="button"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-white/16 bg-white/[0.04] px-5 text-sm text-white/88 transition hover:border-emerald-200/30 hover:bg-white/[0.06]"
        >
          {content.button}
        </button>
      </div>
    </SectionWrapper>
  )
}
