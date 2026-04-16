import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { createWaitlistSignup } from '../../lib/supabase/landing'

export function DownloadNoticeModal({ content, open, onClose }) {
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    referredByCode: '',
  })
  const [state, setState] = useState({ type: 'idle', message: '', referralCode: '' })
  const [copyState, setCopyState] = useState('idle')

  const handleClose = useCallback(() => {
    setFormValues({
      name: '',
      email: '',
      phoneNumber: '',
      referredByCode: '',
    })
    setState({ type: 'idle', message: '', referralCode: '' })
    setCopyState('idle')
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
    setState({ type: 'loading', message: '', referralCode: '' })
    setCopyState('idle')

    try {
      const result = await createWaitlistSignup({
        ...formValues,
        source: 'download_notice',
      })
      setFormValues({
        name: '',
        email: '',
        phoneNumber: '',
        referredByCode: '',
      })
      setState({
        type: 'success',
        message: result.alreadyJoined
          ? 'You are already on the launch waitlist.'
          : 'Confirmed. You are now on the MAJUU waitlist.',
        referralCode: result.referralCode || '',
      })
    } catch (error) {
      setState({
        type: 'error',
        message: error.message || 'We could not save your waitlist details right now.',
        referralCode: '',
      })
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormValues((current) => ({
      ...current,
      [name]: value,
    }))
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
            <label htmlFor="download-notice-name" className="sr-only">
              {content.waitlistNamePlaceholder}
            </label>
            <input
              id="download-notice-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formValues.name}
              onChange={handleChange}
              placeholder={content.waitlistNamePlaceholder}
              className="min-h-12 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
            />

            <label htmlFor="download-notice-email" className="sr-only">
              {content.waitlistEmailPlaceholder}
            </label>
            <input
              id="download-notice-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formValues.email}
              onChange={handleChange}
              placeholder={content.waitlistEmailPlaceholder}
              className="min-h-12 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
            />

            <label htmlFor="download-notice-phone" className="sr-only">
              {content.waitlistPhonePlaceholder}
            </label>
            <input
              id="download-notice-phone"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              required
              value={formValues.phoneNumber}
              onChange={handleChange}
              placeholder={content.waitlistPhonePlaceholder}
              className="min-h-12 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
            />

            <label htmlFor="download-notice-referral" className="sr-only">
              {content.waitlistReferralPlaceholder}
            </label>
            <input
              id="download-notice-referral"
              name="referredByCode"
              type="text"
              value={formValues.referredByCode}
              onChange={handleChange}
              placeholder={content.waitlistReferralPlaceholder}
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

          {state.type === 'success' && state.referralCode && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800">
                Your referral code
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="inline-flex min-h-10 flex-1 items-center rounded-xl border border-emerald-300 bg-white px-3 text-sm font-semibold text-emerald-900">
                  {state.referralCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  {copyState === 'copied' ? 'Copied' : 'Copy code'}
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-emerald-900/90">
                Share this code with friends. When they join with it, you get 10 points per signup.
              </p>
              {copyState === 'copied' && (
                <p className="mt-1 text-xs font-medium text-emerald-800">Code copied successfully.</p>
              )}
              {copyState === 'failed' && (
                <p className="mt-1 text-xs font-medium text-rose-700">
                  Copy failed. Please copy the code manually.
                </p>
              )}
            </div>
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
  const handleCopyReferral = async () => {
    if (!state.referralCode || !navigator?.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(state.referralCode)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }
