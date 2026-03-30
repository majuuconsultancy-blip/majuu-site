export function BrandLogo({ wordmark, logoSrc, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        <img src={logoSrc} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="text-sm font-semibold uppercase tracking-[0.34em] text-white/92">
        {wordmark}
      </span>
    </span>
  )
}

