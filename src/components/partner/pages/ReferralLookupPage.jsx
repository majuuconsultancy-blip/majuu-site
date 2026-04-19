import { useState } from 'react'
import { lookupReferralsByEmail } from '../../../lib/supabase/partners'

export function ReferralLookupPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [result, setResult] = useState(null)

  const handleLookup = async (event) => {
    event.preventDefault()
    setStatus({ type: 'loading', message: 'Checking referrals...' })
    setResult(null)

    try {
      const data = await lookupReferralsByEmail(email)
      setResult(data)
      setStatus({ type: 'success', message: '' })
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Could not load referrals for this email.',
      })
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleLookup} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
            placeholder="name@example.com"
          />
        </label>
        <button
          type="submit"
          className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Lookup
        </button>
      </form>

      {status.message && (
        <p className={`text-sm ${status.type === 'error' ? 'text-rose-700' : 'text-slate-600'}`}>
          {status.message}
        </p>
      )}

      {result && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-700">Referrals: {result.totalReferrals}</p>
          <p className="mt-1 text-sm text-slate-700">Points: {result.points}</p>

          {result.referredUsers.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                Referred Users
              </p>
              <ul className="mt-2 space-y-2">
                {result.referredUsers.map((user, index) => (
                  <li
                    key={`${user.referred_email}-${index}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
                  >
                    {user.referred_email} ({user.points} pts)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

