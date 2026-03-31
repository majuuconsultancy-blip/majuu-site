import { useState } from 'react'
import {
  createFeedbackSubmission,
  createWaitlistSignup,
} from '../../lib/supabase/landing'
import { SectionWrapper } from '../layout/SectionWrapper'

const defaultFeedbackState = {
  name: '',
  email: '',
  message: '',
}

export function EmailCaptureSection({ content }) {
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [waitlistState, setWaitlistState] = useState({ type: 'idle', message: '' })
  const [feedbackValues, setFeedbackValues] = useState(defaultFeedbackState)
  const [feedbackState, setFeedbackState] = useState({ type: 'idle', message: '' })

  const handleWaitlistSubmit = async (event) => {
    event.preventDefault()
    setWaitlistState({ type: 'loading', message: '' })

    try {
      const result = await createWaitlistSignup(waitlistEmail)
      setWaitlistEmail('')
      setWaitlistState({
        type: 'success',
        message: result.alreadyJoined
          ? 'You are already set to receive updates.'
          : 'You will now receive MAJUU updates.',
      })
    } catch (error) {
      setWaitlistState({
        type: 'error',
        message: error.message || 'We could not save your email right now.',
      })
    }
  }

  const handleFeedbackChange = (event) => {
    const { name, value } = event.target
    setFeedbackValues((current) => ({
      ...current,
      [name]: value,
    }))
  }

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault()
    setFeedbackState({ type: 'loading', message: '' })

    try {
      await createFeedbackSubmission(feedbackValues)
      setFeedbackValues(defaultFeedbackState)
      setFeedbackState({
        type: 'success',
        message: 'Thanks for sharing feedback with us.',
      })
    } catch (error) {
      setFeedbackState({
        type: 'error',
        message: error.message || 'We could not save your feedback right now.',
      })
    }
  }

  return (
    <SectionWrapper
      id="community"
      className="pt-12 sm:pt-14"
      containerClassName="max-w-6xl"
    >
      <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
          <h2 className="text-balance text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            {content.waitlist.title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-700 sm:text-base sm:leading-[1.75]">
            {content.waitlist.text}
          </p>

          <form className="mt-6 space-y-3" onSubmit={handleWaitlistSubmit}>
            <label htmlFor="waitlist-email" className="sr-only">
              {content.waitlist.placeholder}
            </label>
            <input
              id="waitlist-email"
              name="waitlist-email"
              type="email"
              autoComplete="email"
              required
              value={waitlistEmail}
              onChange={(event) => setWaitlistEmail(event.target.value)}
              placeholder={content.waitlist.placeholder}
              className="min-h-12 w-full rounded-full border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
            />
            <button
              type="submit"
              disabled={waitlistState.type === 'loading'}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-80"
            >
              {waitlistState.type === 'loading' ? 'Saving...' : content.waitlist.button}
            </button>
          </form>

          {waitlistState.message && (
            <p
              className={`mt-3 text-sm ${
                waitlistState.type === 'error' ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {waitlistState.message}
            </p>
          )}
        </section>

        <section className="surface-panel rounded-[2rem] p-5 sm:p-6">
          <h2 className="text-balance text-center text-2xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
            {content.feedback.title}
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-balance text-center text-sm leading-7 text-slate-700 sm:text-base sm:leading-[1.75]">
            {content.feedback.text}
          </p>

          <form className="mt-6 space-y-3" onSubmit={handleFeedbackSubmit}>
            <label className="block">
              <span className="sr-only">{content.feedback.fields.name}</span>
              <input
                type="text"
                name="name"
                required
                value={feedbackValues.name}
                onChange={handleFeedbackChange}
                placeholder={content.feedback.fields.name}
                className="min-h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
              />
            </label>

            <label className="block">
              <span className="sr-only">{content.feedback.fields.email}</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                value={feedbackValues.email}
                onChange={handleFeedbackChange}
                placeholder={content.feedback.fields.email}
                className="min-h-12 w-full rounded-2xl border border-slate-900/10 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
              />
            </label>

            <label className="block">
              <span className="sr-only">{content.feedback.fields.message}</span>
              <textarea
                name="message"
                rows="5"
                required
                value={feedbackValues.message}
                onChange={handleFeedbackChange}
                placeholder={content.feedback.fields.message}
                className="w-full rounded-[1.4rem] border border-slate-900/10 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-700/28 focus:ring-2 focus:ring-emerald-700/10"
              />
            </label>

            <button
              type="submit"
              disabled={feedbackState.type === 'loading'}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-900/10 bg-white px-5 text-sm font-semibold text-slate-950 transition hover:border-emerald-700/18 hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-80"
            >
              {feedbackState.type === 'loading' ? 'Sending...' : content.feedback.button}
            </button>
          </form>

          {feedbackState.message && (
            <p
              className={`mt-3 text-sm ${
                feedbackState.type === 'error' ? 'text-rose-600' : 'text-emerald-700'
              }`}
            >
              {feedbackState.message}
            </p>
          )}
        </section>
      </div>
    </SectionWrapper>
  )
}
