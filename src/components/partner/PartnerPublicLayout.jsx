import { Menu, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Referrals', href: '/referrals' },
  { label: 'Become a Partner', href: '/become-partner' },
  { label: 'Help', href: '/help' },
]

function NavigationLinks({ currentPath, onNavigate }) {
  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const isActive = currentPath === item.href
        return (
          <a
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'bg-emerald-100 text-emerald-900'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

export function PartnerPublicLayout({ currentPath, title, subtitle, children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [menuOpen])

  const pageTitle = useMemo(() => title || 'Partner Portal', [title])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="text-sm font-semibold tracking-[0.14em] text-emerald-800">
            MAJUU
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl gap-4 px-4 py-4">
        <aside
          className={`fixed right-0 top-0 z-[110] h-screen w-[280px] max-w-[86vw] overflow-y-auto border-l border-slate-200 bg-white p-4 shadow-xl transition-transform duration-300 md:static md:block md:h-auto md:w-64 md:translate-x-0 md:rounded-2xl md:border md:shadow-none ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Menu</p>
          </div>
          <NavigationLinks currentPath={currentPath} onNavigate={() => setMenuOpen(false)} />
        </aside>

        {menuOpen && (
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-[100] bg-black/40 md:hidden"
            aria-label="Close menu"
          />
        )}

        <main className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold tracking-[-0.03em]">{pageTitle}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
