import { StudyIcon, TravelIcon, WorkIcon } from '../ui/LineIcons'

const iconByStage = {
  Work: WorkIcon,
  Study: StudyIcon,
  Travel: TravelIcon,
}

export function HeroSection({ content }) {
  const [beforeSafer, afterSafer] = content.subtitle.split('safer')

  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-20 sm:px-6 sm:pb-18 sm:pt-24">
      <div className="pointer-events-none absolute inset-x-0 top-[-16%] h-[34rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_54%)]" />
      <div className="pointer-events-none absolute right-[8%] top-[18%] h-24 w-24 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="hero-orbit pointer-events-none" />

      <div className="relative mx-auto flex min-h-[76svh] w-full max-w-6xl items-center justify-center">
        <div className="mx-auto max-w-5xl text-center">
          <div className="grid grid-cols-3 items-end gap-x-2 gap-y-4 sm:gap-x-6">
            {content.stages.map((stage) => {
              const Icon = iconByStage[stage]

              return (
                <div key={stage} className="flex flex-col items-center gap-2 sm:gap-3">
                  {Icon && (
                    <Icon
                      className={
                        stage === 'Study'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : ''
                      }
                    />
                  )}
                  <span
                    className={
                      stage === 'Study'
                        ? 'accent-script text-[clamp(3.4rem,14vw,6.6rem)] font-semibold leading-none text-slate-950'
                        : 'text-[clamp(1.9rem,7.2vw,3.7rem)] font-semibold tracking-[-0.05em] text-slate-700'
                    }
                  >
                    {stage}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 sm:gap-4">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-emerald-500/50 sm:w-16" />
            <span className="accent-script text-[clamp(2.6rem,10.5vw,4.3rem)] font-semibold text-emerald-700">
              {content.stageSuffix}
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-emerald-500/50 sm:w-16" />
          </div>

          <h1 className="mt-5 text-balance text-[clamp(2.45rem,9.2vw,5rem)] font-semibold tracking-[-0.05em] text-slate-950">
            {content.title}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-8 text-slate-700 sm:text-xl sm:leading-[1.75]">
            {beforeSafer}
            <span className="accent-script text-[1.18em] font-semibold text-emerald-700">
              safer
            </span>
            {afterSafer}
          </p>
        </div>
      </div>
    </section>
  )
}
