'use client'

import { useCallback, useEffect, useState } from 'react'
import { type Field, type FieldType, FormFields } from '@/components/forms/PublicForm'
import { downloadUrl, fmtAgo, get, type Journey, post, type User } from './api'
import { Careers, contactLinks, DetailShell, Inbox, type ListRow, Layout, Row } from './Inbox'
import { Button, C, Card, Empty, Pill, Spinner, field, fieldStyle } from './ui'

// Forms: one place for every form on the site — the contact form, job applications, and any form
// built here. Routes (after #forms/): "", contact[/id], careers[/id], new, f<id>[/answerId], f<id>/edit, f<id>/share.

type Builtin = { key: 'contact' | 'careers'; title: string; where: string; total: number; new: number; last: string }
type Custom = { id: number; slug: string; title: string; status: 'draft' | 'live' | 'closed'; updated_at: string; total: number; new: number; last: string }

const STATUS_BG: Record<string, string> = { draft: '#ececec', live: '#b8e89a', closed: '#e6e1d4' }
const SUB_COLORS: Record<string, string> = { new: '#b8e89a', reviewed: '#cfe3ff', contacted: '#fdeec4', done: '#8fe6c2', spam: '#f3d0c8', archived: '#ececec' }
const SITE = 'https://www.atriumad.com'

export default function Forms({ user, rest, onChange, tz }: { user: User; rest: string; onChange: () => void; tz?: string | undefined }) {
  const parts = rest.split('/').filter(Boolean)
  const head = parts[0] ?? ''
  const go = (h: string) => {
    window.location.hash = h ? `forms/${h}` : 'forms'
  }
  const back = (
    <button type="button" onClick={() => go('')} className="mb-3 text-[0.85rem] font-semibold underline" style={{ color: C.series }}>
      ← All forms
    </button>
  )
  const num = (s: string | undefined) => (s && /^\d+$/.test(s) ? Number(s) : null)

  if (head === 'contact')
    return (
      <div>
        {back}
        <Inbox key={rest} user={user} initialId={num(parts[1])} onChange={onChange} tz={tz} />
      </div>
    )
  if (head === 'careers')
    return (
      <div>
        {back}
        <Careers key={rest} user={user} initialId={num(parts[1])} onChange={onChange} tz={tz} />
      </div>
    )
  if (head === 'new')
    return (
      <div>
        {back}
        <Builder user={user} id={0} onSaved={(id) => go(`f${id}/edit`)} />
      </div>
    )
  const fm = head.match(/^f(\d+)$/)
  if (fm) {
    const id = Number(fm[1])
    const sub = parts[1] ?? ''
    const tab = sub === 'edit' ? 'edit' : sub === 'share' ? 'share' : 'answers'
    return (
      <div>
        {back}
        <CustomForm key={id} user={user} id={id} tab={tab} answerId={num(sub)} go={go} onChange={onChange} tz={tz} />
      </div>
    )
  }
  return <Hub user={user} go={go} />
}

