import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { copyTextToClipboard } from '../../lib/clipboard'
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

      setState({
        type: 'success',
        message: result.alreadyJoined
          ? 'You are already on the MAJUU waitlist.'
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

  const handleCopyReferral = async () => {
    const didCopy = await copyTextToClipboard(state.referralCode)
    setCopyState(didCopy ? 'copied' : 'failed')
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
        className="relative w-full max-w-md rounded-[1.8rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.985),rgba(248,250,246,0.97))] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.14)] sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close waitlist modal"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/8 bg-white text-slate-500 transition hover:text-slate-800"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>

        {state.type === 'success' ? (
          <div className="waitlist-success-reveal py-4 text-center">
            <p className="eyebrow text-xs font-semibold uppercase">Waitlist confirmed</p>
            <h2
              id="download-notice-title"
              className="mt-3 text-[2.2rem] font-semibold tracking-[-0.06em] text-slate-950 sm:text-[2.45rem]"
            >
              You are in.
            </h2>
            <p className="mt-3 text-base font-medium text-emerald-700">{state.message}</p>

            {state.referralCode && (
              <>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Your referral code
                </p>
                <p className="waitlist-success-code mt-2 text-[2.1rem] font-semibold tracking-[0.22em] text-emerald-700 sm:text-[2.3rem]">
                  {state.referralCode}
                </p>
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-700 px-6 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  {copyState === 'copied' ? 'Code copied' : 'Copy referral code'}
                </button>
                <p className="mt-3 text-xs leading-5 text-slate-600">
                  Share this code. Each person who joins with it gives you 10 points.
                </p>
                {copyState === 'failed' && (
                  <p className="mt-2 text-xs font-medium text-rose-700">
                    Copy failed here. Please select and copy the code manually.
                  </p>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-slate-900/10 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="pr-10">
              <p className="eyebrow text-xs font-semibold uppercase">Join waitlist</p>
              <h2
                id="download-notice-title"
                className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2rem]"
              >
                {content.waitlistTitle}
              </h2>
              <p className="mt-2 text-sm text-slate-600">Quick form. Takes less than 10 seconds.</p>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
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
                className="min-h-11 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
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
                className="min-h-11 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
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
                className="min-h-11 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
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
                className="min-h-11 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
              />

              <button
                type="submit"
                disabled={state.type === 'loading'}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-80"
              >
                {state.type === 'loading' ? 'Joining...' : content.waitlistButton}
              </button>
            </form>

            {state.message && state.type === 'error' && (
              <p className="mt-3 text-sm text-rose-600">{state.message}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
