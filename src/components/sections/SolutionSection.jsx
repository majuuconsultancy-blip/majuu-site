export function SolutionSection({ content }) {
  return (
    <section id="solution" className="px-4 pb-14 pt-4 sm:px-6 sm:pb-16 sm:pt-6">
      <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(10,22,18,0.9),rgba(4,8,7,0.92))] px-5 py-6 shadow-[0_18px_48px_rgba(0,0,0,0.28)] sm:px-7 sm:py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/72">
          {content.title}
        </p>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-emerald-50/92 sm:text-2xl sm:leading-10">
          {content.text}
        </p>
      </div>
    </section>
  )
}
