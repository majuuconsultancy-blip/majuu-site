import { incrementApkDownloadCount } from '../../lib/supabase/landing'
import { BrandLogo } from '../brand/BrandLogo'

export function SiteHeader({ content }) {
  const handleDownloadClick = () => {
    void incrementApkDownloadCount().catch(() => {
      // Keep the direct link working even if tracking fails.
    })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-[rgba(250,249,244,0.68)] shadow-[0_10px_35px_rgba(15,23,42,0.04)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="/" aria-label="MAJUU home">
          <BrandLogo wordmark={content.brand} logoSrc={content.logoSrc} />
        </a>

        <a
          href={content.downloadUrl}
          download={content.downloadFileName}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownloadClick}
          aria-label="Download the MAJUU Android APK"
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald-700/12 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-emerald-700/18 hover:bg-emerald-50"
        >
          {content.downloadLabel}
        </a>
      </div>
    </header>
  )
}
