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

  return (
    <section id="start-exploring" className="px-4 py-16 sm:px-6 sm:py-[4.5rem]">
      <div className="mx-auto w-full max-w-5xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,13,12,0.96),rgba(4,6,7,0.98))] px-5 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.34)] sm:px-8 sm:py-8">
        <h2 className="mx-auto max-w-[12ch] text-center text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-base leading-8 text-white/72 sm:text-lg sm:leading-[1.7]">
          {content.subtitle}
        </p>

        <div className="mt-9 border-t border-white/10 pt-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/72">
            {content.installTitle}
          </p>
          <ol className="mt-4 grid gap-3">
            {content.installSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-7 text-white/76 sm:text-base sm:leading-[1.7]">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-200/18 text-xs text-emerald-100/82">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/56 sm:leading-7">
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
            className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-full border border-emerald-200/16 bg-[linear-gradient(180deg,#36c88f,#14905f)] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105 sm:w-auto sm:min-w-[15rem]"
          >
            {content.buttonLabel}
          </a>

          <div className="mt-4 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-center text-sm text-white/70 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
            <span className="font-semibold text-emerald-100/88">{counterText}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
