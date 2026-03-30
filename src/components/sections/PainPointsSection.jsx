import { SectionWrapper } from '../layout/SectionWrapper'

export function PainPointsSection({ content }) {
  return (
    <SectionWrapper
      id="why-majuu-matters"
      title={content.title}
      description={content.intro}
      className="pb-8 pt-12 sm:pb-10 sm:pt-14"
      headerClassName="mx-auto max-w-3xl text-center"
      titleClassName="mx-auto text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl"
      descriptionClassName="mx-auto max-w-2xl text-base leading-8 text-white/72 sm:text-lg sm:leading-[1.7]"
    >
      <div className="mx-auto mt-9 max-w-4xl rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-5 py-6 sm:px-6 sm:py-7">
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-x-7 sm:gap-y-5">
          {content.painPoints.map((point) => (
            <li key={point} className="flex items-start gap-3 text-left text-base leading-8 text-white/86 sm:text-lg sm:leading-[1.7]">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-300/72" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mx-auto mt-9 max-w-3xl text-center text-lg leading-8 text-white/92 sm:text-2xl sm:leading-[1.65]">
        {content.line}
      </p>
    </SectionWrapper>
  )
}
