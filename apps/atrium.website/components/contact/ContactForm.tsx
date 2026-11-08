'use client'

import { type FormEvent, type ReactNode, useState } from 'react'
import { ids } from '@/lib/analytics'

// Contact form on /contact. Posts JSON to /api/contact.php; messages land in the dashboard inbox (/admin#inbox).

const LOCATIONS = ['1', '2–5', '6–15', '16+']
const BUDGETS = ['Under $2k', '$2k–5k', '$5k–10k', '$10k+', 'Not sure yet']

const inputClass =
  'w-full rounded-xl border bg-white px-4 py-3 text-[1rem] outline-none transition focus:border-[var(--teal-800)] focus:ring-2 focus:ring-[var(--mint-400)]'
const inputStyle = { borderColor: 'rgba(7,47,52,0.18)', color: 'var(--teal-800)' }

function Field({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-semibold text-[0.95rem]" style={{ color: 'var(--teal-800)' }}>
        {label}
        {optional && <span className="font-normal opacity-60"> (optional)</span>}
      </span>
      {children}
    </label>
  )
}

function Pills({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="mb-2 block p-0 font-semibold text-[0.95rem]" style={{ color: 'var(--teal-800)' }}>
        {label} <span className="font-normal opacity-60">(optional)</span>
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const on = value === opt
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on ? '' : opt)}
              className="rounded-full border px-4 py-2 text-[0.95rem] transition"
              style={{
                borderColor: on ? 'var(--teal-800)' : 'rgba(7,47,52,0.18)',
                background: on ? 'var(--teal-800)' : '#fff',
                color: on ? 'var(--mint-400)' : 'var(--teal-800)',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function ContactForm({ interests }: { interests: string[] }) {
  const [v, setV] = useState({ name: '', email: '', phone: '', business: '', interest: '', locations: '', budget: '', message: '', website: '' })
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (v.name.trim().length < 2) return setError('Please add your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) return setError('Please add a valid email so we can reply.')
    if (v.message.trim().length < 5) return setError('Tell us a little about what you need.')
    setState('sending')
    try {
      const { v: visitor, s } = ids()
      const res = await fetch('/api/contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...v, page: window.location.pathname, v: visitor, s }),
      })
      if (res.status === 429) throw new Error('Too many messages from this connection. Please email us instead.')
      if (!res.ok) throw new Error('Something went wrong. Please try again, or email hello@atriumad.com.')
      setState('sent')
    } catch (err) {
      setState('idle')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (state === 'sent') {
    return (
      <div className="rounded-3xl p-8 md:p-10" style={{ background: 'var(--teal-800)' }}>
        <p className="type-eyebrow m-0 mb-3" style={{ color: 'var(--mint-400)' }}>
          Message received
        </p>
        <h3 className="type-card-title m-0" style={{ color: 'var(--cloud-300)' }}>
          Thanks, {v.name.split(' ')[0]}. We&apos;ll reply within one business day.
        </h3>
        <p className="type-body mt-4 mb-0" style={{ color: 'var(--cloud-300)', opacity: 0.8 }}>
          If it&apos;s urgent, email hello@atriumad.com.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-6 shadow-sm md:p-10" style={{ border: '1px solid rgba(7,47,52,0.1)' }}>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Your name">
          <input className={inputClass} style={inputStyle} value={v.name} onChange={set('name')} autoComplete="name" required />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} style={inputStyle} value={v.email} onChange={set('email')} autoComplete="email" required />
        </Field>
        <Field label="Restaurant, hotel or brand" optional>
          <input className={inputClass} style={inputStyle} value={v.business} onChange={set('business')} autoComplete="organization" />
        </Field>
        <Field label="Phone" optional>
          <input type="tel" className={inputClass} style={inputStyle} value={v.phone} onChange={set('phone')} autoComplete="tel" />
        </Field>
        <div className="md:col-span-2">
          <Field label="What do you need help with?" optional>
            <select className={inputClass} style={inputStyle} value={v.interest} onChange={set('interest')}>
              <option value="">Choose one</option>
              {interests.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
              <option value="Not sure yet">Not sure yet</option>
            </select>
          </Field>
        </div>
        <div className="md:col-span-2">
          <Pills label="Locations" options={LOCATIONS} value={v.locations} onChange={(x) => setV((p) => ({ ...p, locations: x }))} />
        </div>
        <div className="md:col-span-2">
          <Pills label="Monthly marketing budget" options={BUDGETS} value={v.budget} onChange={(x) => setV((p) => ({ ...p, budget: x }))} />
        </div>
        <div className="md:col-span-2">
          <Field label="What's going on?">
            <textarea
              rows={5}
              className={inputClass}
              style={inputStyle}
              value={v.message}
              onChange={set('message')}
              placeholder="Where the brand is now, what's working, and what you want to change in the next 90 days."
              required
            />
          </Field>
        </div>
        {/* Honeypot: hidden from people, filled by bots. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} />
          </label>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-5 mb-0 text-[0.95rem]" style={{ color: '#8a1c12' }}>
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={state === 'sending'}
        className="mt-6 rounded-full px-7 py-3 font-semibold transition disabled:opacity-60"
        style={{ background: 'var(--teal-800)', color: 'var(--mint-400)' }}
      >
        {state === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
