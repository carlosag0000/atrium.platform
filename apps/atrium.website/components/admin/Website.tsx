'use client'

import { type FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { API, fmtAgo, fmtWhen, get, post, type User } from './api'
import { type Announcement, BarView, DEFAULT_BAR } from '@/components/cms/CmsRuntime'
import { Button, C, Card, Empty, Pill, Spinner, field, fieldStyle } from './ui'

// Website → Announcement, Redirects & broken links, Media library.

// ── Announcement ─────────────────────────────────────────────────────────────

const TONES = { dark: '#042f34', mint: '#b8e89a', amber: '#ffc933' } as const

export function AnnouncementView({ user }: { user: User }) {
  const [a, setA] = useState<Announcement | null>(null)
  const [saved, setSaved] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    get<{ announcement: Announcement }>('cms_globals').then((d) => {
      const has = d.announcement && Object.keys(d.announcement).length > 0
      setSaved(has)
      setA(has ? { style: 'banner', tone: 'dark', ...d.announcement } : DEFAULT_BAR)
    })
  }, [])
  if (!a) return <Spinner />
  const canEdit = user.role !== 'viewer'
  const toLocal = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await post('cms_globals_save', { announcement: a })
      setSaved(true)
      setMsg(a?.on ? 'Saved. The bar is live on every page.' : 'Saved. The bar is hidden.')
    } catch (err) {
      const code = (err as { code?: string }).code
      setMsg(code === 'link' ? 'The link must start with /, https://, mailto: or tel:' : code === 'ends' ? 'Check the countdown date.' : 'Could not save.')
    }
  }

  return (
    <div className="grid gap-4">
      <Card title="Preview">
        <div className="rounded-xl px-3 py-6" style={{ background: '#f3efe4', opacity: a.on ? 1 : 0.5 }}>
          {a.text ? <BarView bar={a} preview onClose={() => {}} /> : <Empty>Write a message to see it here.</Empty>}
        </div>
        {!saved && (
          <p className="m-0 mt-2 text-[0.8rem]" style={{ color: C.muted }}>
            This is the default bar, promoting the Marketing Grader. It shows on the site until you save your own.
          </p>
        )}
      </Card>
      <Card title="Bottom bar">
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-[0.9rem] font-semibold md:col-span-2" style={{ color: C.ink }}>
            <input type="checkbox" checked={!!a.on} onChange={(e) => setA({ ...a, on: e.target.checked })} disabled={!canEdit} /> Show the bar on every page
          </label>
          <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            Style
            <select value={a.style ?? 'banner'} onChange={(e) => setA({ ...a, style: e.target.value as 'banner' | 'pill' })} className={field} style={fieldStyle} disabled={!canEdit}>
              <option value="banner">Wide banner (big title, message, button)</option>
              <option value="pill">Small pill (one line)</option>
            </select>
          </label>
          <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            Big title {a.style === 'pill' && <span className="font-normal opacity-60">(banner only)</span>}
            <input value={a.title ?? ''} maxLength={60} onChange={(e) => setA({ ...a, title: e.target.value })} placeholder="Marketing Grader" className={field} style={fieldStyle} disabled={!canEdit} />
          </label>
          <label className="grid gap-1 text-[0.85rem] font-medium md:col-span-2" style={{ color: C.ink }}>
            Message
            <input value={a.text ?? ''} maxLength={200} onChange={(e) => setA({ ...a, text: e.target.value })} className={field} style={fieldStyle} disabled={!canEdit} />
          </label>
          <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            Button link
            <input value={a.link ?? ''} onChange={(e) => setA({ ...a, link: e.target.value })} placeholder="https://grader.atriumad.com" className={field} style={fieldStyle} disabled={!canEdit} />
          </label>
          <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            Button text
            <input value={a.label ?? ''} maxLength={40} onChange={(e) => setA({ ...a, label: e.target.value })} placeholder="Get my free score" className={field} style={fieldStyle} disabled={!canEdit} />
          </label>
          <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            Countdown to <span className="font-normal opacity-60">(optional — the bar hides itself when it ends)</span>
            <input type="datetime-local" value={toLocal(a.ends)} onChange={(e) => setA({ ...a, ends: e.target.value ? new Date(e.target.value).toISOString() : '' })} className={field} style={fieldStyle} disabled={!canEdit} />
          </label>
          <div className="grid content-start gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            Color
            <div className="flex items-center gap-2">
              {(Object.keys(TONES) as (keyof typeof TONES)[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setA({ ...a, tone: t })}
                  className="h-8 w-8 rounded-full"
                  aria-label={t}
                  aria-pressed={a.tone === t}
                  style={{ background: TONES[t], border: a.tone === t ? '3px solid #1e8c7c' : `1px solid ${C.line}` }}
                  disabled={!canEdit}
                />
              ))}
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-3 md:col-span-2">
              <Button type="submit">Save</Button>
              <span className="text-[0.85rem]" style={{ color: msg.startsWith('Saved') ? C.up : C.down }}>
                {msg}
              </span>
            </div>
          )}
        </form>
      </Card>
    </div>
  )
}

