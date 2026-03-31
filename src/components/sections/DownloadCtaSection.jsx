import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getApkDownloadCount,
  incrementApkDownloadCount,
} from '../../lib/supabase/landing'

export function DownloadCtaSection({ content }) {
  const [downloadCount, setDownloadCount] = useState(0)
  const [displayCount, setDisplayCount] = useState(0)
  const displayCountRef = useRef(0)

  useEffect(() => {
    let isMounted = true

    getApkDownloadCount()
      .then((count) => {
        if (isMounted) {
          setDownloadCount(count)
        }
      })
      .catch(() => {
        if (isMounted) {
          setDownloadCount(0)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    displayCountRef.current = displayCount
  }, [displayCount])

  useEffect(() => {
    if (displayCountRef.current === downloadCount) {
      return undefined
    }

    let animationFrame = 0
    const startValue = displayCountRef.current
    const difference = downloadCount - startValue
    const duration = 420
    const startTime = performance.now()

    const animate = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const easedProgress = 1 - (1 - progress) ** 3
      const nextValue = Math.round(startValue + difference * easedProgress)

      displayCountRef.current = nextValue
      setDisplayCount(nextValue)

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate)
      }
    }

    animationFrame = window.requestAnimationFrame(animate)

    return () => window.cancelAnimationFrame(animationFrame)
  }, [downloadCount])

  const counterText = useMemo(() => {
    const formattedCount = new Intl.NumberFormat().format(displayCount)
    return `${formattedCount} ${content.counterLabel}`
  }, [content.counterLabel, displayCount])

  const handleDownloadClick = () => {
    void incrementApkDownloadCount()
      .then((nextCount) => {
        setDownloadCount(nextCount)
      })
      .catch(() => {
        // Keep the direct link working even if tracking fails.
      })
  }

  const [beforeMajuu, afterMajuu] = content.title.split('MAJUU')

  return (
    <section id="start-exploring" className="px-4 py-[4.5rem] sm:px-6 sm:py-20">
      <div className="mx-auto w-full max-w-5xl rounded-[2.25rem] border border-slate-900/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(249,250,247,0.92))] px-5 py-7 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:px-8 sm:py-9">
        <h2 className="mx-auto max-w-[13ch] text-balance text-center text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
          {beforeMajuu}
          <span className="text-emerald-700">MAJUU</span>
          {afterMajuu}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-center text-base leading-8 text-slate-700 sm:text-lg sm:leading-[1.75]">
          {content.subtitle}
        </p>

        <div className="section-divider mt-8" />

        <div className="mt-7 rounded-[1.7rem] border border-slate-900/8 bg-white/80 px-5 py-5 sm:px-6">
          <p className="eyebrow text-xs font-semibold uppercase">{content.installTitle}</p>
          <ol className="mt-4 grid gap-3">
            {content.installSteps.map((step, index) => (
              <li
                key={step}
                className="flex gap-3 text-sm leading-7 text-slate-700 sm:text-base sm:leading-[1.75]"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-700/14 bg-emerald-50 text-xs font-semibold text-emerald-700">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:leading-7">
            {content.installNote}
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <a
            href={content.downloadUrl}
            download={content.downloadFileName}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDownloadClick}
            className="inline-flex min-h-[3.4rem] w-full items-center justify-center rounded-full border border-emerald-700/12 bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-emerald-700/18 hover:bg-emerald-50 sm:w-auto sm:min-w-[16rem]"
          >
            {content.buttonLabel}
          </a>

          <div className="mt-4 inline-flex items-center justify-center rounded-full border border-emerald-700/12 bg-emerald-50/90 px-4 py-2 text-center text-sm text-slate-700 shadow-[0_8px_24px_rgba(13,143,97,0.08)]">
            <span className="font-semibold text-emerald-800">{counterText}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
