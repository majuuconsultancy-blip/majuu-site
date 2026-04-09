import { useEffect, useMemo, useState } from 'react'
import { BrandLogo } from '../brand/BrandLogo'
import { incrementApkDownloadCount } from '../../lib/supabase/landing'

const DAY_IN_SECONDS = 24 * 60 * 60
const HOUR_IN_SECONDS = 60 * 60
const MINUTE_IN_SECONDS = 60

const fallbackCountdown = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isLaunched: false,
}

function getCountdown(targetTimestamp) {
  const differenceMs = targetTimestamp - Date.now()

  if (differenceMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isLaunched: true,
    }
  }

  const remainingSeconds = Math.floor(differenceMs / 1000)
  const days = Math.floor(remainingSeconds / DAY_IN_SECONDS)
  const hours = Math.floor((remainingSeconds % DAY_IN_SECONDS) / HOUR_IN_SECONDS)
  const minutes = Math.floor((remainingSeconds % HOUR_IN_SECONDS) / MINUTE_IN_SECONDS)
  const seconds = remainingSeconds % MINUTE_IN_SECONDS

  return {
    days,
    hours,
    minutes,
    seconds,
    isLaunched: false,
  }
}

export function SiteHeader({ content, launchContent, onDownloadUnavailable }) {
  const handleDownloadClick = (event) => {
    if (!content.downloadsEnabled) {
      event.preventDefault()
      onDownloadUnavailable?.()
      return
    }

    void incrementApkDownloadCount().catch(() => {
      // Keep the direct link working even if tracking fails.
    })
  }

  const targetTimestamp = useMemo(
    () => new Date(launchContent?.launchDateIso ?? '').getTime(),
    [launchContent?.launchDateIso],
  )
  const hasValidLaunchDate = Number.isFinite(targetTimestamp)
  const [countdown, setCountdown] = useState(() =>
    hasValidLaunchDate ? getCountdown(targetTimestamp) : fallbackCountdown,
  )

  useEffect(() => {
    if (!hasValidLaunchDate) {
      return undefined
    }

    const updateCountdown = () => {
      setCountdown(getCountdown(targetTimestamp))
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [hasValidLaunchDate, targetTimestamp])

  const units = useMemo(
    () => [
      {
        label: 'D',
        value: String(countdown.days),
      },
      {
        label: 'H',
        value: String(countdown.hours).padStart(2, '0'),
      },
      {
        label: 'M',
        value: String(countdown.minutes).padStart(2, '0'),
      },
      {
        label: 'S',
        value: String(countdown.seconds).padStart(2, '0'),
      },
    ],
    [countdown.days, countdown.hours, countdown.minutes, countdown.seconds],
  )

  const waitlistMessage =
    launchContent?.waitlistPrompt ||
    'Join the waitlist for a chance to win exclusive launch prizes.'
  const waitlistHref = launchContent?.waitlistHref || '#community'
  const countdownLabel = launchContent?.countdownLabel || 'Launches May 10, 2026'

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-[rgba(250,249,244,0.68)] shadow-[0_10px_35px_rgba(15,23,42,0.04)] backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6 sm:py-2.5">
        <div className="flex items-center justify-between">
          <a href="/" aria-label="MAJUU home">
            <BrandLogo wordmark={content.brand} logoSrc={content.logoSrc} />
          </a>

          <a
            href={content.downloadsEnabled ? content.downloadUrl : undefined}
            download={content.downloadsEnabled ? content.downloadFileName : undefined}
            target={content.downloadsEnabled ? '_blank' : undefined}
            rel={content.downloadsEnabled ? 'noopener noreferrer' : undefined}
            onClick={handleDownloadClick}
            aria-disabled={!content.downloadsEnabled}
            aria-label="Download the MAJUU Android APK"
            className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition ${
              content.downloadsEnabled
                ? 'border-emerald-700/12 bg-white text-emerald-700 hover:-translate-y-0.5 hover:border-emerald-700/18 hover:bg-emerald-50'
                : 'border-emerald-700/12 bg-white text-emerald-700 hover:-translate-y-0.5 hover:border-emerald-700/18 hover:bg-emerald-50'
            }`}
          >
            {content.downloadLabel}
          </a>
        </div>

        {hasValidLaunchDate && !countdown.isLaunched && (
          <div className="mt-1.5 flex justify-center">
            <div className="header-countdown-card w-full max-w-[33rem] rounded-2xl border px-3 py-1.5 sm:px-3.5 sm:py-2">
              <p className="text-center text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/90">
                {countdownLabel}
              </p>

              <div className="mt-1.5 flex items-center justify-center gap-1 sm:gap-1.5">
                {units.map((unit) => (
                  <div
                    key={unit.label}
                    className="header-countdown-unit min-w-[2.75rem] rounded-lg px-1.5 py-0.5 text-center sm:min-w-[3rem] sm:px-2"
                  >
                    <p className="header-countdown-value text-[0.92rem] font-semibold leading-none text-white sm:text-[1rem]">
                      {unit.value}
                    </p>
                    <p className="mt-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.15em] text-white/82">
                      {unit.label}
                    </p>
                  </div>
                ))}
              </div>

              <a
                href={waitlistHref}
                className="header-waitlist-cta mt-1.5 inline-flex w-full items-center justify-center rounded-full border px-3 py-1.5 text-center text-[0.76rem] font-semibold leading-5 text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/85 focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900 sm:text-xs"
              >
                {waitlistMessage}
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
