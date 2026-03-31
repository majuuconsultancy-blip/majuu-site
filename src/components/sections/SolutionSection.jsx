import { TrustIcon } from '../ui/LineIcons'

export function SolutionSection({ content }) {
  const [beforeMajuu, afterMajuu] = content.text.split('MAJUU')

  return (
    <section id="solution" className="px-4 pb-10 pt-1 sm:px-6 sm:pb-12 sm:pt-2">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-emerald-200/90 bg-[linear-gradient(180deg,#f3fcf7,#ebf8f1)] px-5 py-6 shadow-[0_20px_60px_rgba(13,143,97,0.08)] sm:px-7 sm:py-8">
        <div className="flex items-center gap-3">
          <TrustIcon />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            {content.title}
          </p>
        </div>

        <p className="mt-5 max-w-4xl text-balance text-lg leading-8 text-slate-800 sm:text-2xl sm:leading-10">
          {beforeMajuu}
          <span className="font-semibold text-emerald-700">MAJUU</span>
          {afterMajuu}
        </p>
      </div>
    </section>
  )
}
