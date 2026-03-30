export function FooterSection({ content }) {
  return (
    <footer className="border-t border-white/8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 text-center">
        <div>
          <p className="text-sm font-semibold tracking-[0.12em] text-white/92">
            {content.brand}
          </p>
          <p className="mt-3 text-xs text-white/46 sm:text-sm">
            {content.copyright}
          </p>
        </div>

        <nav aria-label="Footer links" className="flex flex-wrap justify-center gap-4 text-sm text-white/66">
          {content.links.map((link) => (
            <a key={link.label} href={link.href} className="transition hover:text-emerald-100">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
