import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { StudyIcon, TravelIcon, WorkIcon } from '../ui/LineIcons'

const iconByStage = {
  Work: WorkIcon,
  Study: StudyIcon,
  Travel: TravelIcon,
}

const EMPTY_SEARCH_PROMPTS = []
const TYPE_SPEED_MS = 42
const DELETE_SPEED_MS = 22
const HOLD_DELAY_MS = 1600
const NEXT_PROMPT_DELAY_MS = 220

export function HeroSection({ content }) {
  const [beforeVerified, afterVerified] = content.subtitle.split('verified')
  const searchPrompts = content.searchPrompts ?? EMPTY_SEARCH_PROMPTS
  const [promptIndex, setPromptIndex] = useState(0)
  const [animatedPrompt, setAnimatedPrompt] = useState('')
  const [phase, setPhase] = useState(searchPrompts.length > 0 ? 'typing' : 'idle')
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches)
    }

    updatePreference()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updatePreference)

      return () => mediaQuery.removeEventListener('change', updatePreference)
    }

    mediaQuery.addListener(updatePreference)

    return () => mediaQuery.removeListener(updatePreference)
  }, [])

  useEffect(() => {
    if (searchPrompts.length === 0 || prefersReducedMotion) {
      return undefined
    }

    const currentPrompt = searchPrompts[promptIndex]
    let timeoutId = 0

    if (phase === 'typing') {
      if (animatedPrompt.length < currentPrompt.length) {
        timeoutId = window.setTimeout(() => {
          setAnimatedPrompt(currentPrompt.slice(0, animatedPrompt.length + 1))
        }, TYPE_SPEED_MS)
      } else {
        timeoutId = window.setTimeout(() => {
          setPhase('holding')
        }, HOLD_DELAY_MS)
      }
    } else if (phase === 'holding') {
      timeoutId = window.setTimeout(() => {
        setPhase('deleting')
      }, HOLD_DELAY_MS / 2)
    } else if (phase === 'deleting') {
      if (animatedPrompt.length > 0) {
        timeoutId = window.setTimeout(() => {
          setAnimatedPrompt(currentPrompt.slice(0, animatedPrompt.length - 1))
        }, DELETE_SPEED_MS)
      } else {
        timeoutId = window.setTimeout(() => {
          setPromptIndex((currentIndex) => (currentIndex + 1) % searchPrompts.length)
          setPhase('typing')
        }, NEXT_PROMPT_DELAY_MS)
      }
    }

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [animatedPrompt, phase, prefersReducedMotion, promptIndex, searchPrompts])

  const displayedPrompt = prefersReducedMotion ? searchPrompts[0] ?? '' : animatedPrompt

  return (
    <section className="relative overflow-hidden px-4 pb-14 pt-20 sm:px-6 sm:pb-18 sm:pt-24">
      <div className="pointer-events-none absolute inset-x-0 top-[-16%] h-[34rem] bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_54%)]" />
      <div className="pointer-events-none absolute right-[8%] top-[18%] h-24 w-24 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="hero-orbit pointer-events-none" />

      <div className="relative mx-auto flex min-h-[76svh] w-full max-w-6xl items-center justify-center">
        <div className="mx-auto max-w-5xl text-center">
          {searchPrompts.length > 0 && (
            <div className="hero-search-float relative mx-auto mb-9 max-w-xl -translate-y-5 text-left sm:mb-5 sm:-translate-y-7">
              <div className="relative flex min-h-12 items-center rounded-full border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,255,255,0.84))] px-3.5 py-2.5 shadow-[0_24px_68px_rgba(15,23,42,0.12),0_10px_26px_rgba(16,185,129,0.08)] backdrop-blur-xl sm:px-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <Search aria-hidden="true" className="h-3.5 w-3.5" />
                </div>

                <div className="ml-2.5 flex min-w-0 items-center text-[0.92rem] text-slate-500 sm:text-[0.98rem]">
                  <span className="truncate text-slate-600">{displayedPrompt}</span>
                  {!prefersReducedMotion && (
                    <span aria-hidden="true" className="hero-search-caret ml-1 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          )}

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
            {beforeVerified}
            <span className="accent-script text-[1.18em] font-semibold text-emerald-700">
              verified
            </span>
            {afterVerified}
          </p>
        </div>
      </div>
    </section>
  )
}
