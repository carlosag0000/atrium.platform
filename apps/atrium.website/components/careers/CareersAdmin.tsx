'use client'

import { type FormEvent, useCallback, useEffect, useState } from 'react'

// Password-protected view of the applications. Talks to /careers-api/admin.php, which keeps a
// session cookie after login; nothing sensitive is stored in the browser.

const API = '/careers-api/admin.php'
export const LISTING_PATH = '/careers/account-manager-95fc33'

type Row = { id: number; created_at: string; job: string; name: string; email: string; phone: string; status: string; has_cv: number | string }
type Section = { title: string; items: { label: string; value: string }[] }
type Detail = Row & { data: { sections: Section[] }; notes: string | null }

const STATUS_COLORS: Record<string, string> = {
  nuevo: '#B5F2DB',
  revisar: '#F6E3A1',
  entrevista: '#BFD7FF',
  finalista: '#D9C7FF',
  descartado: '#E6E1D4',
  contratado: '#8fe6c2',
}

async function call(action: string, init?: RequestInit & { id?: number }) {
  const q = new URLSearchParams({ action })
  if (init?.id) q.set('id', String(init.id))
  return fetch(`${API}?${q}`, { credentials: 'same-origin', ...init })
}

function when(s: string) {
  const d = new Date(`${s.replace(' ', 'T')}Z`)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}

function isLink(v: string) {
  return /^https?:\/\//i.test(v)
}

