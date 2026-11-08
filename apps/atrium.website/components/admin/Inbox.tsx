'use client'

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { downloadUrl, fmtAgo, fmtWhen, get, type Journey, post, type User } from './api'
import { JourneyTimeline } from './Journey'
import { Button, C, Card, Empty, field, fieldStyle, Pill, Spinner } from './ui'

// Contact-form messages (leads) and job applications share this list/detail layout.

export type ListRow = { id: number; created_at: string; name: string; email: string; status: string; sub: string; preview?: string | undefined; flag?: string | undefined }

export const INBOX_COLORS: Record<string, string> = {
  new: '#b8e89a',
  contacted: '#cfe3ff',
  qualified: '#fdeec4',
  won: '#8fe6c2',
  lost: '#e6e1d4',
  spam: '#f3d0c8',
  archived: '#ececec',
}
export const CAREER_COLORS: Record<string, string> = {
  nuevo: '#b8e89a',
  revisar: '#fdeec4',
  entrevista: '#cfe3ff',
  finalista: '#e2d6ff',
  descartado: '#e6e1d4',
  contratado: '#8fe6c2',
}

export function Layout({
  title,
  statuses,
  colors,
  rows,
  selected,
  onSelect,
  exportHref,
  extra,
  detail,
}: {
  title: string
  statuses: string[]
  colors: Record<string, string>
  rows: ListRow[] | null
  selected: number | null
  onSelect: (id: number) => void
  exportHref: string
  extra?: ReactNode | undefined
  detail: ReactNode
}) {
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const shown = useMemo(
    () =>
      (rows ?? []).filter(
        (r) =>
          (filter === 'all' || r.status === filter) &&
          (!q || `${r.name} ${r.email} ${r.sub} ${r.preview ?? ''}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [rows, filter, q],
  )
  if (!rows) return <Spinner />
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {['all', ...statuses].map((s) => {
          const n = s === 'all' ? rows.length : rows.filter((r) => r.status === s).length
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium capitalize"
              style={{ background: filter === s ? C.ink : '#fff', color: filter === s ? C.mint : C.ink, border: `1px solid ${C.line}` }}
            >
              {s} <span className="opacity-60">{n}</span>
            </button>
          )
        })}
        <span className="flex-1" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label={`Search ${title}`} className={`${field} !w-44 !py-1.5`} style={fieldStyle} />
        {extra}
        <Button variant="ghost" href={exportHref}>
          Export CSV
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <Card pad={false} className="self-start overflow-hidden">
          {shown.length === 0 ? (
            <div className="p-5">
              <Empty>{rows.length ? 'Nothing matches this filter.' : `No ${title.toLowerCase()} yet.`}</Empty>
            </div>
          ) : (
            <ul className="m-0 max-h-[75vh] list-none overflow-y-auto p-0">
              {shown.map((r) => (
                <li key={r.id} className="border-b last:border-b-0" style={{ borderColor: C.line }}>
                  <button
                    type="button"
                    onClick={() => onSelect(r.id)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-5 py-3.5 text-left hover:bg-[rgba(4,47,52,0.03)]"
                    style={{ background: selected === r.id ? 'rgba(184,232,154,0.28)' : undefined }}
                  >
                    <span className="truncate font-semibold" style={{ color: C.ink }}>
                      {r.status === 'new' || r.status === 'nuevo' ? <span style={{ color: C.series }}>● </span> : null}
                      {r.name}
                    </span>
                    <span className="text-[0.75rem] tabular-nums" style={{ color: C.muted }} title={fmtWhen(r.created_at)}>
                      {fmtAgo(r.created_at)}
                    </span>
                    <span className="truncate text-[0.8rem]" style={{ color: C.muted }}>
                      {r.sub}
                    </span>
                    <Pill bg={colors[r.status]}>{r.status}</Pill>
                    {r.preview && (
                      <span className="col-span-2 truncate text-[0.8rem]" style={{ color: C.faint }}>
                        {r.preview}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="min-w-0">{detail}</div>
      </div>
    </div>
  )
}

export function DetailShell({
  name,
  when,
  status,
  statuses,
  colors,
  canEdit,
  onStatus,
  actions,
  children,
  notes,
  onSaveNotes,
  onDelete,
  journey,
  tz,
}: {
  name: string
  when: string
  status: string
  statuses: string[]
  colors: Record<string, string>
  canEdit: boolean
  onStatus: (s: string) => void
  actions: ReactNode
  children: ReactNode
  notes: string
  onSaveNotes: (n: string) => Promise<void>
  onDelete: () => void
  journey: Journey | null
  tz?: string | undefined
}) {
  const [draft, setDraft] = useState(notes)
  const [saved, setSaved] = useState('')
  const [tab, setTab] = useState<'details' | 'journey'>('details')
  useEffect(() => {
    setDraft(notes)
    setSaved('')
  }, [notes])
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3 pt-5">
        <div className="min-w-0">
          <h2 className="m-0 text-[1.5rem] font-semibold break-words" style={{ color: C.ink }}>
            {name}
          </h2>
          <p className="m-0 mt-1 text-[0.85rem]" style={{ color: C.muted }}>
            {fmtWhen(when, tz)}
          </p>
        </div>
        <select
          value={status}
          disabled={!canEdit}
          onChange={(e) => onStatus(e.target.value)}
          aria-label="Status"
          className="rounded-full border px-3 py-1.5 text-[0.85rem] font-medium capitalize"
          style={{ borderColor: C.line, background: colors[status], color: C.ink }}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
      <div className="mt-5 flex gap-1 border-b" style={{ borderColor: C.line }}>
        {(['details', 'journey'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className="-mb-px border-b-2 px-3 py-2 text-[0.85rem] font-semibold"
            style={{ borderColor: tab === t ? C.series : 'transparent', color: tab === t ? C.ink : C.muted }}
          >
            {t === 'details' ? 'Details' : `Website journey${journey?.summary ? ` (${journey.summary.visits} visit${journey.summary.visits === 1 ? '' : 's'})` : ''}`}
          </button>
        ))}
      </div>
      <div className="pt-5">{tab === 'details' ? children : journey ? <JourneyTimeline journey={journey} tz={tz} /> : <Spinner />}</div>
      <section className="mt-6 border-t pt-5" style={{ borderColor: C.line }}>
        <h3 className="m-0 mb-2 text-[0.8rem] font-semibold tracking-wide uppercase" style={{ color: C.muted }}>
          Internal notes
        </h3>
        <textarea
          rows={4}
          value={draft}
          disabled={!canEdit}
          onChange={(e) => {
            setDraft(e.target.value)
            setSaved('')
          }}
          className={field}
          style={fieldStyle}
          placeholder="Only your team sees this."
        />
        {canEdit && (
          <div className="mt-2 flex items-center gap-3">
            <Button
              onClick={async () => {
                await onSaveNotes(draft)
                setSaved('Saved')
              }}
            >
              Save notes
            </Button>
            <span className="text-[0.85rem]" style={{ color: C.muted }}>
              {saved}
            </span>
            <span className="flex-1" />
            <Button variant="danger" onClick={onDelete}>
              Delete
            </Button>
          </div>
        )}
      </section>
    </Card>
  )
}

export function Row({ label, value }: { label: string; value?: string | undefined | null }) {
  if (!value) return null
  const link = /^https?:\/\//i.test(value)
  return (
    <div>
      <dt className="text-[0.75rem] font-semibold tracking-wide uppercase" style={{ color: C.faint }}>
        {label}
      </dt>
      <dd className="m-0 mt-0.5 break-words whitespace-pre-wrap text-[0.95rem]" style={{ color: C.ink }}>
        {link ? (
          <a href={value} target="_blank" rel="noopener noreferrer nofollow" style={{ color: C.series }}>
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

export function contactLinks(email: string, phone: string, subject: string) {
  const digits = phone.replace(/[^\d]/g, '')
  return (
    <>
      <Button href={`mailto:${email}?subject=${encodeURIComponent(subject)}`}>Reply by email</Button>
      {digits && (
        <>
          <Button variant="ghost" href={`https://wa.me/${digits}`} target="_blank">
            WhatsApp
          </Button>
          <Button variant="ghost" href={`tel:${phone.replace(/[^\d+]/g, '')}`}>
            Call
          </Button>
        </>
      )}
    </>
  )
}

