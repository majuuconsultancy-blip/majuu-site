import { SectionWrapper } from '../layout/SectionWrapper'

export function TravelAbroadSection({ sectionRef, content }) {
  // placeholder for GSAP travel icon animation
  return (
    <SectionWrapper
      sectionRef={sectionRef}
      id="travel-abroad"
      title={content.title}
      description={content.text}
      className="min-h-[74svh] sm:min-h-[84svh]"
      titleClassName="max-w-[12ch] text-5xl leading-none sm:text-7xl"
      descriptionClassName="max-w-sm text-base text-white/74 sm:text-lg"
    >
      <div aria-hidden="true" data-ornament className="mt-14 flex gap-4">
        <div className="h-20 w-20 rounded-full bg-emerald-300/8 blur-xl" />
        <div className="mt-8 h-8 w-28 rounded-full border border-white/10" />
      </div>
    </SectionWrapper>
  )
}
