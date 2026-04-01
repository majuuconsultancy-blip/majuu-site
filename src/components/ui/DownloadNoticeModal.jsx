import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createWaitlistSignup } from '../../lib/supabase/landing'

export function DownloadNoticeModal({ content, open, onClose }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState({ type: 'idle', message: '' })

  const handleClose = useCallback(() => {
    setEmail('')
    setState({ type: 'idle', message: '' })
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose, open])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setState({ type: 'loading', message: '' })

    try {
      const result = await createWaitlistSignup(email, 'download_notice')
      setEmail('')
      setState({
        type: 'success',
        message: result.alreadyJoined
          ? 'You are already on the launch waitlist.'
          : 'You are on the waitlist. We will email you as soon as launch access opens.',
      })
    } catch (error) {
      setState({
        type: 'error',
        message: error.message || 'We could not save your email right now.',
      })
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-notice-title"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-slate-950/28 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-md rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,245,0.96))] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.14)] sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close download notice"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/8 bg-white text-slate-500 transition hover:text-slate-800"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        <div className="pr-10">
          <p className="eyebrow text-xs font-semibold uppercase">Download Notice</p>
          <h2
            id="download-notice-title"
            className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-3xl"
          >
            {content.title}
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-700">{content.body}</p>
          <p className="mt-3 text-base leading-8 text-emerald-700">{content.note}</p>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-slate-900/8 bg-white/80 p-4">
          <p className="text-sm font-medium text-slate-900">{content.waitlistTitle}</p>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <label htmlFor="download-notice-email" className="sr-only">
              {content.waitlistPlaceholder}
            </label>
            <input
              id="download-notice-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={content.waitlistPlaceholder}
              className="min-h-12 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
            />
            <button
              type="submit"
              disabled={state.type === 'loading'}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-emerald-700/12 bg-white px-5 py-2 text-sm font-semibold text-emerald-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-80"
            >
              {state.type === 'loading' ? 'Joining...' : content.waitlistButton}
            </button>
          </form>

          {state.message && (
            <p
              className={`mt-3 text-sm ${
                state.type === 'error' ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {state.message}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {content.buttonLabel}
        </button>
      </div>
    </div>
  )
}