export function useHashId(prefix: string, initial: number | null) {
  const [id, setId] = useState<number | null>(initial)
  const select = useCallback(
    (n: number | null) => {
      setId(n)
      const h = n ? `#${prefix}/${n}` : `#${prefix}`
      if (window.location.hash !== h) window.history.replaceState(null, '', h)
    },
    [prefix],
  )
  return [id, select] as const
}

// ── Inbox (contact form) ─────────────────────────────────────────────────────

type Contact = {
  id: number
  created_at: string
  name: string
  email: string
  phone: string
  business: string
  interest: string
  locations: string
  budget: string
  message: string
  page: string
  status: string
  notes: string | null
}

export function Inbox({ user, initialId, onChange, tz }: { user: User; initialId: number | null; onChange: () => void; tz?: string | undefined }) {
  const [rows, setRows] = useState<(ListRow & { business: string })[] | null>(null)
  const [statuses, setStatuses] = useState<string[]>([])
  const [id, select] = useHashId('forms/contact', initialId)
  const [item, setItem] = useState<Contact | null>(null)
  const [journey, setJourney] = useState<Journey | null>(null)
  const canEdit = user.role !== 'viewer'

  const load = useCallback(() => {
    get<{ items: (Contact & { preview: string })[]; statuses: string[] }>('inbox').then((d) => {
      setStatuses(d.statuses)
      setRows(d.items.map((r) => ({ id: r.id, created_at: r.created_at, name: r.name, email: r.email, status: r.status, business: r.business, sub: [r.business, r.email].filter(Boolean).join(' · '), preview: r.preview })))
    })
  }, [])
  useEffect(load, [load])

  useEffect(() => {
    if (!id) return setItem(null)
    setItem(null)
    setJourney(null)
    get<{ item: Contact; journey: Journey }>('inbox_get', { id })
      .then((d) => {
        setItem(d.item)
        setJourney(d.journey)
      })
      .catch(() => select(null))
  }, [id, select])

  async function setStatus(s: string) {
    if (!item) return
    await post('inbox_update', { status: s }, { id: item.id })
    setItem({ ...item, status: s })
    setRows((p) => p?.map((r) => (r.id === item.id ? { ...r, status: s } : r)) ?? p)
    onChange()
  }

  return (
    <Layout
      title="Messages"
      statuses={statuses}
      colors={INBOX_COLORS}
      rows={rows}
      selected={id}
      onSelect={select}
      exportHref={downloadUrl('inbox_export')}
      detail={
        !id ? (
          <Card>
            <div className="pt-5">
              <Empty>Pick a message to read it. New messages from the contact form at /contact appear here.</Empty>
            </div>
          </Card>
        ) : !item ? (
          <Card>
            <Spinner />
          </Card>
        ) : (
          <DetailShell
            name={item.name}
            when={item.created_at}
            status={item.status}
            statuses={statuses}
            colors={INBOX_COLORS}
            canEdit={canEdit}
            onStatus={setStatus}
            tz={tz}
            actions={contactLinks(item.email, item.phone, `Re: ${item.business || 'your message to Atrium'}`)}
            notes={item.notes ?? ''}
            journey={journey}
            onSaveNotes={async (n) => {
              await post('inbox_update', { notes: n }, { id: item.id })
            }}
            onDelete={async () => {
              if (!window.confirm(`Delete the message from ${item.name}? This can't be undone. (To hide it, set the status to "archived" instead.)`)) return
              await post('inbox_delete', {}, { id: item.id })
              setRows((p) => p?.filter((r) => r.id !== item.id) ?? p)
              select(null)
              onChange()
            }}
          >
            <dl className="m-0 grid gap-4 sm:grid-cols-2">
              <Row label="Email" value={item.email} />
              <Row label="Phone" value={item.phone} />
              <Row label="Business" value={item.business} />
              <Row label="Interested in" value={item.interest} />
              <Row label="Locations" value={item.locations} />
              <Row label="Monthly budget" value={item.budget} />
              <div className="sm:col-span-2">
                <Row label="Message" value={item.message} />
              </div>
              <Row label="Sent from page" value={item.page} />
            </dl>
          </DetailShell>
        )
      }
    />
  )
}

// ── Careers ──────────────────────────────────────────────────────────────────

type Application = {
  id: number
  created_at: string
  job: string
  name: string
  email: string
  phone: string
  status: string
  has_cv: number
  notes: string | null
  data: { sections?: { title: string; items: { label: string; value: string }[] }[] } | null
}

export const LISTINGS: [{ job: string; title: string; path: string }, ...{ job: string; title: string; path: string }[]] = [{ job: 'account-manager-habana', title: 'Account Manager (La Habana)', path: '/careers/account-manager-95fc33' }]

export function Careers({ user, initialId, onChange, tz }: { user: User; initialId: number | null; onChange: () => void; tz?: string | undefined }) {
  const [rows, setRows] = useState<ListRow[] | null>(null)
  const [statuses, setStatuses] = useState<string[]>([])
  const [id, select] = useHashId('forms/careers', initialId)
  const [item, setItem] = useState<Application | null>(null)
  const [journey, setJourney] = useState<Journey | null>(null)
  const canEdit = user.role !== 'viewer'

  useEffect(() => {
    get<{ items: Application[]; statuses: string[] }>('apps').then((d) => {
      setStatuses(d.statuses)
      setRows(
        d.items.map((r) => ({
          id: r.id,
          created_at: r.created_at,
          name: r.name,
          email: r.email,
          status: r.status,
          sub: [LISTINGS.find((l) => l.job === r.job)?.title ?? r.job, r.has_cv ? 'CV' : ''].filter(Boolean).join(' · '),
        })),
      )
    })
  }, [])

  useEffect(() => {
    if (!id) return setItem(null)
    setItem(null)
    setJourney(null)
    get<{ item: Application; journey: Journey }>('app_get', { id })
      .then((d) => {
        setItem(d.item)
        setJourney(d.journey)
      })
      .catch(() => select(null))
  }, [id, select])

  async function setStatus(s: string) {
    if (!item) return
    await post('app_update', { status: s }, { id: item.id })
    setItem({ ...item, status: s })
    setRows((p) => p?.map((r) => (r.id === item.id ? { ...r, status: s } : r)) ?? p)
    onChange()
  }

  return (
    <Layout
      title="Applications"
      statuses={statuses}
      colors={CAREER_COLORS}
      rows={rows}
      selected={id}
      onSelect={select}
      exportHref={downloadUrl('apps_export')}
      extra={LISTINGS.map((l) => (
        <Button key={l.job} variant="ghost" href={l.path} target="_blank">
          Job listing ↗
        </Button>
      ))}
      detail={
        !id ? (
          <Card>
            <div className="pt-5">
              <Empty>
                Pick an application to read it. Share the private listing link to receive applications:{' '}
                <a href={LISTINGS[0].path} target="_blank" rel="noopener" style={{ color: C.series }}>
                  {LISTINGS[0].title}
                </a>
              </Empty>
            </div>
          </Card>
        ) : !item ? (
          <Card>
            <Spinner />
          </Card>
        ) : (
          <DetailShell
            name={item.name}
            when={item.created_at}
            status={item.status}
            statuses={statuses}
            colors={CAREER_COLORS}
            canEdit={canEdit}
            onStatus={setStatus}
            tz={tz}
            journey={journey}
            actions={
              <>
                {contactLinks(item.email, item.phone, 'Atrium — Account Manager')}
                {item.has_cv ? (
                  <Button variant="ghost" href={downloadUrl('cv', { id: item.id })} target="_blank">
                    View CV (PDF)
                  </Button>
                ) : null}
              </>
            }
            notes={item.notes ?? ''}
            onSaveNotes={async (n) => {
              await post('app_update', { notes: n }, { id: item.id })
            }}
            onDelete={async () => {
              if (!window.confirm(`Delete ${item.name}'s application and CV? This can't be undone. (To set it aside, use the "descartado" status.)`)) return
              await post('app_delete', {}, { id: item.id })
              setRows((p) => p?.filter((r) => r.id !== item.id) ?? p)
              select(null)
              onChange()
            }}
          >
            <div className="grid gap-6">
              {(item.data?.sections ?? []).map((sec) => (
                <section key={sec.title}>
                  <h3 className="m-0 mb-3 text-[0.8rem] font-semibold tracking-wide uppercase" style={{ color: C.muted }}>
                    {sec.title}
                  </h3>
                  <dl className="m-0 grid gap-3">
                    {sec.items.map((it) => (
                      <Row key={it.label} label={it.label} value={it.value} />
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          </DetailShell>
        )
      }
    />
  )
}
