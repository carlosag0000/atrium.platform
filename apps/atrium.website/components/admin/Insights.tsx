'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fmtAgo, fmtNum, fmtWhen, get, post, type User } from './api'
import { MediaPicker } from './Website'
import { Button, C, Card, Empty, Pill, Spinner, field, fieldStyle } from './ui'

// Website → Insights: the blog. A list of articles and an editor that looks like the live page,
// with publishing/scheduling and an SEO checklist.

type Row = { id: number; slug: string; title: string; category: string; cover: string; status: 'draft' | 'published' | 'scheduled'; published_at: string; updated_at: string; updated_by: string; views: number; keyword: string }
type Post = {
  id: number
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover: string
  cover_alt: string
  category: string
  tags: string
  author: string
  seo_title: string
  seo_description: string
  focus_keyword: string
  status: 'draft' | 'published'
  published_at: string
}

const STATUS_BG: Record<string, string> = { draft: '#ececec', published: '#b8e89a', scheduled: '#fdeec4' }
const EMPTY: Post = { id: 0, slug: '', title: '', excerpt: '', content: '<p></p>', cover: '', cover_alt: '', category: '', tags: '', author: '', seo_title: '', seo_description: '', focus_keyword: '', status: 'draft', published_at: '' }

export default function Insights({ user, rest, tz }: { user: User; rest: string; tz?: string | undefined }) {
  const go = (h: string) => {
    window.location.hash = h ? `insights/${h}` : 'insights'
  }
  if (rest === 'new') return <Editor key="new" user={user} id={0} go={go} tz={tz} />
  if (/^\d+$/.test(rest)) return <Editor key={rest} user={user} id={Number(rest)} go={go} tz={tz} />
  return <List user={user} go={go} tz={tz} />
}

