import { SectionWrapper } from '../layout/SectionWrapper'

export function StudyAbroadSection({ sectionRef, content }) {
  // placeholder for GSAP suitcase/book entrance animation
  return (
    <SectionWrapper
      sectionRef={sectionRef}
      id="study-abroad"
      title={content.title}
      description={content.text}
      className="min-h-[78svh] pt-28 sm:min-h-[88svh] sm:pt-32"
      headerClassName="flex min-h-[48svh] flex-col justify-center sm:min-h-[54svh]"
      titleClassName="max-w-[12ch] text-5xl leading-none sm:text-7xl"
      descriptionClassName="max-w-sm text-base text-white/74 sm:text-lg"
    >
      <div
        aria-hidden="true"
        data-ornament
        className="mt-14 flex items-center gap-4"
      >
        <div className="h-px flex-1 bg-white/12" />
        <div className="relative h-10 w-10 rounded-full border border-white/12">
          <div className="absolute inset-2 rounded-full border border-white/18" />
        </div>
        <div className="h-px flex-[1.2] bg-white/10" />
      </div>
    </SectionWrapper>
  )
}