export default function CareersAdmin() {
  const [state, setState] = useState<'checking' | 'login' | 'in'>('checking')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [statuses, setStatuses] = useState<string[]>([])
  const [filter, setFilter] = useState('todas')
  const [open, setOpen] = useState<Detail | null>(null)
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState('')

  const load = useCallback(async () => {
    const res = await call('list')
    if (res.status === 401) {
      setState('login')
      return
    }
    const json = await res.json()
    setRows(json.applications ?? [])
    setStatuses(json.statuses ?? [])
    setState('in')
  }, [])

  useEffect(() => {
    load().catch(() => setState('login'))
  }, [load])

  async function login(e: FormEvent) {
    e.preventDefault()
    setError('')
    const res = await call('login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    if (res.status === 429) return setError('Demasiados intentos. Espera 15 minutos.')
    if (!res.ok) return setError('Contraseña incorrecta.')
    setPassword('')
    await load()
  }

  async function logout() {
    await call('logout', { method: 'POST' })
    setOpen(null)
    setState('login')
  }

  async function show(id: number) {
    const res = await call('get', { id })
    if (res.status === 401) return setState('login')
    const json = await res.json()
    setOpen(json.application)
    setNotes(json.application?.notes ?? '')
    setSaved('')
  }

  async function update(id: number, patch: { status?: string; notes?: string }) {
    const res = await call('update', { id, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    if (res.status === 401) return setState('login')
    if (patch.status) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: patch.status as string } : r)))
      setOpen((prev) => (prev && prev.id === id ? { ...prev, status: patch.status as string } : prev))
    }
    if (patch.notes !== undefined) setSaved('Notas guardadas')
  }

  async function remove(id: number, name: string) {
    if (!window.confirm(`¿Eliminar la aplicación de ${name}? Se borra para siempre, con su CV.`)) return
    const res = await call('delete', { id, method: 'POST' })
    if (res.status === 401) return setState('login')
    setRows((prev) => prev.filter((r) => r.id !== id))
    setOpen(null)
  }

  const shell = 'min-h-screen px-[var(--gutter)] pt-[7.5rem] pb-20 max-sm:pt-[6rem]'

  if (state === 'checking') return <div className={shell} style={{ background: 'var(--surface-page)' }} />

  if (state === 'login') {
    return (
      <div className={shell} style={{ background: 'var(--surface-page)' }}>
        <form onSubmit={login} className="mx-auto max-w-sm rounded-3xl bg-white p-8 shadow-sm" style={{ border: '1px solid rgba(7,47,52,0.1)' }}>
          <p className="type-eyebrow m-0 mb-3" style={{ color: 'var(--text-muted)' }}>
            Atrium · Empleo
          </p>
          <h1 className="m-0 mb-6 text-[1.75rem] font-normal" style={{ color: 'var(--teal-800)' }}>
            Aplicaciones
          </h1>
          <label className="block">
            <span className="mb-2 block font-semibold text-[0.95rem]" style={{ color: 'var(--teal-800)' }}>
              Contraseña
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--mint-400)]"
              style={{ borderColor: 'rgba(7,47,52,0.18)' }}
            />
          </label>
          {error && (
            <p role="alert" className="mt-4 mb-0 text-[0.95rem]" style={{ color: '#8a1c12' }}>
              {error}
            </p>
          )}
          <button type="submit" className="mt-6 w-full rounded-full px-6 py-3 font-semibold" style={{ background: 'var(--teal-800)', color: 'var(--mint-400)' }}>
            Entrar
          </button>
        </form>
      </div>
    )
  }

  const shown = filter === 'todas' ? rows : rows.filter((r) => r.status === filter)

  return (
    <div className={shell} style={{ background: 'var(--surface-page)' }}>
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="type-eyebrow m-0 mb-2" style={{ color: 'var(--text-muted)' }}>
              Atrium · Empleo
            </p>
            <h1 className="m-0 text-[clamp(2rem,3vw,2.75rem)] font-normal" style={{ color: 'var(--teal-800)' }}>
              Aplicaciones <span className="opacity-50">({rows.length})</span>
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={LISTING_PATH}
              target="_blank"
              rel="noopener"
              className="rounded-full px-5 py-3 font-semibold no-underline"
              style={{ background: 'var(--teal-800)', color: 'var(--mint-400)' }}
            >
              Ver anuncio: Account Manager ↗
            </a>
            <button type="button" onClick={logout} className="rounded-full border px-5 py-3 font-semibold" style={{ borderColor: 'var(--teal-800)', color: 'var(--teal-800)' }}>
              Salir
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {['todas', ...statuses].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className="rounded-full px-4 py-2 text-[0.9rem] capitalize"
              style={{ background: filter === s ? 'var(--teal-800)' : 'rgba(7,47,52,0.06)', color: filter === s ? 'var(--mint-400)' : 'var(--teal-800)' }}
            >
              {s} {s === 'todas' ? '' : `(${rows.filter((r) => r.status === s).length})`}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="overflow-hidden rounded-3xl bg-white" style={{ border: '1px solid rgba(7,47,52,0.1)' }}>
            {shown.length === 0 && (
              <p className="m-0 p-8" style={{ color: 'var(--text-muted)' }}>
                Todavía no hay aplicaciones{filter === 'todas' ? '' : ' con este estado'}.
              </p>
            )}
            {shown.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => show(r.id)}
                className="grid w-full grid-cols-[1fr_auto] gap-1 border-b px-6 py-4 text-left transition hover:bg-[rgba(7,47,52,0.03)]"
                style={{ borderColor: 'rgba(7,47,52,0.08)', background: open?.id === r.id ? 'rgba(181,242,219,0.25)' : undefined }}
              >
                <span className="font-semibold" style={{ color: 'var(--teal-800)' }}>
                  {r.name}
                </span>
                <span className="rounded-full px-3 py-1 text-[0.8rem] capitalize" style={{ background: STATUS_COLORS[r.status] ?? '#eee', color: 'var(--teal-800)' }}>
                  {r.status}
                </span>
                <span className="text-[0.875rem]" style={{ color: 'var(--text-muted)' }}>
                  {r.email} · {when(r.created_at)}
                  {Number(r.has_cv) ? ' · CV' : ''}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-3xl bg-white p-6 md:p-8" style={{ border: '1px solid rgba(7,47,52,0.1)' }}>
            {!open && <p className="m-0" style={{ color: 'var(--text-muted)' }}>Elige una aplicación para verla completa.</p>}
            {open && (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="m-0 text-[1.75rem] font-normal" style={{ color: 'var(--teal-800)' }}>
                      {open.name}
                    </h2>
                    <p className="m-0 mt-1 text-[0.9rem]" style={{ color: 'var(--text-muted)' }}>
                      {when(open.created_at)}
                    </p>
                  </div>
                  <select
                    value={open.status}
                    onChange={(e) => update(open.id, { status: e.target.value })}
                    className="rounded-full border px-4 py-2 capitalize"
                    style={{ borderColor: 'var(--teal-800)', color: 'var(--teal-800)', background: STATUS_COLORS[open.status] }}
                    aria-label="Estado"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={`mailto:${open.email}`} className="rounded-full border px-4 py-2 text-[0.9rem] no-underline" style={{ borderColor: 'rgba(7,47,52,0.2)', color: 'var(--teal-800)' }}>
                    Email
                  </a>
                  {open.phone && (
                    <a
                      href={`https://wa.me/${open.phone.replace(/[^\d]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border px-4 py-2 text-[0.9rem] no-underline"
                      style={{ borderColor: 'rgba(7,47,52,0.2)', color: 'var(--teal-800)' }}
                    >
                      WhatsApp
                    </a>
                  )}
                  {Number(open.has_cv) ? (
                    <a
                      href={`${API}?action=cv&id=${open.id}`}
                      target="_blank"
                      rel="noopener"
                      className="rounded-full px-4 py-2 text-[0.9rem] no-underline"
                      style={{ background: 'var(--teal-800)', color: 'var(--mint-400)' }}
                    >
                      Ver CV (PDF)
                    </a>
                  ) : null}
                </div>

                {open.data?.sections?.map((sec) => (
                  <section key={sec.title} className="mt-8 border-t pt-6" style={{ borderColor: 'rgba(7,47,52,0.1)' }}>
                    <h3 className="type-eyebrow m-0 mb-4" style={{ color: 'var(--text-muted)' }}>
                      {sec.title}
                    </h3>
                    <dl className="m-0 grid gap-4">
                      {sec.items
                        .filter((it) => it.value)
                        .map((it) => (
                          <div key={it.label}>
                            <dt className="text-[0.85rem] font-semibold" style={{ color: 'var(--text-muted)' }}>
                              {it.label}
                            </dt>
                            <dd className="m-0 mt-1 whitespace-pre-wrap break-words" style={{ color: 'var(--teal-800)' }}>
                              {isLink(it.value) ? (
                                <a href={it.value} target="_blank" rel="noopener noreferrer nofollow">
                                  {it.value}
                                </a>
                              ) : (
                                it.value
                              )}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  </section>
                ))}

                <section className="mt-8 border-t pt-6" style={{ borderColor: 'rgba(7,47,52,0.1)' }}>
                  <h3 className="type-eyebrow m-0 mb-3" style={{ color: 'var(--text-muted)' }}>
                    Notas internas
                  </h3>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value)
                      setSaved('')
                    }}
                    className="w-full rounded-xl border px-4 py-3"
                    style={{ borderColor: 'rgba(7,47,52,0.18)' }}
                  />
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => update(open.id, { notes })}
                      className="rounded-full px-5 py-2 font-semibold"
                      style={{ background: 'var(--teal-800)', color: 'var(--mint-400)' }}
                    >
                      Guardar notas
                    </button>
                    <span className="text-[0.9rem]" style={{ color: 'var(--text-muted)' }}>
                      {saved}
                    </span>
                  </div>
                </section>

                <div className="mt-10 border-t pt-6" style={{ borderColor: 'rgba(7,47,52,0.1)' }}>
                  <button type="button" onClick={() => remove(open.id, open.name)} className="text-[0.9rem] underline" style={{ color: '#8a1c12' }}>
                    Eliminar aplicación
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
