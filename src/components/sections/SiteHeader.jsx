import { incrementApkDownloadCount } from '../../lib/supabase/landing'
import { BrandLogo } from '../brand/BrandLogo'

export function SiteHeader({ content }) {
  const handleDownloadClick = () => {
    void incrementApkDownloadCount().catch(() => {
      // Keep the direct link working even if tracking fails.
    })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[rgba(3,5,5,0.9)]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <BrandLogo wordmark={content.brand} logoSrc={content.logoSrc} />

        <a
          href={content.downloadUrl}
          download={content.downloadFileName}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleDownloadClick}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald-200/18 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-200/30 hover:bg-emerald-300/16"
        >
          {content.downloadLabel}
        </a>
      </div>
    </header>
  )
}