function List({ user, go, tz }: { user: User; go: (h: string) => void; tz?: string | undefined }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  useEffect(() => {
    get<{ items: Row[] }>('posts').then((d) => setRows(d.items))
  }, [])
  const shown = useMemo(() => (rows ?? []).filter((r) => (filter === 'all' || r.status === filter) && (!q || `${r.title} ${r.category}`.toLowerCase().includes(q.toLowerCase()))), [rows, filter, q])
  if (!rows) return <Spinner />
  const count = (s: string) => rows.filter((r) => r.status === s).length
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'published', 'scheduled', 'draft'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className="rounded-full px-3 py-1.5 text-[0.8rem] font-medium capitalize"
            style={{ background: filter === s ? C.ink : '#fff', color: filter === s ? C.mint : C.ink, border: `1px solid ${C.line}` }}
          >
            {s} <span className="opacity-60">{s === 'all' ? rows.length : count(s)}</span>
          </button>
        ))}
        <span className="flex-1" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" aria-label="Search articles" className={`${field} !w-52 !py-1.5`} style={fieldStyle} />
        <Button variant="ghost" href="/insights" target="_blank">
          View blog ↗
        </Button>
        {user.role !== 'viewer' && <Button onClick={() => go('new')}>+ New article</Button>}
      </div>
      <Card pad={false}>
        {shown.length === 0 ? (
          <div className="p-5">
            <Empty>{rows.length ? 'Nothing matches.' : 'No articles yet. Write your first one: each article is its own page on Google.'}</Empty>
          </div>
        ) : (
          <ul className="m-0 list-none p-0">
            {shown.map((r) => (
              <li key={r.id} className="border-t first:border-t-0" style={{ borderColor: C.line }}>
                <button type="button" onClick={() => go(String(r.id))} className="grid w-full grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-left hover:bg-[rgba(4,47,52,0.03)] md:grid-cols-[64px_minmax(0,1fr)_auto_auto_auto]">
                  <span className="block h-11 w-16 overflow-hidden rounded-lg" style={{ background: 'rgba(4,47,52,0.08)' }}>
                    {r.cover && <img src={r.cover} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold" style={{ color: C.ink }}>
                      {r.title}
                    </span>
                    <span className="block truncate text-[0.8rem]" style={{ color: C.muted }}>
                      {[r.category, r.status === 'draft' ? `edited ${fmtAgo(r.updated_at)}` : fmtWhen(r.published_at, tz)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="hidden text-[0.8rem] tabular-nums md:block" style={{ color: C.muted }}>
                    {fmtNum(r.views)} views
                  </span>
                  <span className="hidden md:block">{!r.keyword && r.status !== 'published' ? <Pill bg="#f3d0c8">no keyword</Pill> : null}</span>
                  <Pill bg={STATUS_BG[r.status]}>{r.status}</Pill>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

// ── SEO checks ───────────────────────────────────────────────────────────────

type Check = { ok: boolean | 'warn'; label: string }

function analyse(p: Post, html: string) {
  const doc = typeof window !== 'undefined' ? new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html') : null
  const text = (doc?.body.textContent ?? '').replace(/\s+/g, ' ').trim()
  const words = text ? text.split(' ').length : 0
  const kw = p.focus_keyword.trim().toLowerCase()
  const has = (s: string) => !!kw && s.toLowerCase().includes(kw)
  const firstP = doc?.querySelector('p')?.textContent ?? ''
  const heads = Array.from(doc?.querySelectorAll('h2,h3') ?? [])
  const links = Array.from(doc?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href') ?? '')
  const imgs = Array.from(doc?.querySelectorAll('img') ?? [])
  const title = p.seo_title || p.title
  const desc = p.seo_description || p.excerpt || ''
  const slug = p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const checks: Check[] = [
    { ok: !!kw, label: 'Focus keyword chosen' },
    { ok: has(title), label: 'Keyword in the title' },
    { ok: has(desc), label: 'Keyword in the description' },
    { ok: !!kw && slug.includes(kw.replace(/[^a-z0-9]+/g, '-')), label: 'Keyword in the web address' },
    { ok: has(firstP), label: 'Keyword in the first paragraph' },
    { ok: heads.some((h) => has(h.textContent ?? '')), label: 'Keyword in a subheading' },
    { ok: words >= 800 ? true : words >= 400 ? 'warn' : false, label: `Length: ${fmtNum(words)} words (aim for 800+)` },
    { ok: heads.length >= 3 ? true : heads.length >= 1 ? 'warn' : false, label: `${heads.length} subheading${heads.length === 1 ? '' : 's'} (aim for 3+)` },
    { ok: links.some((h) => h.startsWith('/') || /atriumad\.com/.test(h)), label: 'Links to another Atrium page' },
    { ok: links.some((h) => /^https?:\/\//.test(h) && !/atriumad\.com/.test(h)) ? true : 'warn', label: 'Links to a trusted outside source' },
    { ok: !!p.cover && !!p.cover_alt, label: 'Cover image with a description' },
    { ok: imgs.every((i) => (i.getAttribute('alt') ?? '').trim()), label: 'Every image has a description (alt)' },
    { ok: title.length >= 30 && title.length <= 60 ? true : title.length > 0 ? 'warn' : false, label: `Google title: ${title.length} characters (30–60)` },
    { ok: desc.length >= 120 && desc.length <= 160 ? true : desc.length > 0 ? 'warn' : false, label: `Google description: ${desc.length} characters (120–160)` },
    { ok: !!p.category, label: 'Topic (category) chosen' },
  ]
  const score = Math.round((checks.reduce((s, c) => s + (c.ok === true ? 1 : c.ok === 'warn' ? 0.5 : 0), 0) / checks.length) * 100)
  return { checks, score, words, minutes: Math.max(1, Math.round(words / 220)) }
}

// ── Editor ───────────────────────────────────────────────────────────────────

function toLocalInput(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function Editor({ user, id, go, tz }: { user: User; id: number; go: (h: string) => void; tz?: string | undefined }) {
  const [p, setP] = useState<Post | null>(id ? null : EMPTY)
  const [html, setHtml] = useState(EMPTY.content)
  const [categories, setCategories] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [picker, setPicker] = useState<null | 'cover' | 'inline'>(null)
  const [schedule, setSchedule] = useState(false)
  const body = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const canEdit = user.role !== 'viewer'
  const dirtyRef = useRef(dirty)
  dirtyRef.current = dirty

  useEffect(() => {
    get<{ categories: string[] }>('posts').then((d) => setCategories(d.categories))
    if (!id) return
    get<{ post: Post }>('post_get', { id }).then((d) => {
      setP(d.post)
      setHtml(d.post.content || '<p></p>')
      setSchedule(d.post.status === 'published' && !!d.post.published_at && new Date(d.post.published_at).getTime() > Date.now())
    })
  }, [id])

  // Load the article into the editable area once (React must not re-render it while typing).
  useEffect(() => {
    if (body.current && p && body.current.dataset.loaded !== String(p.id)) {
      body.current.innerHTML = html
      body.current.dataset.loaded = String(p.id)
    }
  }, [p, html])

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault()
    }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  const set = <K extends keyof Post>(k: K, v: Post[K]) => {
    setP((x) => (x ? { ...x, [k]: v } : x))
    setDirty(true)
  }
  const syncBody = useCallback(() => {
    if (body.current) setHtml(body.current.innerHTML)
    setDirty(true)
  }, [])

  const seo = useMemo(() => (p ? analyse(p, html) : null), [p, html])

  function cmd(c: string, v?: string) {
    body.current?.focus()
    if (savedRange.current && (c === 'insertHTML' || c === 'createLink')) {
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(savedRange.current)
    }
    document.execCommand(c, false, v)
    syncBody()
  }
  function rememberSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount && body.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange()
  }

  async function save(publish?: 'publish' | 'draft') {
    if (!p) return
    const content = body.current?.innerHTML ?? html
    const status = publish === 'publish' ? 'published' : publish === 'draft' ? 'draft' : p.status
    let when = p.published_at
    if (status === 'published' && !schedule && (!when || new Date(when).getTime() > Date.now())) when = new Date().toISOString()
    if (!p.title.trim()) return setMsg('Give the article a title first.')
    setBusy(true)
    setMsg('')
    try {
      const r = await post<{ id: number; slug: string }>('post_save', { ...p, content, status, published_at: when }, { id: p.id || undefined })
      setP({ ...p, id: r.id, slug: r.slug, status, published_at: when })
      setDirty(false)
      setMsg(status === 'published' ? (schedule && new Date(when).getTime() > Date.now() ? `Scheduled for ${fmtWhen(when, tz)}.` : 'Published. It’s live on the site now.') : 'Draft saved.')
      if (!p.id) window.history.replaceState(null, '', `#insights/${r.id}`)
    } catch (err) {
      const code = (err as { code?: string }).code
      setMsg(code === 'slug' ? 'Another article already uses that web address. Change it under Settings.' : code === 'cover' ? 'The cover image link must start with / or https://' : 'Could not save. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!p || !seo) return <Spinner />
  const isLive = p.status === 'published' && !!p.published_at && new Date(p.published_at).getTime() <= Date.now()
  const url = `/insights/${p.slug || '…'}`
  const scoreColor = seo.score >= 80 ? C.series : seo.score >= 50 ? '#c08a12' : C.down
  const tool = (label: string, title: string, onClick: () => void, extra = '') => (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={`rounded-lg px-2.5 py-1 text-[0.85rem] hover:bg-[rgba(4,47,52,0.08)] ${extra}`} style={{ color: C.ink }}>
      {label}
    </button>
  )

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={() => (dirty && !window.confirm('You have unsaved changes. Leave anyway?') ? null : go(''))}>
          ← Articles
        </Button>
        <Pill bg={STATUS_BG[p.status === 'published' && !isLive ? 'scheduled' : p.status]}>{p.status === 'published' && !isLive ? 'scheduled' : p.status}</Pill>
        {dirty && (
          <span className="text-[0.8rem]" style={{ color: '#c08a12' }}>
            Unsaved changes
          </span>
        )}
        <span className="text-[0.8rem]" style={{ color: msg.startsWith('Could') || msg.startsWith('Give') || msg.startsWith('Another') || msg.startsWith('The cover') ? C.down : C.up }}>
          {msg}
        </span>
        <span className="flex-1" />
        <span className="text-[0.8rem]" style={{ color: C.muted }}>
          {fmtNum(seo.words)} words · {seo.minutes} min read
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Writing area */}
        <div className="min-w-0 rounded-2xl bg-white" style={{ border: `1px solid ${C.line}` }}>
          {canEdit && (
            <div className="sticky top-[57px] z-10 flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b bg-white/95 px-3 py-2 backdrop-blur" style={{ borderColor: C.line }}>
              {tool('Heading', 'Section heading (H2)', () => cmd('formatBlock', 'H2'), 'font-semibold')}
              {tool('Subheading', 'Subheading (H3)', () => cmd('formatBlock', 'H3'))}
              {tool('Text', 'Normal paragraph', () => cmd('formatBlock', 'P'))}
              <span className="mx-1 h-5 w-px" style={{ background: C.line }} />
              {tool('B', 'Bold', () => cmd('bold'), 'font-bold')}
              {tool('I', 'Italic', () => cmd('italic'), 'italic')}
              {tool('🔗', 'Link (select text first)', () => {
                rememberSelection()
                const u = window.prompt('Link to (e.g. /services/google-seo or https://…)')
                if (u) cmd('createLink', u)
              })}
              <span className="mx-1 h-5 w-px" style={{ background: C.line }} />
              {tool('• List', 'Bulleted list', () => cmd('insertUnorderedList'))}
              {tool('1. List', 'Numbered list', () => cmd('insertOrderedList'))}
              {tool('❝ Quote', 'Quote', () => cmd('formatBlock', 'BLOCKQUOTE'))}
              {tool('🖼 Image', 'Insert an image', () => {
                rememberSelection()
                setPicker('inline')
              })}
              {tool('— Line', 'Divider', () => cmd('insertHorizontalRule'))}
              {tool('Clear', 'Remove formatting', () => cmd('removeFormat'), 'text-[0.75rem]')}
            </div>
          )}
          <div className="px-6 py-8 md:px-12 md:py-10">
            <textarea
              value={p.title}
              onChange={(e) => set('title', e.target.value.replace(/\n/g, ' '))}
              placeholder="Article title"
              rows={2}
              readOnly={!canEdit}
              className="ins-title w-full resize-none border-0 bg-transparent outline-none"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <textarea
              value={p.excerpt ?? ''}
              onChange={(e) => set('excerpt', e.target.value)}
              placeholder="Short summary shown under the title and on the list (1–2 sentences)"
              rows={2}
              readOnly={!canEdit}
              className="ins-lede mt-4 w-full resize-none border-0 bg-transparent outline-none"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <div className="mt-6 border-t pt-6" style={{ borderColor: C.line }}>
              {/* biome-ignore lint/a11y/useSemanticElements: rich-text editing surface */}
              <div
                ref={body}
                role="textbox"
                aria-multiline="true"
                aria-label="Article text"
                tabIndex={0}
                contentEditable={canEdit}
                suppressContentEditableWarning
                onInput={syncBody}
                onBlur={rememberSelection}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                    e.preventDefault()
                    void save()
                  }
                }}
                className="ins-body min-h-[50vh] outline-none [&:empty]:before:text-[#8b9092] [&:empty]:before:content-['Start_writing…']"
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="grid content-start gap-4">
          <Card title="Publish">
            <div className="grid gap-3">
              {canEdit && (
                <label className="flex items-center gap-2 text-[0.85rem]" style={{ color: C.ink }}>
                  <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} /> Schedule for later
                </label>
              )}
              {schedule && (
                <input
                  type="datetime-local"
                  value={toLocalInput(p.published_at)}
                  onChange={(e) => set('published_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className={field}
                  style={fieldStyle}
                />
              )}
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => save('publish')} disabled={busy}>
                    {schedule ? 'Schedule' : isLive ? 'Update' : 'Publish'}
                  </Button>
                  <Button variant="ghost" onClick={() => save(isLive ? undefined : 'draft')} disabled={busy}>
                    {isLive ? 'Save' : 'Save draft'}
                  </Button>
                  {isLive && (
                    <Button variant="ghost" onClick={() => save('draft')} disabled={busy}>
                      Unpublish
                    </Button>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-3 text-[0.8rem]">
                {p.id > 0 && (
                  <a href={`${url}?cms=draft`} target="_blank" rel="noopener" style={{ color: C.series }} className="font-semibold underline">
                    Preview ↗
                  </a>
                )}
                {isLive && (
                  <a href={url} target="_blank" rel="noopener" style={{ color: C.series }} className="underline">
                    View live ↗
                  </a>
                )}
              </div>
              <p className="m-0 text-[0.75rem]" style={{ color: C.faint }}>
                Preview shows unsaved changes only after you save. ⌘S saves.
              </p>
            </div>
          </Card>

          <Card title={<span className="flex items-center gap-2">SEO score <b style={{ color: scoreColor }}>{seo.score}</b><span className="text-[0.75rem] font-normal" style={{ color: C.faint }}>/100</span></span>}>
            <div className="grid gap-3">
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(4,47,52,0.08)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${seo.score}%`, background: scoreColor }} />
              </div>
              <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
                Focus keyword
                <input value={p.focus_keyword} onChange={(e) => set('focus_keyword', e.target.value)} placeholder="e.g. restaurant google business profile" className={field} style={fieldStyle} readOnly={!canEdit} />
                <span className="font-normal" style={{ color: C.faint }}>
                  The search a restaurant owner would type to find this article.
                </span>
              </label>
              <ul className="m-0 grid list-none gap-1.5 p-0 text-[0.8rem]">
                {seo.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2" style={{ color: C.ink }}>
                    <span aria-hidden="true" className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold" style={{ background: c.ok === true ? C.series : c.ok === 'warn' ? '#f0b21f' : '#e3b6ad', color: '#fff' }}>
                      {c.ok === true ? '✓' : c.ok === 'warn' ? '!' : '×'}
                    </span>
                    <span>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Google & sharing">
            <div className="grid gap-3">
              <div className="rounded-xl p-3" style={{ border: `1px solid ${C.line}` }}>
                <div className="text-[0.75rem]" style={{ color: '#4d5156' }}>
                  www.atriumad.com › insights › {p.slug || '…'}
                </div>
                <div className="mt-0.5 line-clamp-1 text-[1rem]" style={{ color: '#1a0dab' }}>
                  {p.seo_title || p.title || 'Article title'}
                </div>
                <div className="mt-0.5 line-clamp-2 text-[0.8rem]" style={{ color: '#4d5156' }}>
                  {p.seo_description || p.excerpt || 'Add a description so Google shows your summary instead of guessing.'}
                </div>
              </div>
              <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
                <span className="flex justify-between">
                  Google title <span className="font-normal" style={{ color: C.faint }}>{(p.seo_title || p.title).length}/60</span>
                </span>
                <input value={p.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder={p.title || 'Uses the article title'} className={field} style={fieldStyle} readOnly={!canEdit} />
              </label>
              <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
                <span className="flex justify-between">
                  Google description <span className="font-normal" style={{ color: C.faint }}>{(p.seo_description || p.excerpt || '').length}/160</span>
                </span>
                <textarea rows={3} value={p.seo_description} onChange={(e) => set('seo_description', e.target.value)} placeholder={p.excerpt || 'Uses the summary'} className={field} style={fieldStyle} readOnly={!canEdit} />
              </label>
            </div>
          </Card>

          <Card title="Cover image">
            <div className="grid gap-2">
              {p.cover ? (
                <img src={p.cover} alt={p.cover_alt} className="aspect-[2/1] w-full rounded-lg object-cover" />
              ) : (
                <div className="grid aspect-[2/1] place-items-center rounded-lg text-[0.8rem]" style={{ background: 'rgba(4,47,52,0.05)', color: C.muted }}>
                  No cover yet
                </div>
              )}
              {canEdit && (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setPicker('cover')}>
                    {p.cover ? 'Change' : 'Choose image'}
                  </Button>
                  {p.cover && (
                    <Button variant="ghost" onClick={() => set('cover', '')}>
                      Remove
                    </Button>
                  )}
                </div>
              )}
              <input value={p.cover_alt} onChange={(e) => set('cover_alt', e.target.value)} placeholder="Describe the image (for Google and screen readers)" className={field} style={fieldStyle} readOnly={!canEdit} />
            </div>
          </Card>

          <Card title="Settings">
            <div className="grid gap-3">
              <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
                Topic
                <input list="ins-cats" value={p.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Local SEO" className={field} style={fieldStyle} readOnly={!canEdit} />
                <datalist id="ins-cats">
                  {['Local SEO', 'Reviews & Reputation', 'Social Content', 'Paid Ads', 'Email & SMS', 'Loyalty & CRM', 'Branding', 'Analytics', ...categories]
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((c) => (
                      <option key={c} value={c} />
                    ))}
                </datalist>
              </label>
              <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
                Tags <span className="font-normal" style={{ color: C.faint }}>(commas between)</span>
                <input value={p.tags} onChange={(e) => set('tags', e.target.value)} placeholder="restaurants, houston, google maps" className={field} style={fieldStyle} readOnly={!canEdit} />
              </label>
              <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
                Author
                <input value={p.author} onChange={(e) => set('author', e.target.value)} placeholder="The Atrium team" className={field} style={fieldStyle} readOnly={!canEdit} />
              </label>
              <label className="grid gap-1 text-[0.8rem] font-semibold" style={{ color: C.ink }}>
                Web address
                <span className="flex items-center gap-1 font-normal" style={{ color: C.muted }}>
                  /insights/
                  <input value={p.slug} onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} placeholder="made from the title" className={field} style={fieldStyle} readOnly={!canEdit} />
                </span>
                {isLive && (
                  <span className="font-normal" style={{ color: C.faint }}>
                    Changing it keeps the old link working (automatic redirect).
                  </span>
                )}
              </label>
              {canEdit && p.id > 0 && (
                <button
                  type="button"
                  className="justify-self-start text-[0.8rem] underline"
                  style={{ color: C.down }}
                  onClick={async () => {
                    if (!window.confirm(`Delete "${p.title}"? This can't be undone.`)) return
                    await post('post_delete', {}, { id: p.id })
                    setDirty(false)
                    go('')
                  }}
                >
                  Delete article
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {picker && (
        <MediaPicker
          onClose={() => setPicker(null)}
          onPick={(u) => {
            if (picker === 'cover') set('cover', u)
            else {
              const alt = window.prompt('Describe this image (for Google and screen readers)') ?? ''
              cmd('insertHTML', `<figure><img src="${u}" alt="${alt.replace(/"/g, '&quot;')}"></figure><p></p>`)
            }
            setPicker(null)
          }}
        />
      )}
    </div>
  )
}
