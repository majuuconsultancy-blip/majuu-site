import { BrandLogo } from '../brand/BrandLogo'
import { incrementApkDownloadCount } from '../../lib/supabase/landing'

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

  const waitlistMessage = launchContent?.waitlistPrompt || 'Join waitlist'
  const launchLabel = launchContent?.countdownLabel || 'Launching soon'

  const handleWaitlistClick = () => {
    onDownloadUnavailable?.()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-[rgba(250,249,244,0.68)] shadow-[0_8px_24px_rgba(15,23,42,0.035)] backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-1 sm:px-6 sm:py-1.5">
        <div className="flex items-center justify-between">
          <a href="/" aria-label="MAJUU home">
            <BrandLogo
              wordmark={content.brand}
              logoSrc={content.logoSrc}
              className="origin-left scale-[0.88] sm:scale-[0.92]"
            />
          </a>

          <a
            href={content.downloadsEnabled ? content.downloadUrl : undefined}
            download={content.downloadsEnabled ? content.downloadFileName : undefined}
            target={content.downloadsEnabled ? '_blank' : undefined}
            rel={content.downloadsEnabled ? 'noopener noreferrer' : undefined}
            onClick={handleDownloadClick}
            aria-disabled={!content.downloadsEnabled}
            aria-label="Download the MAJUU Android APK"
            className={`inline-flex min-h-9 items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_10px_20px_rgba(15,23,42,0.07)] transition ${
              content.downloadsEnabled
                ? 'border-emerald-700/12 bg-white text-emerald-700 hover:-translate-y-0.5 hover:border-emerald-700/18 hover:bg-emerald-50'
                : 'border-emerald-700/12 bg-white text-emerald-700 hover:-translate-y-0.5 hover:border-emerald-700/18 hover:bg-emerald-50'
            }`}
          >
            {content.downloadLabel}
          </a>
        </div>

        <div className="mt-1 flex justify-center">
          <div className="header-waitlist-shell w-full max-w-[20rem] rounded-xl border px-3 py-2 sm:px-3.5 sm:py-2.5">
            <p className="header-launching-soon text-center text-[0.9rem] leading-none text-slate-800/90">
              {launchLabel}
            </p>
            <button
              type="button"
              onClick={handleWaitlistClick}
              className="header-waitlist-cta mt-2 inline-flex w-full items-center justify-center rounded-full border px-3 py-1.5 text-center text-[0.74rem] font-semibold uppercase tracking-[0.06em] text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/30 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
            >
              {waitlistMessage}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
