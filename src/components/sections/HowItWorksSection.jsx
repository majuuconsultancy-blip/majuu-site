import { SectionWrapper } from '../layout/SectionWrapper'

export function HowItWorksSection({ content }) {
  return (
    <SectionWrapper
      id="how-it-works"
      title={content.title}
      className="pt-12 sm:pt-14"
      headerClassName="text-center"
      titleClassName="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl"
    >
      <div className="mt-10 flex flex-col gap-5 md:flex-row md:items-stretch md:gap-6">
        {content.steps.map((step, index) => (
          <div key={step.title} className="flex items-start gap-4 md:flex-1 md:items-center">
            <article className="flex-1 border-l border-emerald-300/24 pl-5 md:border-l-0 md:border-t md:pl-0 md:pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-200/68">
                {`0${index + 1}`}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-white">{step.title}</h3>
              <p className="mt-4 max-w-sm text-sm leading-7 text-white/70 sm:text-base sm:leading-[1.75]">
                {step.text}
              </p>
            </article>

            {index < content.steps.length - 1 && (
              <span className="mt-7 hidden text-xl text-emerald-200/55 md:inline-block">
                →
              </span>
            )}
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
