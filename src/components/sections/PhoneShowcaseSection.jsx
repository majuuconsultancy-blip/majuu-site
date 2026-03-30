import { SectionWrapper } from '../layout/SectionWrapper'

function AndroidPhoneMockup({ image, alt }) {
  return (
    <div className="relative mx-auto w-full max-w-[15.5rem]">
      <div className="absolute right-[-0.18rem] top-[5.1rem] h-16 w-[0.16rem] rounded-full bg-white/14" />
      <div className="absolute right-[-0.18rem] top-[7.9rem] h-10 w-[0.16rem] rounded-full bg-white/18" />
      <div className="absolute left-[-0.18rem] top-[6.7rem] h-12 w-[0.16rem] rounded-full bg-white/10" />

      <div className="rounded-[2.6rem] bg-[linear-gradient(145deg,#1b1f24_0%,#090b0d_58%,#232831_100%)] p-[0.34rem] shadow-[0_24px_60px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
        <div className="rounded-[2.32rem] bg-[linear-gradient(180deg,#0b0d10,#060708)] p-[0.18rem]">
          <div className="relative aspect-[10/21.4] overflow-hidden rounded-[2rem] bg-black">
            <img
              src={image}
              alt={alt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-white/10" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent)]" />
            <div className="absolute left-1/2 top-3.5 h-4 w-4 -translate-x-1/2 rounded-full border border-black/80 bg-[#050607] shadow-[0_0_0_1px_rgba(255,255,255,0.05)]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PhoneShowcaseSection({ content }) {
  return (
    <SectionWrapper
      id="phone-showcase"
      className="pt-8 sm:pt-10"
      containerClassName="max-w-6xl"
    >
      <div className="grid gap-10 md:grid-cols-3 md:gap-6">
        {content.scenes.map((scene) => (
          <article key={scene.id} className="space-y-5">
            <div className="mx-auto max-w-sm text-center md:max-w-none">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/72">
                {scene.label}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {scene.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
                {scene.text}
              </p>
            </div>

            <AndroidPhoneMockup image={scene.image} alt={scene.alt} />
          </article>
        ))}
      </div>
    </SectionWrapper>
  )
}
