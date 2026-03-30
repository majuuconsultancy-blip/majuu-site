import { SectionWrapper } from '../layout/SectionWrapper'

export function WorkAbroadSection({ sectionRef, content }) {
  // placeholder for GSAP suitcase animation
  return (
    <SectionWrapper
      sectionRef={sectionRef}
      id="work-abroad"
      title={content.title}
      description={content.text}
      className="min-h-[74svh] sm:min-h-[84svh]"
      titleClassName="max-w-[12ch] text-5xl leading-none sm:text-7xl"
      descriptionClassName="max-w-sm text-base text-white/74 sm:text-lg"
    >
      <div aria-hidden="true" data-ornament className="mt-14 max-w-xs">
        <div className="h-16 rounded-full border border-emerald-200/14 bg-emerald-300/5 blur-[1px]" />
      </div>
    </SectionWrapper>
  )
}
