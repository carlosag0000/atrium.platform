'use client'

import { type FormEvent, useEffect, useState } from 'react'
import { ids } from '@/lib/analytics'

// Renders a dashboard-built form and posts the answers to /api/forms.php.

export type FieldType = 'text' | 'textarea' | 'email' | 'phone' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'yesno' | 'section'
export type Field = { id: string; type: FieldType; label: string; help?: string; placeholder?: string; required?: boolean; options?: string[]; width?: 'full' | 'half' }
export type PublicFormDef = {
  slug: string
  title: string
  description: string
  fields: Field[]
  open: boolean
  submit_label: string
  success_title: string
  success_message: string
  closed_message: string
}

const input =
  'w-full rounded-xl border bg-white px-4 py-3 text-[1rem] outline-none transition focus:border-[var(--teal-800)] focus:ring-2 focus:ring-[var(--mint-400)]'
const inputStyle = { borderColor: 'rgba(7,47,52,0.18)', color: 'var(--teal-800)' }

export function FormFields({
  fields,
  values,
  onChange,
  invalid,
}: {
  fields: Field[]
  values: Record<string, string | string[]>
  onChange: (id: string, v: string | string[]) => void
  invalid: string[]
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields.map((f) => {
        if (f.type === 'section') {
          return (
            <div key={f.id} className="mt-4 md:col-span-2">
              <h3 className="m-0 text-[1.3rem] font-normal" style={{ color: 'var(--teal-800)' }}>
                {f.label}
              </h3>
              {f.help && (
                <p className="m-0 mt-1 text-[0.95rem]" style={{ color: 'var(--text-muted)' }}>
                  {f.help}
                </p>
              )}
            </div>
          )
        }
        const v = values[f.id] ?? (f.type === 'checkbox' ? [] : '')
        const bad = invalid.includes(f.id)
        const id = `ff-${f.id}`
        const label = (
          <span className="mb-2 block font-semibold text-[0.95rem]" style={{ color: 'var(--teal-800)' }}>
            {f.label}
            {f.required ? <span aria-hidden="true"> *</span> : <span className="font-normal opacity-60"> (optional)</span>}
          </span>
        )
        const help = f.help ? (
          <span className="mb-2 block text-[0.875rem] leading-snug" style={{ color: 'var(--text-muted)' }}>
            {f.help}
          </span>
        ) : null
        const style = { ...inputStyle, borderColor: bad ? '#a3321f' : inputStyle.borderColor }
        const set = (x: string | string[]) => onChange(f.id, x)
        const pills = (opts: string[], multi: boolean) => (
          <div className="flex flex-wrap gap-2" role={multi ? 'group' : 'radiogroup'} aria-label={f.label}>
            {opts.map((o) => {
              const on = multi ? (v as string[]).includes(o) : v === o
              return (
                <button
                  key={o}
                  type="button"
                  role={multi ? 'checkbox' : 'radio'}
                  aria-checked={on}
                  onClick={() => (multi ? set(on ? (v as string[]).filter((x) => x !== o) : [...(v as string[]), o]) : set(on ? '' : o))}
                  className="rounded-full border px-4 py-2 text-[0.95rem] transition"
                  style={{
                    borderColor: on ? 'var(--teal-800)' : bad ? '#a3321f' : 'rgba(7,47,52,0.18)',
                    background: on ? 'var(--teal-800)' : '#fff',
                    color: on ? 'var(--mint-400)' : 'var(--teal-800)',
                  }}
                >
                  {o}
                </button>
              )
            })}
          </div>
        )
        const wrap = (control: React.ReactNode, isGroup = false) =>
          isGroup ? (
            <fieldset key={f.id} className={`m-0 border-0 p-0 ${f.width === 'half' ? '' : 'md:col-span-2'}`}>
              <legend className="p-0">{label}</legend>
              {help}
              {control}
            </fieldset>
          ) : (
            <label key={f.id} htmlFor={id} className={`block ${f.width === 'half' ? '' : 'md:col-span-2'}`}>
              {label}
              {help}
              {control}
            </label>
          )
        switch (f.type) {
          case 'textarea':
            return wrap(<textarea id={id} rows={5} className={input} style={style} placeholder={f.placeholder} value={v as string} onChange={(e) => set(e.target.value)} />)
          case 'select':
            return wrap(
              <select id={id} className={input} style={style} value={v as string} onChange={(e) => set(e.target.value)}>
                <option value="">{f.placeholder || 'Choose one'}</option>
                {(f.options ?? []).map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>,
            )
          case 'radio':
            return wrap(pills(f.options ?? [], false), true)
          case 'checkbox':
            return wrap(pills(f.options ?? [], true), true)
          case 'yesno':
            return wrap(pills(['Yes', 'No'], false), true)
          default: {
            const type = f.type === 'phone' ? 'tel' : f.type === 'text' ? 'text' : f.type
            return wrap(<input id={id} type={type} className={input} style={style} placeholder={f.placeholder} value={v as string} onChange={(e) => set(e.target.value)} />)
          }
        }
      })}
    </div>
  )
}

