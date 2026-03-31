import {
  ChoiceIcon,
  ExploreIcon,
  ProgressIcon,
} from '../ui/LineIcons'
import { SectionWrapper } from '../layout/SectionWrapper'

const iconByStep = {
  Explore: ExploreIcon,
  'Choose Help': ChoiceIcon,
  'Track Progress': ProgressIcon,
}

export function HowItWorksSection({ content }) {
  return (
    <SectionWrapper
      id="how-it-works"
      title={content.title}
      className="pt-10 sm:pt-12"
      headerClassName="text-center"
      titleClassName="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl"
    >
      <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
        {content.steps.map((step, index) => {
          const Icon = iconByStep[step.title]

          return (
            <article
              key={step.title}
              className="surface-panel relative rounded-[1.9rem] px-5 py-6 text-left sm:px-6"
            >
              <div className="mb-5 flex items-center justify-between">
                {Icon && <Icon />}
                <span className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
                  {`0${index + 1}`}
                </span>
              </div>

              <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                {step.title}
              </h3>
              <p className="mt-4 max-w-sm text-sm leading-7 text-slate-700 sm:text-base sm:leading-[1.8]">
                {step.text}
              </p>
            </article>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
