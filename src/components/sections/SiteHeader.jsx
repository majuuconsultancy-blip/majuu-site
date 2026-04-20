import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BrandLogo } from '../brand/BrandLogo'
import { incrementApkDownloadCount } from '../../lib/supabase/landing'

export function SiteHeader({ content, launchContent, onDownloadUnavailable }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

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

          <div className="flex items-center gap-2">
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

            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-1.5 flex flex-col items-center gap-2 pb-1">
          <p className="header-launching-soon text-center text-[0.9rem] leading-none text-slate-800/90">
            {launchLabel}
          </p>
          <div className="flex w-full max-w-[13.75rem] items-center gap-1.5">
            <button
              type="button"
              onClick={handleWaitlistClick}
              className="header-pill-cta inline-flex h-7 w-1/2 items-center justify-center overflow-hidden rounded-full border px-1 text-center font-semibold text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
            >
              <span
                className="inline-block whitespace-nowrap"
                style={{
                  fontSize: '7px',
                  lineHeight: 1,
                  letterSpacing: '0.01em',
                  transform: 'scale(0.82)',
                  transformOrigin: 'center',
                }}
              >
                {waitlistMessage}
              </span>
            </button>
            <a
              href="/become-partner"
              onClick={() => setIsMenuOpen(false)}
              className="header-pill-cta inline-flex h-7 w-1/2 items-center justify-center rounded-full border px-2 text-center text-[0.58rem] font-semibold leading-none tracking-[0.01em] text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/40 focus-visible:ring-offset-1 focus-visible:ring-offset-white"
            >
              Become a Partner
            </a>
          </div>
        </div>
      </div>

      <aside
        className={`fixed right-0 top-0 z-[110] h-screen w-[280px] max-w-[86vw] overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-xl transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="space-y-2">
          <a
            href="/"
            className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </a>
          <a
            href="/referrals"
            className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            onClick={() => setIsMenuOpen(false)}
          >
            Referrals
          </a>
          <a
            href="/become-partner"
            className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            onClick={() => setIsMenuOpen(false)}
          >
            Become a Partner
          </a>
          <a
            href="/help"
            className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            onClick={() => setIsMenuOpen(false)}
          >
            Help
          </a>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          type="button"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 z-[100] bg-black/40"
          aria-label="Close menu overlay"
        />
      )}
    </header>
  )
}
