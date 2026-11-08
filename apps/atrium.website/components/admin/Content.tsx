'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fmtAgo, fmtNum, fmtWhen, get, post, type User } from './api'
import { MediaPicker } from './Website'
import { Button, C, Card, Empty, Pill, Segmented, Spinner, field, fieldStyle } from './ui'

// Website → Content: the list of pages, and a visual editor that loads the real page in a frame.
// Click any outlined text to edit it in place. Edits are saved as drafts; "Publish" makes them live.

type PageRow = { path: string; title: string; edits: number; drafts: number; updated: string; seo: boolean; views: number }
type Entry = { k: string; kind: string; published: string | null; draft: string | null; updated_at: string; updated_by: string }
type Revision = { id: number; ts: string; user_email: string; note: string }
type Seo = { title?: string; description?: string; image?: string; noindex?: boolean }

export default function Content({ user, path, onOpen, onChange }: { user: User; path: string | null; onOpen: (path: string | null) => void; onChange: () => void }) {
  if (path) return <PageEditor key={path} user={user} path={path} onBack={() => onOpen(null)} onOpen={onOpen} onChange={onChange} />
  return <PageList onOpen={onOpen} />
}

function PageList({ onOpen }: { onOpen: (p: string) => void }) {
  const [pages, setPages] = useState<PageRow[] | null>(null)
  const [global, setGlobal] = useState({ edits: 0, drafts: 0 })
  const [q, setQ] = useState('')
  useEffect(() => {
    get<{ pages: PageRow[]; global: { edits: number; drafts: number } }>('cms_pages').then((d) => {
      setPages(d.pages)
      setGlobal(d.global)
    })
  }, [])
  const shown = useMemo(() => (pages ?? []).filter((p) => !q || `${p.path} ${p.title}`.toLowerCase().includes(q.toLowerCase())), [pages, q])
  if (!pages) return <Spinner />
  const groups = new Map<string, PageRow[]>()
  for (const p of shown) {
    const g = p.path === '/' ? 'Main pages' : p.path.split('/').length > 2 ? p.path.split('/')[1]?.replace(/^\w/, (c) => c.toUpperCase()) ?? 'Pages' : 'Main pages'
    groups.set(g, [...(groups.get(g) ?? []), p])
  }
  return (
    <div className="grid gap-4">
      <div className="rounded-2xl px-5 py-4 text-[0.9rem]" style={{ background: 'rgba(184,232,154,0.35)', color: C.ink }}>
        <b>How it works:</b> open a page, click any text with a dotted outline and type. Save keeps a draft only you see; <b>Publish</b> puts it on the live site
        instantly. Every publish is kept in History, so you can always go back.
        {(global.edits > 0 || global.drafts > 0) && (
          <span>
            {' '}
            Footer text (shared by all pages): {global.edits} live edit{global.edits === 1 ? '' : 's'}
            {global.drafts ? `, ${global.drafts} draft` : ''}.
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${pages.length} pages…`} className={`${field} !w-72`} style={fieldStyle} aria-label="Search pages" />
      </div>
      {[...groups.entries()].map(([g, list]) => (
        <Card key={g} title={`${g} (${list.length})`} pad={false}>
          <ul className="m-0 list-none p-0">
            {list.map((p) => (
              <li key={p.path} className="border-t" style={{ borderColor: C.line }}>
                <button type="button" onClick={() => onOpen(p.path)} className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-left hover:bg-[rgba(4,47,52,0.03)] md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold" style={{ color: C.ink }}>
                      {p.title.replace(/ — Atrium$| \| Atrium$/, '')}
                    </span>
                    <span className="block truncate text-[0.8rem]" style={{ color: C.muted }}>
                      {p.path}
                    </span>
                  </span>
                  <span className="hidden text-[0.8rem] tabular-nums md:block" style={{ color: C.muted }} title="Page views, last 30 days">
                    {fmtNum(p.views)} views
                  </span>
                  <span className="hidden gap-1.5 md:flex">
                    {p.edits > 0 && <Pill bg="rgba(184,232,154,0.6)">{p.edits} edited</Pill>}
                    {p.drafts > 0 && <Pill bg="#fdeec4">{p.drafts} draft</Pill>}
                    {p.seo && <Pill>SEO</Pill>}
                  </span>
                  <span className="text-[0.85rem] font-semibold" style={{ color: C.series }}>
                    Edit →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  )
}

const EDITOR_CSS = `
[data-cms]{outline:1px dashed rgba(30,140,124,.55);outline-offset:2px;cursor:text;border-radius:2px;transition:outline-color .15s, background .15s}
[data-cms]:hover{outline:2px solid #1e8c7c;background:rgba(184,232,154,.18)}
[data-cms][contenteditable="true"]{outline:2px solid #1e8c7c;background:rgba(255,255,255,.12);box-shadow:0 0 0 4px rgba(184,232,154,.45)}
[data-cms].cms-changed{outline:2px solid #f0b21f}
[data-cms].cms-draft{outline-color:#f0b21f}
a{cursor:default}
`

function PageEditor({ user, path, onBack, onOpen, onChange }: { user: User; path: string; onBack: () => void; onOpen: (p: string) => void; onChange: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [nonce, setNonce] = useState(() => Date.now())
  const [entries, setEntries] = useState<Entry[]>([])
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [changed, setChanged] = useState<Record<string, string | null>>({})
  const [active, setActive] = useState<string | null>(null)
  const [tab, setTab] = useState<'text' | 'seo' | 'history'>('text')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [fields, setFields] = useState<{ key: string; text: string }[]>([])
  const [loaded, setLoaded] = useState(false)
  const canEdit = user.role !== 'viewer'
  const changedRef = useRef(changed)
  changedRef.current = changed

  const load = useCallback(async () => {
    const d = await get<{ entries: Entry[]; revisions: Revision[] }>('cms_page', { path })
    setEntries(d.entries)
    setRevisions(d.revisions)
  }, [path])
  useEffect(() => {
    load()
  }, [load])

  const drafts = entries.filter((e) => e.draft !== null).length
  const unsaved = Object.keys(changed).length
  const entryFor = (k: string) => entries.find((e) => e.k === k)

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (Object.keys(changedRef.current).length) e.preventDefault()
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  function onFrameLoad() {
    const doc = frame.current?.contentDocument
    if (!doc) return
    setLoaded(true)
    const style = doc.createElement('style')
    style.textContent = EDITOR_CSS
    doc.head.appendChild(style)
    // Reveal elements that wait for scroll animations, so everything can be edited.
    const reveal = doc.createElement('style')
    reveal.textContent = '[style*="opacity: 0"],[style*="opacity:0"]{opacity:1 !important;transform:none !important}'
    doc.head.appendChild(reveal)

    const list: { key: string; text: string }[] = []
    const seen = new Set<string>()
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>('[data-cms]'))) {
      const key = el.dataset.cms ?? ''
      const e = entryFor(key)
      if (e?.draft !== null && e?.draft !== undefined) el.classList.add('cms-draft')
      if (!seen.has(key)) {
        seen.add(key)
        list.push({ key, text: (el.textContent ?? '').replace(/\s+/g, ' ').trim() })
      }
    }
    setFields(list)

    doc.addEventListener(
      'click',
      (ev) => {
        const t = ev.target as HTMLElement
        const el = t.closest<HTMLElement>('[data-cms]')
        // Links and buttons never navigate inside the editor.
        if (t.closest('a, button')) ev.preventDefault()
        if (!el) return
        ev.preventDefault()
        ev.stopPropagation()
        if (!canEdit) return setActive(el.dataset.cms ?? null)
        startEditing(el)
      },
      true,
    )
    doc.addEventListener(
      'input',
      (ev) => {
        const el = (ev.target as HTMLElement).closest<HTMLElement>('[data-cms]')
        if (!el) return
        const key = el.dataset.cms ?? ''
        el.classList.add('cms-changed')
        // Mirror the edit into other copies of the same text (e.g. repeated labels).
        for (const twin of Array.from(doc.querySelectorAll<HTMLElement>(`[data-cms="${CSS.escape(key)}"]`))) if (twin !== el) twin.innerHTML = el.innerHTML
        setChanged((c) => ({ ...c, [key]: el.innerHTML }))
      },
      true,
    )
    doc.addEventListener(
      'keydown',
      (ev) => {
        const el = (ev.target as HTMLElement).closest?.('[data-cms]')
        if (!el) return
        if (ev.key === 'Enter') {
          ev.preventDefault()
          doc.execCommand('insertLineBreak')
        }
        if (ev.key === 'Escape') (el as HTMLElement).blur()
        if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') {
          ev.preventDefault()
          void saveDraft()
        }
      },
      true,
    )
    doc.addEventListener(
      'paste',
      (ev) => {
        if (!(ev.target as HTMLElement).closest?.('[data-cms]')) return
        ev.preventDefault()
        doc.execCommand('insertText', false, ev.clipboardData?.getData('text/plain') ?? '')
      },
      true,
    )
  }

  function startEditing(el: HTMLElement) {
    const doc = frame.current?.contentDocument
    if (!doc) return
    for (const other of Array.from(doc.querySelectorAll<HTMLElement>('[data-cms][contenteditable="true"]'))) if (other !== el) other.removeAttribute('contenteditable')
    el.setAttribute('contenteditable', 'true')
    el.focus()
    setActive(el.dataset.cms ?? null)
    setTab('text')
  }

  function focusKey(key: string) {
    const doc = frame.current?.contentDocument
    const el = doc?.querySelector<HTMLElement>(`[data-cms="${CSS.escape(key)}"]`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (canEdit) startEditing(el)
    else setActive(key)
  }

  function format(cmd: 'bold' | 'italic' | 'link' | 'unlink' | 'removeFormat') {
    const doc = frame.current?.contentDocument
    if (!doc) return
    if (cmd === 'link') {
      const url = window.prompt('Link to (e.g. /contact or https://…)')
      if (!url) return
      doc.execCommand('createLink', false, url)
    } else doc.execCommand(cmd)
    const el = doc.activeElement?.closest?.('[data-cms]') as HTMLElement | null
    if (el) setChanged((c) => ({ ...c, [el.dataset.cms ?? '']: el.innerHTML }))
  }

  async function saveDraft(extra?: { seo?: Seo; texts?: Record<string, string | null> }) {
    const texts = { ...changedRef.current, ...(extra?.texts ?? {}) }
    if (!Object.keys(texts).length && !extra?.seo) return
    setBusy('save')
    setMsg('')
    try {
      await post('cms_save', { path, texts, ...(extra?.seo ? { seo: extra.seo } : {}) })
      setChanged({})
      await load()
      setMsg('Draft saved. Publish to make it live.')
      onChange()
    } catch {
      setMsg('Could not save. Check your connection and try again.')
    } finally {
      setBusy('')
    }
  }

  async function publish() {
    if (unsaved) await saveDraft()
    setBusy('publish')
    setMsg('')
    try {
      const r = await post<{ published: number }>('cms_publish', { path })
      await load()
      setNonce(Date.now())
      setMsg(r.published ? `Published ${r.published} change${r.published === 1 ? '' : 's'}. It's live now.` : 'Nothing to publish.')
      onChange()
    } catch {
      setMsg('Could not publish.')
    } finally {
      setBusy('')
    }
  }

  async function discard() {
    if (!window.confirm('Throw away all unpublished changes on this page?')) return
    await post('cms_discard', { path })
    setChanged({})
    await load()
    setNonce(Date.now())
    onChange()
  }

  async function reset(key: string) {
    await saveDraft({ texts: { [key]: null } })
    setNonce(Date.now())
  }

  const widths = { desktop: '100%', tablet: '820px', mobile: '390px' }
  const activeEntry = active ? entryFor(active) : undefined
  const seoEntry = entryFor(`seo:${path}`)

  return (
    <div className="grid gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white px-3 py-2" style={{ border: `1px solid ${C.line}` }}>
        <Button variant="ghost" onClick={() => (unsaved && !window.confirm('You have unsaved edits. Leave anyway?') ? null : onBack())}>
          ← Pages
        </Button>
        <span className="min-w-0 truncate px-1 text-[0.9rem] font-semibold" style={{ color: C.ink }}>
          {path}
        </span>
        <a href={path} target="_blank" rel="noopener" className="text-[0.8rem] underline" style={{ color: C.series }}>
          View live ↗
        </a>
        <span className="flex-1" />
        <Segmented
          label="Preview size"
          value={device}
          onChange={setDevice}
          options={[
            { value: 'desktop', label: 'Desktop' },
            { value: 'tablet', label: 'Tablet' },
            { value: 'mobile', label: 'Phone' },
          ]}
        />
        {canEdit && (
          <>
            <span className="mx-1 hidden h-6 w-px md:block" style={{ background: C.line }} />
            <button type="button" title="Bold" onClick={() => format('bold')} className="rounded-lg px-2.5 py-1 font-bold" style={{ background: 'rgba(4,47,52,0.06)', color: C.ink }}>
              B
            </button>
            <button type="button" title="Italic (the site's serif accent)" onClick={() => format('italic')} className="rounded-lg px-2.5 py-1 italic" style={{ background: 'rgba(4,47,52,0.06)', color: C.ink }}>
              I
            </button>
            <button type="button" title="Add link" onClick={() => format('link')} className="rounded-lg px-2.5 py-1" style={{ background: 'rgba(4,47,52,0.06)', color: C.ink }}>
              🔗
            </button>
            <button type="button" title="Remove formatting" onClick={() => format('removeFormat')} className="rounded-lg px-2.5 py-1 text-[0.8rem]" style={{ background: 'rgba(4,47,52,0.06)', color: C.ink }}>
              Clear
            </button>
            <span className="mx-1 hidden h-6 w-px md:block" style={{ background: C.line }} />
            <Button variant="ghost" onClick={() => saveDraft()} disabled={!unsaved || !!busy}>
              {busy === 'save' ? 'Saving…' : `Save draft${unsaved ? ` (${unsaved})` : ''}`}
            </Button>
            <Button onClick={publish} disabled={(!drafts && !unsaved) || !!busy}>
              {busy === 'publish' ? 'Publishing…' : `Publish${drafts + unsaved ? ` (${drafts + unsaved})` : ''}`}
            </Button>
          </>
        )}
      </div>
      {msg && (
        <p role="status" className="m-0 px-1 text-[0.85rem]" style={{ color: msg.startsWith('Could') ? C.down : C.up }}>
          {msg}
        </p>
      )}

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="relative overflow-hidden rounded-2xl" style={{ border: `1px solid ${C.line}`, background: '#e9e4d6' }}>
          {!loaded && (
            <div className="absolute inset-0 grid place-items-center">
              <Spinner />
            </div>
          )}
          <div className="mx-auto transition-[width]" style={{ width: widths[device], maxWidth: '100%' }}>
            <iframe
              ref={frame}
              key={nonce}
              title={`Editing ${path}`}
              src={`${path}?cms=draft&t=${nonce}`}
              onLoad={onFrameLoad}
              className="block w-full bg-white"
              style={{ height: 'calc(100vh - 210px)', minHeight: 520, border: 0 }}
            />
          </div>
        </div>

        <Card pad={false} className="self-start">
          <div className="flex gap-1 border-b px-3 pt-2" style={{ borderColor: C.line }}>
            {(['text', 'seo', 'history'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="-mb-px border-b-2 px-3 py-2 text-[0.85rem] font-semibold"
                style={{ borderColor: tab === t ? C.series : 'transparent', color: tab === t ? C.ink : C.muted }}
              >
                {t === 'text' ? 'Text' : t === 'seo' ? 'SEO & sharing' : `History (${revisions.length})`}
              </button>
            ))}
          </div>
          <div className="max-h-[calc(100vh-230px)] overflow-y-auto p-4">
            {tab === 'text' && (
              <div className="grid gap-3">
                {active && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(184,232,154,0.3)' }}>
                    <div className="text-[0.75rem] font-semibold tracking-wide uppercase" style={{ color: C.muted }}>
                      Selected {active.startsWith('global#') && '· on every page'}
                    </div>
                    <div className="mt-1 text-[0.85rem]" style={{ color: C.ink }}>
                      {changed[active] !== undefined ? 'Edited (not saved yet)' : activeEntry?.draft ? 'Draft waiting to be published' : activeEntry?.published ? 'Edited and live' : 'Original text'}
                    </div>
                    {canEdit && (activeEntry?.published || activeEntry?.draft) && (
                      <button type="button" onClick={() => reset(active)} className="mt-2 text-[0.8rem] underline" style={{ color: C.down }}>
                        Go back to the original text
                      </button>
                    )}
                  </div>
                )}
                <p className="m-0 text-[0.8rem]" style={{ color: C.muted }}>
                  {fields.length} editable texts on this page. Click one here or on the page. <b>Enter</b> adds a line break, <b>⌘S</b> saves.
                </p>
                <ul className="m-0 grid list-none gap-1 p-0">
                  {fields.map((f) => {
                    const e = entryFor(f.key)
                    const state = changed[f.key] !== undefined ? 'unsaved' : e?.draft ? 'draft' : e?.published ? 'live' : ''
                    return (
                      <li key={f.key}>
                        <button
                          type="button"
                          onClick={() => focusKey(f.key)}
                          className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[0.8rem] hover:bg-[rgba(4,47,52,0.04)]"
                          style={{ background: active === f.key ? 'rgba(184,232,154,0.3)' : undefined, color: C.ink }}
                        >
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: state === 'unsaved' ? '#f0b21f' : state === 'draft' ? '#fdeec4' : state === 'live' ? C.series : 'rgba(4,47,52,0.15)' }} title={state || 'original'} />
                          <span className="line-clamp-2">{f.text || '(empty)'}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                {canEdit && drafts > 0 && (
                  <button type="button" onClick={discard} className="justify-self-start text-[0.8rem] underline" style={{ color: C.down }}>
                    Discard all unpublished changes
                  </button>
                )}
              </div>
            )}
            {tab === 'seo' && <SeoPanel frame={frame} loaded={loaded} entry={seoEntry} canEdit={canEdit} onSave={(seo) => saveDraft({ seo })} path={path} />}
            {tab === 'history' && (
              <div className="grid gap-2">
                {revisions.length === 0 && <Empty>No published versions yet. Each time you publish, a version is saved here.</Empty>}
                {revisions.map((r, i) => (
                  <div key={r.id} className="rounded-xl p-3" style={{ background: 'rgba(4,47,52,0.04)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-[0.85rem]" style={{ color: C.ink }}>
                        {i === 0 ? 'Live now' : fmtAgo(r.ts)}
                      </b>
                      {canEdit && i > 0 && (
                        <button
                          type="button"
                          className="text-[0.8rem] font-semibold underline"
                          style={{ color: C.series }}
                          onClick={async () => {
                            await post('cms_restore', {}, { id: r.id })
                            await load()
                            setNonce(Date.now())
                            setMsg('That version is loaded as a draft. Check the page, then Publish.')
                          }}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                    <div className="mt-0.5 text-[0.75rem]" style={{ color: C.muted }}>
                      {fmtWhen(r.ts)} · {r.user_email} · {r.note}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
      <PageJump current={path} onOpen={(p) => (unsaved && !window.confirm('You have unsaved edits. Leave anyway?') ? null : onOpen(p))} />
    </div>
  )
}

function PageJump({ current, onOpen }: { current: string; onOpen: (p: string) => void }) {
  const [pages, setPages] = useState<PageRow[]>([])
  useEffect(() => {
    get<{ pages: PageRow[] }>('cms_pages').then((d) => setPages(d.pages))
  }, [])
  if (!pages.length) return null
  return (
    <label className="flex items-center gap-2 text-[0.85rem]" style={{ color: C.muted }}>
      Edit another page:
      <select value={current} onChange={(e) => onOpen(e.target.value)} className={`${field} !w-auto !py-1.5`} style={fieldStyle}>
        {pages.map((p) => (
          <option key={p.path} value={p.path}>
            {p.path}
          </option>
        ))}
      </select>
    </label>
  )
}

function SeoPanel({ frame, loaded, entry, canEdit, onSave, path }: { frame: React.RefObject<HTMLIFrameElement | null>; loaded: boolean; entry: Entry | undefined; canEdit: boolean; onSave: (s: Seo) => void; path: string }) {
  const current: Seo = useMemo(() => {
    const raw = entry?.draft && entry.draft !== '__reset__' ? entry.draft : entry?.published
    try {
      return raw ? (JSON.parse(raw) as Seo) : {}
    } catch {
      return {}
    }
  }, [entry])
  const [s, setS] = useState<Seo>(current)
  const [defaults, setDefaults] = useState({ title: '', description: '', image: '' })
  const [picking, setPicking] = useState(false)
  useEffect(() => setS(current), [current])
  useEffect(() => {
    if (!loaded) return
    const doc = frame.current?.contentDocument
    if (!doc) return
    setDefaults({
      title: doc.title,
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
      image: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '',
    })
  }, [loaded, frame])

  const title = s.title || defaults.title
  const desc = s.description || defaults.description
  const img = s.image || defaults.image
  return (
    <div className="grid gap-3">
      <p className="m-0 text-[0.8rem]" style={{ color: C.muted }}>
        How this page appears on Google and when the link is shared. Empty fields keep the original.
      </p>
      <div className="rounded-xl p-3" style={{ border: `1px solid ${C.line}` }}>
        <div className="text-[0.75rem]" style={{ color: '#4d5156' }}>
          www.atriumad.com{path === '/' ? '' : path.replace(/\//g, ' › ')}
        </div>
        <div className="mt-0.5 line-clamp-1 text-[1rem]" style={{ color: '#1a0dab' }}>
          {title}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[0.8rem]" style={{ color: '#4d5156' }}>
          {desc}
        </div>
      </div>
      <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
        <span className="flex justify-between">
          Title <span className="font-normal" style={{ color: (s.title ?? '').length > 60 ? C.down : C.faint }}>{(s.title ?? '').length}/60</span>
        </span>
        <input value={s.title ?? ''} onChange={(e) => setS({ ...s, title: e.target.value })} placeholder={defaults.title} className={field} style={fieldStyle} disabled={!canEdit} />
      </label>
      <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
        <span className="flex justify-between">
          Description <span className="font-normal" style={{ color: (s.description ?? '').length > 160 ? C.down : C.faint }}>{(s.description ?? '').length}/160</span>
        </span>
        <textarea rows={4} value={s.description ?? ''} onChange={(e) => setS({ ...s, description: e.target.value })} placeholder={defaults.description} className={field} style={fieldStyle} disabled={!canEdit} />
      </label>
      <div className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
        Share image
        {img && <img src={img} alt="" className="aspect-[1.91/1] w-full rounded-lg object-cover" style={{ border: `1px solid ${C.line}` }} />}
        <div className="flex gap-2">
          <input value={s.image ?? ''} onChange={(e) => setS({ ...s, image: e.target.value })} placeholder="Original image" className={field} style={fieldStyle} disabled={!canEdit} />
          {canEdit && (
            <Button variant="ghost" onClick={() => setPicking(true)}>
              Pick
            </Button>
          )}
        </div>
        <span className="font-normal" style={{ color: C.faint }}>
          Best size: 1200 × 630.
        </span>
      </div>
      <label className="flex items-start gap-2 text-[0.85rem]" style={{ color: C.ink }}>
        <input type="checkbox" checked={!!s.noindex} onChange={(e) => setS({ ...s, noindex: e.target.checked })} disabled={!canEdit} className="mt-1" />
        <span>
          Hide this page from Google <span style={{ color: C.muted }}>(noindex)</span>
        </span>
      </label>
      {canEdit && (
        <div className="flex gap-2">
          <Button onClick={() => onSave(s)}>Save SEO draft</Button>
          {entry && (
            <Button variant="ghost" onClick={() => onSave({})}>
              Use original
            </Button>
          )}
        </div>
      )}
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(url) => {
            setS({ ...s, image: url })
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}
