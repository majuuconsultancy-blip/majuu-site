export function BrandLogo({ wordmark, logoSrc, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1.35rem] border border-slate-900/8 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
        <img src={logoSrc} alt="" className="h-full w-full object-cover" />
      </span>
      <span className="text-sm font-semibold uppercase tracking-[0.34em] text-emerald-700">
        {wordmark}
      </span>
    </span>
  )
}