// ── Redirects & broken links ─────────────────────────────────────────────────

type Redirect = { id: number; from_path: string; to_url: string; code: number; hits: number; last_hit: string; created_at: string }
type NotFound = { path: string; hits: number; first_seen: string; last_seen: string; referrer: string }

export function RedirectsView({ user, tz }: { user: User; tz?: string | undefined }) {
  const [data, setData] = useState<{ redirects: Redirect[]; not_found: NotFound[] } | null>(null)
  const [form, setForm] = useState({ id: 0, from: '', to: '', code: 301 })
  const [msg, setMsg] = useState('')
  const canEdit = user.role !== 'viewer'
  const fromRef = useRef<HTMLInputElement>(null)
  const load = useCallback(() => get<{ redirects: Redirect[]; not_found: NotFound[] }>('redirects').then(setData), [])
  useEffect(() => {
    load()
  }, [load])
  if (!data) return <Spinner />

  async function save(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    try {
      await post('redirect_save', { from: form.from, to: form.to, code: form.code }, { id: form.id || undefined })
      setForm({ id: 0, from: '', to: '', code: 301 })
      setMsg('Saved. It works right away.')
      load()
    } catch {
      setMsg('Check both addresses: "from" starts with /, "to" with / or https://')
    }
  }

  return (
    <div className="grid gap-4">
      <Card title={form.id ? 'Edit redirect' : 'Add a redirect'}>
        <form onSubmit={save} className="grid gap-3 md:grid-cols-[1fr_1.4fr_auto_auto] md:items-end">
          <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            From (old address)
            <input ref={fromRef} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} placeholder="/old-page" className={field} style={fieldStyle} required disabled={!canEdit} />
          </label>
          <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            To
            <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} placeholder="/services or https://…" className={field} style={fieldStyle} required disabled={!canEdit} />
          </label>
          <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
            Type
            <select value={form.code} onChange={(e) => setForm({ ...form, code: Number(e.target.value) })} className={field} style={fieldStyle} disabled={!canEdit}>
              <option value={301}>Permanent (301)</option>
              <option value={302}>Temporary (302)</option>
            </select>
          </label>
          {canEdit && <Button type="submit">{form.id ? 'Save' : 'Add'}</Button>}
        </form>
        <p className="m-0 mt-2 text-[0.8rem]" style={{ color: msg.startsWith('Check') ? C.down : C.up }}>
          {msg || <span style={{ color: C.muted }}>Use redirects when a page moves or a printed link (menu, flyer, QR code) needs to point somewhere new.</span>}
        </p>
      </Card>

      <Card title={`Redirects (${data.redirects.length})`} pad={false}>
        {data.redirects.length === 0 ? (
          <div className="px-5 pb-5">
            <Empty>No redirects yet.</Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[0.85rem]">
              <thead>
                <tr className="text-left" style={{ color: C.muted }}>
                  <th className="px-5 py-2 font-medium">From</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 text-right font-medium">Used</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.redirects.map((r) => (
                  <tr key={r.id} className="border-t" style={{ borderColor: C.line, color: C.ink }}>
                    <td className="px-5 py-2.5 font-medium">{r.from_path}</td>
                    <td className="max-w-[320px] truncate px-3 py-2.5">{r.to_url}</td>
                    <td className="px-3 py-2.5">{r.code}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums" title={r.last_hit ? `Last used ${fmtWhen(r.last_hit, tz)}` : 'Never used yet'}>
                      {r.hits}
                    </td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {canEdit && (
                        <>
                          <button type="button" className="mr-3 text-[0.8rem] underline" style={{ color: C.series }} onClick={() => setForm({ id: r.id, from: r.from_path, to: r.to_url, code: r.code })}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-[0.8rem] underline"
                            style={{ color: C.down }}
                            onClick={async () => {
                              if (!window.confirm(`Remove the redirect from ${r.from_path}?`)) return
                              await post('redirect_delete', {}, { id: r.id })
                              load()
                            }}
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card
        title={`Broken links (${data.not_found.length})`}
        pad={false}
        action={
          canEdit && data.not_found.length > 0 ? (
            <button
              type="button"
              className="text-[0.8rem] underline"
              style={{ color: C.muted }}
              onClick={async () => {
                if (!window.confirm('Clear the whole broken-links list?')) return
                await post('notfound_dismiss', { all: true })
                load()
              }}
            >
              Clear list
            </button>
          ) : null
        }
      >
        <p className="m-0 px-5 pb-3 text-[0.8rem]" style={{ color: C.muted }}>
          Addresses people tried to open that don&apos;t exist. Fix the ones with the most visits by redirecting them to the right page.
        </p>
        {data.not_found.length === 0 ? (
          <div className="px-5 pb-5">
            <Empty>No broken links recorded. 🎉</Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[0.85rem]">
              <tbody>
                {data.not_found.map((n) => (
                  <tr key={n.path} className="border-t" style={{ borderColor: C.line, color: C.ink }}>
                    <td className="max-w-[300px] truncate px-5 py-2.5 font-medium">{n.path}</td>
                    <td className="px-3 py-2.5 tabular-nums">
                      <Pill>{n.hits}×</Pill>
                    </td>
                    <td className="max-w-[260px] truncate px-3 py-2.5 text-[0.8rem]" style={{ color: C.muted }} title={n.referrer}>
                      {n.referrer ? `from ${n.referrer.replace(/^https?:\/\//, '')}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-[0.8rem]" style={{ color: C.muted }}>
                      {fmtAgo(n.last_seen)}
                    </td>
                    <td className="px-5 py-2.5 text-right whitespace-nowrap">
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="mr-3 text-[0.8rem] font-semibold underline"
                            style={{ color: C.series }}
                            onClick={() => {
                              setForm({ id: 0, from: n.path, to: '', code: 301 })
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }}
                          >
                            Redirect…
                          </button>
                          <button
                            type="button"
                            className="text-[0.8rem] underline"
                            style={{ color: C.muted }}
                            onClick={async () => {
                              await post('notfound_dismiss', { path: n.path })
                              load()
                            }}
                          >
                            Ignore
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Media library ────────────────────────────────────────────────────────────

type Media = { id: number; url: string; original: string; mime: string; size: number; width: number; height: number; alt: string; created_at: string; uploaded_by: string }

function useMedia() {
  const [items, setItems] = useState<Media[] | null>(null)
  const load = useCallback(() => get<{ items: Media[] }>('media').then((d) => setItems(d.items)), [])
  useEffect(() => {
    load()
  }, [load])
  return [items, load] as const
}

async function upload(files: FileList | File[]): Promise<string[]> {
  const errors: string[] = []
  for (const f of Array.from(files)) {
    const body = new FormData()
    body.set('file', f)
    const res = await fetch(`${API}?action=media_upload`, { method: 'POST', body, credentials: 'same-origin' })
    if (!res.ok) {
      const code = ((await res.json().catch(() => ({}))) as { error?: string }).error
      errors.push(`${f.name}: ${code === 'too_big' ? 'over 8 MB' : code === 'type' ? 'use JPG, PNG, WebP, GIF or AVIF' : 'upload failed'}`)
    }
  }
  return errors
}

function Uploader({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string[]>([])
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  async function go(files: FileList | File[]) {
    setBusy(true)
    setErr(await upload(files))
    setBusy(false)
    onDone()
  }
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        if (e.dataTransfer.files.length) go(e.dataTransfer.files)
      }}
      className="grid place-items-center rounded-2xl border-2 border-dashed px-4 py-8 text-center"
      style={{ borderColor: over ? C.series : 'rgba(4,47,52,0.18)', background: over ? 'rgba(184,232,154,0.25)' : '#fff' }}
    >
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" multiple className="sr-only" onChange={(e) => e.target.files && go(e.target.files)} />
      <p className="m-0 text-[0.9rem]" style={{ color: C.ink }}>
        {busy ? 'Uploading…' : 'Drop images here, or'}{' '}
        {!busy && (
          <button type="button" className="font-semibold underline" style={{ color: C.series }} onClick={() => input.current?.click()}>
            choose files
          </button>
        )}
      </p>
      <p className="m-0 mt-1 text-[0.75rem]" style={{ color: C.muted }}>
        JPG, PNG, WebP, GIF or AVIF · up to 8 MB each
      </p>
      {err.map((e) => (
        <p key={e} className="m-0 mt-1 text-[0.8rem]" style={{ color: C.down }}>
          {e}
        </p>
      ))}
    </div>
  )
}

export function MediaView({ user }: { user: User }) {
  const [items, load] = useMedia()
  const [copied, setCopied] = useState(0)
  const canEdit = user.role !== 'viewer'
  if (!items) return <Spinner />
  return (
    <div className="grid gap-4">
      {canEdit && <Uploader onDone={load} />}
      {items.length === 0 ? (
        <Empty>No images yet. Upload share images, announcement graphics or anything you want to link to.</Empty>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {items.map((m) => (
            <figure key={m.id} className="m-0 overflow-hidden rounded-2xl bg-white" style={{ border: `1px solid ${C.line}` }}>
              <a href={m.url} target="_blank" rel="noopener" className="block aspect-[4/3] overflow-hidden" style={{ background: '#eee9dc' }}>
                <img src={m.url} alt={m.alt} loading="lazy" className="h-full w-full object-cover" />
              </a>
              <figcaption className="grid gap-1 p-3 text-[0.75rem]" style={{ color: C.muted }}>
                <span className="truncate font-medium" style={{ color: C.ink }} title={m.original}>
                  {m.original}
                </span>
                <span>
                  {m.width}×{m.height} · {(m.size / 1024).toFixed(0)} KB
                </span>
                {canEdit && (
                  <input
                    defaultValue={m.alt}
                    placeholder="Describe the image (alt text)"
                    onBlur={(e) => e.target.value !== m.alt && post('media_update', { alt: e.target.value }, { id: m.id })}
                    className="rounded-md border px-2 py-1 text-[0.75rem]"
                    style={fieldStyle}
                  />
                )}
                <span className="flex gap-3">
                  <button
                    type="button"
                    className="font-semibold underline"
                    style={{ color: C.series }}
                    onClick={() => {
                      navigator.clipboard?.writeText(`https://www.atriumad.com${m.url}`)
                      setCopied(m.id)
                    }}
                  >
                    {copied === m.id ? 'Copied ✓' : 'Copy link'}
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="underline"
                      style={{ color: C.down }}
                      onClick={async () => {
                        if (!window.confirm('Delete this image? Anything that uses its link will show a broken image.')) return
                        await post('media_delete', {}, { id: m.id })
                        load()
                      }}
                    >
                      Delete
                    </button>
                  )}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  )
}

/** Modal to choose (or upload) an image; returns its URL. */
export function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const [items, load] = useMedia()
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Choose an image">
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" style={{ background: 'rgba(4,47,52,0.4)' }} onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-[1.2rem] font-semibold" style={{ color: C.ink }}>
            Choose an image
          </h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-[0.85rem]" style={{ background: 'rgba(4,47,52,0.06)', color: C.ink }}>
            Close ✕
          </button>
        </div>
        <Uploader onDone={load} />
        {!items ? (
          <Spinner />
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {items.map((m) => (
              <button key={m.id} type="button" onClick={() => onPick(m.url)} className="overflow-hidden rounded-xl" style={{ border: `1px solid ${C.line}` }} title={m.original}>
                <img src={m.url} alt={m.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Activity log ─────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  'content.publish': 'Published page edits',
  'announcement.on': 'Turned the announcement on',
  'announcement.off': 'Turned the announcement off',
  'redirect.save': 'Saved a redirect',
  'redirect.delete': 'Removed a redirect',
  'media.upload': 'Uploaded an image',
  'media.delete': 'Deleted an image',
  'form.save': 'Saved a form',
  'form.delete': 'Deleted a form',
  'form.answer.delete': 'Deleted a form answer',
  'inbox.delete': 'Deleted a contact message',
  'careers.delete': 'Deleted a job application',
  'team.add': 'Added a team member',
  'team.remove': 'Removed a team member',
  'team.role': 'Changed a role',
  'settings.save': 'Changed settings',
  'insights.save': 'Saved an article',
  'insights.delete': 'Deleted an article',
}

export function ActivityView({ tz }: { tz?: string | undefined }) {
  const [items, setItems] = useState<{ id: number; ts: string; user_email: string; action: string; detail: string }[] | null>(null)
  useEffect(() => {
    get<{ items: { id: number; ts: string; user_email: string; action: string; detail: string }[] }>('activity').then((d) => setItems(d.items))
  }, [])
  if (!items) return <Spinner />
  return (
    <Card title="Who changed what" pad={false}>
      {items.length === 0 ? (
        <div className="px-5 pb-5">
          <Empty>Nothing yet. Publishing, deleting, team and settings changes are recorded here.</Empty>
        </div>
      ) : (
        <ul className="m-0 list-none p-0">
          {items.map((a) => (
            <li key={a.id} className="grid gap-0.5 border-t px-5 py-3 md:grid-cols-[180px_220px_minmax(0,1fr)] md:gap-4" style={{ borderColor: C.line }}>
              <span className="text-[0.8rem] tabular-nums" style={{ color: C.muted }}>
                {fmtWhen(a.ts, tz)}
              </span>
              <span className="truncate text-[0.85rem]" style={{ color: C.ink }}>
                {a.user_email}
              </span>
              <span className="text-[0.85rem]" style={{ color: C.ink }}>
                <b>{ACTION_LABELS[a.action] ?? a.action}</b>
                {a.detail && <span style={{ color: C.muted }}> — {a.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