function Hub({ user, go }: { user: User; go: (h: string) => void }) {
  const [data, setData] = useState<{ builtin: Builtin[]; custom: Custom[] } | null>(null)
  useEffect(() => {
    get<{ builtin: Builtin[]; custom: Custom[] }>('forms').then(setData)
  }, [])
  if (!data) return <Spinner />
  const card = (o: { key: string; title: string; sub: string; total: number; fresh: number; last: string; status?: string; onClick: () => void }) => (
    <button key={o.key} type="button" onClick={o.onClick} className="grid content-between gap-4 rounded-2xl bg-white p-5 text-left transition hover:shadow-md" style={{ border: `1px solid ${C.line}`, minHeight: 170 }}>
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 text-[1.05rem] font-semibold" style={{ color: C.ink }}>
            {o.title}
          </h3>
          {o.status && <Pill bg={STATUS_BG[o.status]}>{o.status}</Pill>}
        </div>
        <p className="m-0 mt-1 truncate text-[0.8rem]" style={{ color: C.muted }}>
          {o.sub}
        </p>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[1.8rem] leading-none font-semibold tabular-nums" style={{ color: C.ink }}>
            {o.total}
          </div>
          <div className="text-[0.75rem]" style={{ color: C.muted }}>
            answers{o.last ? ` · last ${fmtAgo(o.last)}` : ''}
          </div>
        </div>
        {o.fresh > 0 && (
          <span className="rounded-full px-2.5 py-1 text-[0.75rem] font-bold" style={{ background: C.mint, color: C.ink }}>
            {o.fresh} new
          </span>
        )}
      </div>
    </button>
  )
  return (
    <div className="grid gap-6">
      <section>
        <h2 className="m-0 mb-3 text-[0.8rem] font-semibold tracking-[0.12em] uppercase" style={{ color: C.muted }}>
          On the website
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.builtin.map((b) => card({ key: b.key, title: b.title, sub: b.where, total: b.total, fresh: b.new, last: b.last, onClick: () => go(b.key) }))}
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="m-0 text-[0.8rem] font-semibold tracking-[0.12em] uppercase" style={{ color: C.muted }}>
            Your forms
          </h2>
          {user.role !== 'viewer' && <Button onClick={() => go('new')}>+ New form</Button>}
        </div>
        {data.custom.length === 0 ? (
          <Empty>
            Build surveys, event sign-ups, client onboarding, feedback or quote requests. Each form gets its own link to share; answers arrive here (and by email if you want).
          </Empty>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {data.custom.map((f) => card({ key: `f${f.id}`, title: f.title, sub: `/forms?f=${f.slug}`, total: f.total, fresh: f.new, last: f.last, status: f.status, onClick: () => go(`f${f.id}`) }))}
          </div>
        )}
      </section>
    </div>
  )
}

type FormDef = {
  id: number
  slug: string
  title: string
  description: string | null
  status: 'draft' | 'live' | 'closed'
  fields: Field[]
  settings: { submit_label?: string; success_title?: string; success_message?: string; closed_message?: string; notify?: string }
}

