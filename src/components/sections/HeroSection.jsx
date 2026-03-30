export function HeroSection({ content }) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-[5.5rem]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_58%)]" />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-5xl text-center">
          <div className="flex flex-col items-center gap-3 text-[clamp(2.9rem,12vw,6.4rem)] font-semibold tracking-[-0.05em] text-white sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-4 sm:leading-none">
            {content.stages.map((stage) => (
              <span key={stage} className="whitespace-nowrap leading-[0.98]">
                {stage}
              </span>
            ))}
          </div>

          <h1 className="mt-3 whitespace-nowrap text-[clamp(2.35rem,9vw,4.5rem)] font-semibold tracking-[-0.03em] text-white">
            {content.title}
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/74 sm:text-xl sm:leading-[1.65]">
            {content.subtitle}
          </p>
        </div>
      </div>
    </section>
  )
}
