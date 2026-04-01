import {
  DiscoverIcon,
  HomeIcon,
  SupportIcon,
} from '../ui/LineIcons'
import { SectionWrapper } from '../layout/SectionWrapper'

const iconByScene = {
  home: HomeIcon,
  'path-choice': SupportIcon,
  discovery: DiscoverIcon,
}

function AndroidPhoneMockup({ image, alt }) {
  return (
    <div className="relative mx-auto w-full max-w-[14.75rem]">
      <div className="absolute right-[-0.16rem] top-[4.9rem] h-16 w-[0.14rem] rounded-full bg-slate-700/18" />
      <div className="absolute right-[-0.16rem] top-[7.8rem] h-10 w-[0.14rem] rounded-full bg-slate-700/18" />
      <div className="absolute left-[-0.16rem] top-[6.4rem] h-12 w-[0.14rem] rounded-full bg-slate-700/14" />

      <div className="rounded-[2.7rem] bg-[linear-gradient(180deg,#3b424a_0%,#1b2027_38%,#0f1419_100%)] p-[0.34rem] shadow-[0_28px_56px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/8">
        <div className="rounded-[2.35rem] bg-[linear-gradient(180deg,#101419,#050607)] p-[0.18rem]">
          <div className="relative aspect-[10/21.6] overflow-hidden rounded-[2.04rem] bg-black">
            <img
              src={image}
              alt={alt}
              loading="lazy"
              decoding="async"
              width="800"
              height="1689"
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
      className="pt-6 sm:pt-8"
      containerClassName="max-w-6xl"
    >
      <div className="grid gap-6 md:grid-cols-3 md:gap-5">
        {content.scenes.map((scene) => {
          const Icon = iconByScene[scene.id]
          const isPathChoice = scene.id === 'path-choice'

          return (
            <article
              key={scene.id}
              className="surface-panel rounded-[2rem] px-5 py-6 sm:px-6"
            >
              <div className="space-y-4 text-center">
                {Icon && <Icon className={isPathChoice ? 'text-emerald-700' : ''} />}
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
                    {scene.label}
                  </p>
                  <h3 className="text-balance text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]">
                    {scene.title}
                  </h3>
                  <p className="text-balance text-sm leading-7 text-slate-700 sm:text-base sm:leading-[1.75]">
                    {isPathChoice ? (
                      <>
                        Choose to move independently or get{' '}
                        <span className="accent-script text-[1.05em] font-semibold text-emerald-700">
                          guided support
                        </span>
                        .
                      </>
                    ) : (
                      scene.text
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <AndroidPhoneMockup image={scene.image} alt={scene.alt} />
              </div>
            </article>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