function CustomForm({ user, id, tab, answerId, go, onChange, tz }: { user: User; id: number; tab: 'answers' | 'edit' | 'share'; answerId: number | null; go: (h: string) => void; onChange: () => void; tz?: string | undefined }) {
  const [form, setForm] = useState<FormDef | null>(null)
  useEffect(() => {
    get<{ form: FormDef }>('form_get', { id }).then((d) => setForm(d.form))
  }, [id])
  if (!form) return <Spinner />
  const tabs = [
    { k: 'answers', label: 'Answers', h: `f${id}` },
    { k: 'edit', label: 'Build', h: `f${id}/edit` },
    { k: 'share', label: 'Share', h: `f${id}/share` },
  ]
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="m-0 text-[1.4rem] font-semibold" style={{ color: C.ink }}>
          {form.title}
        </h2>
        <Pill bg={STATUS_BG[form.status]}>{form.status}</Pill>
        <span className="flex-1" />
        <div className="inline-flex rounded-full bg-white p-1" style={{ border: `1px solid ${C.line}` }}>
          {tabs.map((t) => (
            <button key={t.k} type="button" onClick={() => go(t.h)} className="rounded-full px-4 py-1.5 text-[0.85rem] font-medium" style={{ background: tab === t.k ? C.ink : 'transparent', color: tab === t.k ? C.mint : C.ink }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'answers' && <Answers user={user} form={form} answerId={answerId} onChange={onChange} tz={tz} />}
      {tab === 'edit' && <Builder user={user} id={id} initial={form} onSaved={() => get<{ form: FormDef }>('form_get', { id }).then((d) => setForm(d.form))} onDeleted={() => go('')} />}
      {tab === 'share' && <Share form={form} />}
    </div>
  )
}

function Share({ form }: { form: FormDef }) {
  const url = `${SITE}/forms?f=${form.slug}`
  const [copied, setCopied] = useState('')
  const copy = (k: string, v: string) => {
    navigator.clipboard?.writeText(v)
    setCopied(k)
  }
  const tagged = `${url}&utm_source=instagram&utm_medium=social&utm_campaign=${form.slug}`
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card title="Link">
        {form.status !== 'live' && (
          <p className="m-0 mb-3 rounded-xl px-3 py-2 text-[0.85rem]" style={{ background: '#fdeec4', color: C.ink }}>
            This form is <b>{form.status}</b>. {form.status === 'draft' ? 'People who open the link see "Form not found" until you set it to Live in Build.' : 'People see your "closed" message.'}
          </p>
        )}
        <div className="flex gap-2">
          <input readOnly value={url} className={field} style={fieldStyle} onFocus={(e) => e.target.select()} />
          <Button onClick={() => copy('url', url)}>{copied === 'url' ? 'Copied ✓' : 'Copy'}</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" href={url} target="_blank">
            Open form ↗
          </Button>
          <Button variant="ghost" href={`mailto:?subject=${encodeURIComponent(form.title)}&body=${encodeURIComponent(url)}`}>
            Share by email
          </Button>
          <Button variant="ghost" href={`https://wa.me/?text=${encodeURIComponent(`${form.title}: ${url}`)}`} target="_blank">
            WhatsApp
          </Button>
        </div>
      </Card>
      <Card title="Track where answers come from">
        <p className="m-0 text-[0.85rem]" style={{ color: C.muted }}>
          Add a tag to the link for each place you share it. The Overview → Campaigns report then shows which one brought people in.
        </p>
        <div className="mt-3 flex gap-2">
          <input readOnly value={tagged} className={field} style={fieldStyle} onFocus={(e) => e.target.select()} />
          <Button variant="ghost" onClick={() => copy('tag', tagged)}>
            {copied === 'tag' ? 'Copied ✓' : 'Copy'}
          </Button>
        </div>
        <p className="m-0 mt-2 text-[0.75rem]" style={{ color: C.faint }}>
          Change “instagram” to where you&apos;re posting it (newsletter, flyer, linkedin…).
        </p>
      </Card>
    </div>
  )
}

type Answer = { id: number; created_at: string; name: string; email: string; status: string; notes: string | null; data: { id: string; label: string; value: string }[]; visitor: string }

function Answers({ user, form, answerId, onChange, tz }: { user: User; form: FormDef; answerId: number | null; onChange: () => void; tz?: string | undefined }) {
  const [rows, setRows] = useState<ListRow[] | null>(null)
  const [statuses, setStatuses] = useState<string[]>([])
  const [id, setId] = useState<number | null>(answerId)
  const [item, setItem] = useState<Answer | null>(null)
  const [journey, setJourney] = useState<Journey | null>(null)
  const canEdit = user.role !== 'viewer'

  const select = useCallback(
    (n: number | null) => {
      setId(n)
      const h = `#forms/f${form.id}${n ? `/${n}` : ''}`
      if (window.location.hash !== h) window.history.replaceState(null, '', h)
    },
    [form.id],
  )

  useEffect(() => {
    get<{ items: (ListRow & { preview: string })[]; statuses: string[] }>('form_subs', { form: form.id }).then((d) => {
      setStatuses(d.statuses)
      setRows(d.items.map((r) => ({ ...r, sub: r.email || '' })))
    })
  }, [form.id])

  useEffect(() => {
    if (!id) return setItem(null)
    setItem(null)
    setJourney(null)
    get<{ item: Answer; journey: Journey }>('form_sub_get', { id })
      .then((d) => {
        setItem(d.item)
        setJourney(d.journey)
      })
      .catch(() => select(null))
  }, [id, select])

  const phone = item?.data.find((d) => /phone|tel|whatsapp|teléfono/i.test(d.label))?.value ?? ''

  return (
    <Layout
      title="Answers"
      statuses={statuses}
      colors={SUB_COLORS}
      rows={rows}
      selected={id}
      onSelect={select}
      exportHref={downloadUrl('form_export', { form: form.id })}
      detail={
        !id ? (
          <Card>
            <div className="pt-5">
              <Empty>{rows?.length ? 'Pick an answer to read it.' : 'No answers yet. Share the link from the Share tab.'}</Empty>
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
            colors={SUB_COLORS}
            canEdit={canEdit}
            tz={tz}
            journey={journey}
            onStatus={async (s) => {
              await post('form_sub_update', { status: s }, { id: item.id })
              setItem({ ...item, status: s })
              setRows((p) => p?.map((r) => (r.id === item.id ? { ...r, status: s } : r)) ?? p)
              onChange()
            }}
            actions={item.email ? contactLinks(item.email, phone, `Re: ${form.title}`) : null}
            notes={item.notes ?? ''}
            onSaveNotes={async (n) => {
              await post('form_sub_update', { notes: n }, { id: item.id })
            }}
            onDelete={async () => {
              if (!window.confirm("Delete this answer? This can't be undone.")) return
              await post('form_sub_delete', {}, { id: item.id })
              setRows((p) => p?.filter((r) => r.id !== item.id) ?? p)
              select(null)
              onChange()
            }}
          >
            <dl className="m-0 grid gap-3">
              {item.data.map((d) => (
                <Row key={d.id} label={d.label} value={d.value || '—'} />
              ))}
            </dl>
          </DetailShell>
        )
      }
    />
  )
}

// ── Builder ──────────────────────────────────────────────────────────────────

const TYPES: { type: FieldType; label: string; hint: string }[] = [
  { type: 'text', label: 'Short answer', hint: 'Name, company, one line' },
  { type: 'textarea', label: 'Long answer', hint: 'Paragraphs' },
  { type: 'email', label: 'Email', hint: 'Checked as an email' },
  { type: 'phone', label: 'Phone', hint: '' },
  { type: 'number', label: 'Number', hint: '' },
  { type: 'date', label: 'Date', hint: '' },
  { type: 'select', label: 'Dropdown', hint: 'Pick one from a list' },
  { type: 'radio', label: 'Multiple choice', hint: 'Pick one (buttons)' },
  { type: 'checkbox', label: 'Checkboxes', hint: 'Pick several' },
  { type: 'yesno', label: 'Yes / No', hint: '' },
  { type: 'section', label: 'Section title', hint: 'Heading + text, no answer' },
]

const TEMPLATES: Record<string, { title: string; description: string; fields: Partial<Field>[] }> = {
  blank: { title: '', description: '', fields: [] },
  event: {
    title: 'Event RSVP',
    description: "Tell us you're coming. We'll send the details by email.",
    fields: [
      { type: 'text', label: 'Your name', required: true, width: 'half' },
      { type: 'email', label: 'Email', required: true, width: 'half' },
      { type: 'select', label: 'How many people?', options: ['1', '2', '3', '4', '5+'], required: true },
      { type: 'textarea', label: 'Anything we should know? (dietary needs, accessibility)' },
    ],
  },
  feedback: {
    title: 'Client feedback',
    description: 'Two minutes. It helps us do better work for you.',
    fields: [
      { type: 'text', label: 'Your name', width: 'half' },
      { type: 'text', label: 'Business', width: 'half' },
      { type: 'radio', label: 'How happy are you with Atrium overall?', options: ['1', '2', '3', '4', '5'], required: true },
      { type: 'checkbox', label: 'What is working well?', options: ['Content', 'Ads', 'Reporting', 'Communication', 'Results'] },
      { type: 'textarea', label: 'What should we do differently?' },
      { type: 'yesno', label: 'Can we quote you on our website?' },
    ],
  },
  onboarding: {
    title: 'New client onboarding',
    description: 'Everything we need to start. Takes about 10 minutes.',
    fields: [
      { type: 'section', label: 'The business' },
      { type: 'text', label: 'Business name', required: true, width: 'half' },
      { type: 'text', label: 'Website', width: 'half' },
      { type: 'number', label: 'Number of locations', width: 'half' },
      { type: 'text', label: 'Instagram handle', width: 'half' },
      { type: 'section', label: 'Main contact' },
      { type: 'text', label: 'Your name', required: true, width: 'half' },
      { type: 'email', label: 'Email', required: true, width: 'half' },
      { type: 'phone', label: 'Phone / WhatsApp', width: 'half' },
      { type: 'section', label: 'Goals' },
      { type: 'checkbox', label: 'What matters most in the next 90 days?', options: ['More reservations', 'More online orders', 'More reviews', 'Brand awareness', 'Events / private dining', 'Hiring'] },
      { type: 'textarea', label: 'Anything else we should know before we start?' },
    ],
  },
  quote: {
    title: 'Request a quote',
    description: 'Tell us what you need and we will reply with a proposal.',
    fields: [
      { type: 'text', label: 'Your name', required: true, width: 'half' },
      { type: 'email', label: 'Email', required: true, width: 'half' },
      { type: 'text', label: 'Business name', width: 'half' },
      { type: 'phone', label: 'Phone', width: 'half' },
      { type: 'checkbox', label: 'Services', options: ['Social content', 'Paid ads', 'Photo & video', 'SEO & Google', 'Email & SMS', 'Branding'] },
      { type: 'select', label: 'Monthly budget', options: ['Under $2k', '$2k–5k', '$5k–10k', '$10k+'] },
      { type: 'date', label: 'Ideal start date', width: 'half' },
      { type: 'textarea', label: 'Project details', required: true },
    ],
  },
}

const newId = () => `f${Math.random().toString(36).slice(2, 8)}`
const withIds = (fields: Partial<Field>[]): Field[] => fields.map((f) => ({ id: newId(), type: 'text', label: '', required: false, options: [], width: 'full', ...f }) as Field)

function Builder({ user, id, initial, onSaved, onDeleted }: { user: User; id: number; initial?: FormDef; onSaved: (id: number) => void; onDeleted?: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [status, setStatus] = useState<FormDef['status']>(initial?.status ?? 'draft')
  const [fields, setFields] = useState<Field[]>(initial?.fields ?? [])
  const [settings, setSettings] = useState<FormDef['settings']>(initial?.settings ?? {})
  const [open, setOpen] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [preview, setPreview] = useState<Record<string, string | string[]>>({})
  const [picked, setPicked] = useState(!!initial)
  const canEdit = user.role !== 'viewer'

  function applyTemplate(k: string) {
    const t = TEMPLATES[k]
    if (!t) return
    setTitle(t.title)
    setDescription(t.description)
    setFields(withIds(t.fields))
    setPicked(true)
  }
  function add(type: FieldType) {
    const f = withIds([{ type, label: TYPES.find((t) => t.type === type)?.label ?? '', options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : [] }])[0] as Field
    setFields((p) => [...p, f])
    setOpen(f.id)
  }
  const upd = (fid: string, patch: Partial<Field>) => setFields((p) => p.map((f) => (f.id === fid ? { ...f, ...patch } : f)))
  const move = (i: number, d: -1 | 1) =>
    setFields((p) => {
      const n = [...p]
      const j = i + d
      if (j < 0 || j >= n.length) return p
      ;[n[i], n[j]] = [n[j] as Field, n[i] as Field]
      return n
    })

  async function save() {
    setMsg('')
    if (!title.trim()) return setMsg('Give the form a title.')
    try {
      const r = await post<{ id: number; slug: string }>('form_save', { title, description, slug, status, fields, settings }, { id: id || undefined })
      setSlug(r.slug)
      setMsg(status === 'live' ? 'Saved. The form is live.' : 'Saved.')
      onSaved(r.id)
    } catch (err) {
      setMsg((err as { code?: string }).code === 'email' ? 'One of the notification emails is not valid.' : 'Could not save.')
    }
  }

  if (!picked) {
    return (
      <Card title="Start from">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Object.entries(TEMPLATES).map(([k, t]) => (
            <button key={k} type="button" onClick={() => applyTemplate(k)} className="rounded-2xl p-4 text-left hover:shadow-md" style={{ border: `1px solid ${C.line}`, background: k === 'blank' ? '#fff' : 'rgba(184,232,154,0.18)' }}>
              <b style={{ color: C.ink }}>{k === 'blank' ? 'Blank form' : t.title}</b>
              <span className="mt-1 block text-[0.8rem]" style={{ color: C.muted }}>
                {k === 'blank' ? 'Start from nothing' : `${t.fields.length} questions`}
              </span>
            </button>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="grid content-start gap-4">
        <Card title="Form">
          <div className="grid gap-3">
            <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={field} style={fieldStyle} disabled={!canEdit} />
            </label>
            <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
              Intro text <span className="font-normal opacity-60">(optional)</span>
              <textarea rows={3} value={description ?? ''} onChange={(e) => setDescription(e.target.value)} className={field} style={fieldStyle} disabled={!canEdit} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
                Status
                <select value={status} onChange={(e) => setStatus(e.target.value as FormDef['status'])} className={field} style={fieldStyle} disabled={!canEdit}>
                  <option value="draft">Draft (hidden)</option>
                  <option value="live">Live (accepting answers)</option>
                  <option value="closed">Closed (shows a message)</option>
                </select>
              </label>
              <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
                Link name
                <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="made from the title" className={field} style={fieldStyle} disabled={!canEdit} />
              </label>
            </div>
          </div>
        </Card>

        <Card title={`Questions (${fields.filter((f) => f.type !== 'section').length})`}>
          <ol className="m-0 grid list-none gap-2 p-0">
            {fields.map((f, i) => (
              <li key={f.id} className="rounded-xl" style={{ border: `1px solid ${open === f.id ? C.series : C.line}` }}>
                <div className="flex items-center gap-2 px-3 py-2">
                  <button type="button" onClick={() => setOpen(open === f.id ? null : f.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[0.9rem] font-semibold" style={{ color: C.ink }}>
                      {f.label || '(no label)'} {f.required && <span style={{ color: C.down }}>*</span>}
                    </span>
                    <span className="text-[0.75rem]" style={{ color: C.muted }}>
                      {TYPES.find((t) => t.type === f.type)?.label}
                    </span>
                  </button>
                  {canEdit && (
                    <>
                      <button type="button" aria-label="Move up" onClick={() => move(i, -1)} className="rounded px-1.5" style={{ color: C.muted }}>
                        ↑
                      </button>
                      <button type="button" aria-label="Move down" onClick={() => move(i, 1)} className="rounded px-1.5" style={{ color: C.muted }}>
                        ↓
                      </button>
                      <button type="button" aria-label="Remove question" onClick={() => setFields((p) => p.filter((x) => x.id !== f.id))} className="rounded px-1.5" style={{ color: C.down }}>
                        ✕
                      </button>
                    </>
                  )}
                </div>
                {open === f.id && canEdit && (
                  <div className="grid gap-2 border-t px-3 py-3" style={{ borderColor: C.line }}>
                    <label className="grid gap-1 text-[0.8rem] font-medium" style={{ color: C.ink }}>
                      {f.type === 'section' ? 'Heading' : 'Question'}
                      <input value={f.label} onChange={(e) => upd(f.id, { label: e.target.value })} className={field} style={fieldStyle} autoFocus />
                    </label>
                    <label className="grid gap-1 text-[0.8rem] font-medium" style={{ color: C.ink }}>
                      Help text <span className="font-normal opacity-60">(optional)</span>
                      <input value={f.help ?? ''} onChange={(e) => upd(f.id, { help: e.target.value })} className={field} style={fieldStyle} />
                    </label>
                    {['select', 'radio', 'checkbox'].includes(f.type) && (
                      <label className="grid gap-1 text-[0.8rem] font-medium" style={{ color: C.ink }}>
                        Options (one per line)
                        <textarea rows={4} value={(f.options ?? []).join('\n')} onChange={(e) => upd(f.id, { options: e.target.value.split('\n') })} className={field} style={fieldStyle} />
                      </label>
                    )}
                    {['text', 'textarea', 'email', 'phone', 'number', 'select'].includes(f.type) && (
                      <label className="grid gap-1 text-[0.8rem] font-medium" style={{ color: C.ink }}>
                        Placeholder <span className="font-normal opacity-60">(optional)</span>
                        <input value={f.placeholder ?? ''} onChange={(e) => upd(f.id, { placeholder: e.target.value })} className={field} style={fieldStyle} />
                      </label>
                    )}
                    {f.type !== 'section' && (
                      <div className="flex flex-wrap gap-4 text-[0.85rem]" style={{ color: C.ink }}>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={!!f.required} onChange={(e) => upd(f.id, { required: e.target.checked })} /> Required
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={f.width === 'half'} onChange={(e) => upd(f.id, { width: e.target.checked ? 'half' : 'full' })} /> Half width
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
          {canEdit && (
            <div className="mt-4">
              <div className="mb-2 text-[0.8rem] font-semibold" style={{ color: C.muted }}>
                Add a question
              </div>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button key={t.type} type="button" onClick={() => add(t.type)} title={t.hint} className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium" style={{ background: 'rgba(4,47,52,0.06)', color: C.ink }}>
                    + {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="After someone answers">
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
                Button text
                <input value={settings.submit_label ?? ''} placeholder="Send" onChange={(e) => setSettings({ ...settings, submit_label: e.target.value })} className={field} style={fieldStyle} disabled={!canEdit} />
              </label>
              <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
                Thank-you title
                <input value={settings.success_title ?? ''} placeholder="Thank you!" onChange={(e) => setSettings({ ...settings, success_title: e.target.value })} className={field} style={fieldStyle} disabled={!canEdit} />
              </label>
            </div>
            <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
              Thank-you message
              <textarea rows={2} value={settings.success_message ?? ''} placeholder="We've received your answers." onChange={(e) => setSettings({ ...settings, success_message: e.target.value })} className={field} style={fieldStyle} disabled={!canEdit} />
            </label>
            <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
              Email each answer to <span className="font-normal opacity-60">(optional, commas between addresses; empty = the address in Settings)</span>
              <input value={settings.notify ?? ''} onChange={(e) => setSettings({ ...settings, notify: e.target.value })} className={field} style={fieldStyle} disabled={!canEdit} />
            </label>
            <label className="grid gap-1 text-[0.85rem] font-medium" style={{ color: C.ink }}>
              Message when closed
              <input value={settings.closed_message ?? ''} placeholder="This form is no longer accepting answers." onChange={(e) => setSettings({ ...settings, closed_message: e.target.value })} className={field} style={fieldStyle} disabled={!canEdit} />
            </label>
          </div>
        </Card>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={save}>{id ? 'Save form' : 'Create form'}</Button>
            <span className="text-[0.85rem]" style={{ color: msg.startsWith('Saved') ? C.up : C.down }}>
              {msg}
            </span>
            <span className="flex-1" />
            {id > 0 && onDeleted && (
              <Button
                variant="danger"
                onClick={async () => {
                  if (!window.confirm(`Delete "${title}" and all its answers? This can't be undone.`)) return
                  await post('form_delete', {}, { id })
                  onDeleted()
                }}
              >
                Delete form
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="xl:sticky xl:top-20 xl:self-start">
        <Card title="Preview" action={<span className="text-[0.75rem]" style={{ color: C.faint }}>What visitors see</span>}>
          <div className="rounded-2xl p-5" style={{ background: '#f3efe4' }}>
            <h3 className="m-0 text-[1.8rem] leading-tight font-normal" style={{ color: C.ink }}>
              {title || 'Untitled form'}
            </h3>
            {description && (
              <p className="m-0 mt-2 whitespace-pre-line text-[0.95rem]" style={{ color: C.muted }}>
                {description}
              </p>
            )}
            <div className="mt-5 rounded-2xl bg-white p-5">
              {fields.length ? (
                <FormFields fields={fields} values={preview} invalid={[]} onChange={(fid, v) => setPreview((p) => ({ ...p, [fid]: v }))} />
              ) : (
                <Empty>Add questions on the left.</Empty>
              )}
              <span className="mt-5 inline-block rounded-full px-6 py-2.5 font-semibold" style={{ background: C.ink, color: C.mint }}>
                {settings.submit_label || 'Send'}
              </span>
            </div>
          </div>
          {id > 0 && (
            <p className="m-0 mt-3 text-[0.8rem]" style={{ color: C.muted }}>
              Export answers:{' '}
              <a href={downloadUrl('form_export', { form: id })} style={{ color: C.series }}>
                CSV
              </a>
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
