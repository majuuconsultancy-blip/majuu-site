import { SectionWrapper } from '../layout/SectionWrapper'
import {
  InsecurePaymentsIcon,
  RiskIcon,
  UnclearInformationIcon,
  UnreliableCommunicationIcon,
  UnverifiedAgenciesIcon,
} from '../ui/LineIcons'

const iconByPoint = {
  'Unverified agencies': UnverifiedAgenciesIcon,
  'Unclear information': UnclearInformationIcon,
  'Insecure payments': InsecurePaymentsIcon,
  'Unreliable communication': UnreliableCommunicationIcon,
}

export function PainPointsSection({ content }) {
  return (
    <SectionWrapper
      id="why-majuu-matters"
      title={content.title}
      description={content.intro}
      className="pb-6 pt-14 sm:pb-8 sm:pt-16"
      headerClassName="mx-auto max-w-3xl text-center"
      titleClassName="mx-auto text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl"
      descriptionClassName="mx-auto max-w-2xl text-base leading-8 text-slate-700 sm:text-lg sm:leading-[1.75]"
    >
      <div className="mx-auto mt-8 max-w-5xl rounded-[2rem] border border-rose-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,248,248,0.94))] px-5 py-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] sm:px-7 sm:py-7">
        <ul className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
          {content.painPoints.map((point) => {
            const Icon = iconByPoint[point] ?? RiskIcon

            return (
              <li
                key={point}
                className="flex items-center gap-3 rounded-[1.4rem] border border-rose-200/80 bg-white/88 px-4 py-4 text-left"
              >
                <Icon />
                <span className="text-base font-medium leading-7 text-slate-800 sm:text-lg">
                  {point}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </SectionWrapper>
  )
}