export default function PublicForm() {
  const [form, setForm] = useState<PublicFormDef | null>(null)
  const [state, setState] = useState<'loading' | 'missing' | 'ready' | 'sending' | 'sent'>('loading')
  const [values, setValues] = useState<Record<string, string | string[]>>({})
  const [invalid, setInvalid] = useState<string[]>([])
  const [error, setError] = useState('')
  const [hp, setHp] = useState('')

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('f') ?? ''
    if (!slug) return setState('missing')
    fetch(`/api/forms.php?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { form: PublicFormDef }) => {
        setForm(d.form)
        document.title = `${d.form.title} — Atrium`
        setState('ready')
      })
      .catch(() => setState('missing'))
  }, [])

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    const missing = form.fields.filter((f) => f.required && f.type !== 'section' && (Array.isArray(values[f.id]) ? !(values[f.id] as string[]).length : !String(values[f.id] ?? '').trim())).map((f) => f.id)
    setInvalid(missing)
    if (missing.length) return setError('Please fill in the required fields.')
    setError('')
    setState('sending')
    const { v, s } = ids()
    const res = await fetch(`/api/forms.php?slug=${encodeURIComponent(form.slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers: values, v, s, website: hp }),
    }).catch(() => null)
    if (res?.ok) {
      setState('sent')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const body = (await res?.json().catch(() => ({}))) as { fields?: string[] } | undefined
    if (body?.fields) setInvalid(body.fields)
    setError(res?.status === 429 ? 'Too many submissions from this connection. Try again later.' : 'Some answers need another look.')
    setState('ready')
  }

  return (
    <div className="min-h-screen px-[var(--gutter)] pt-[7.5rem] pb-24" style={{ background: 'var(--surface-page)' }}>
      <div className="mx-auto max-w-2xl">
        {state === 'loading' && <div className="h-40" />}
        {state === 'missing' && (
          <div className="rounded-3xl bg-white p-8 text-center" style={{ border: '1px solid rgba(7,47,52,0.1)' }}>
            <h1 className="m-0 text-[1.75rem] font-normal" style={{ color: 'var(--teal-800)' }}>
              Form not found
            </h1>
            <p className="m-0 mt-3" style={{ color: 'var(--text-muted)' }}>
              Check the link, or <a href="/contact">contact us</a>.
            </p>
          </div>
        )}
        {form && state !== 'missing' && (
          <>
            <h1 className="m-0 text-[clamp(2.2rem,4vw,3.2rem)] font-normal leading-[1.08]" style={{ color: 'var(--teal-800)' }}>
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-4 mb-0 whitespace-pre-line text-[1.1rem] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {form.description}
              </p>
            )}
            <div className="mt-8">
              {state === 'sent' ? (
                <div className="rounded-3xl p-8 md:p-10" style={{ background: 'var(--teal-800)' }}>
                  <h2 className="type-card-title m-0" style={{ color: 'var(--cloud-300)' }}>
                    {form.success_title}
                  </h2>
                  <p className="mt-3 mb-0 whitespace-pre-line" style={{ color: 'var(--cloud-300)', opacity: 0.85 }}>
                    {form.success_message}
                  </p>
                </div>
              ) : !form.open ? (
                <div className="rounded-3xl bg-white p-8" style={{ border: '1px solid rgba(7,47,52,0.1)', color: 'var(--teal-800)' }}>
                  {form.closed_message}
                </div>
              ) : (
                <form onSubmit={submit} noValidate className="rounded-3xl bg-white p-6 shadow-sm md:p-10" style={{ border: '1px solid rgba(7,47,52,0.1)' }}>
                  <FormFields fields={form.fields} values={values} invalid={invalid} onChange={(id, x) => setValues((p) => ({ ...p, [id]: x }))} />
                  <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                    <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
                  </div>
                  {error && (
                    <p role="alert" className="mt-5 mb-0" style={{ color: '#8a1c12' }}>
                      {error}
                    </p>
                  )}
                  <button type="submit" disabled={state === 'sending'} className="mt-6 rounded-full px-7 py-3 font-semibold disabled:opacity-60" style={{ background: 'var(--teal-800)', color: 'var(--mint-400)' }}>
                    {state === 'sending' ? 'Sending…' : form.submit_label}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
