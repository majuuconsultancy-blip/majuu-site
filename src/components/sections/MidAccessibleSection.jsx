import { SectionWrapper } from '../layout/SectionWrapper'

export function MidAccessibleSection({ sectionRef, content }) {
  // placeholder for GSAP copy reveal
  return (
    <SectionWrapper
      sectionRef={sectionRef}
      id="mid-accessible"
      title={content.title}
      description={content.text}
      className="min-h-[76svh] py-24 sm:min-h-[88svh] sm:py-28"
      titleClassName="max-w-[11ch] text-5xl leading-none sm:text-7xl"
      descriptionClassName="max-w-md text-lg text-white/82 sm:text-2xl sm:leading-relaxed"
    >
      <div aria-hidden="true" data-ornament className="mt-16 h-px w-full max-w-sm bg-white/12" />
      <div aria-hidden="true" data-ornament className="mt-6 h-28 w-28 rounded-full bg-emerald-300/10 blur-3xl" />
      <div className="sr-only">
        {/* placeholder for future GSAP arrival moment */}
      </div>
    </SectionWrapper>
  )
}
