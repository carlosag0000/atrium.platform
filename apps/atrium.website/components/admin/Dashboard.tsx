'use client'

import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { setIgnored } from '@/lib/analytics'
import { AuthError, get, post, type Range, type User } from './api'
import Content from './Content'
import Forms from './Forms'
import { VisitorDrawer } from './Journey'
import Overview from './Overview'
import Realtime from './Realtime'
import { EventsReport, PagesReport } from './Reports'
import SettingsView from './SettingsView'
import { ActivityView, AnnouncementView, MediaView, RedirectsView } from './Website'
import { C, field, fieldStyle } from './ui'

// The website dashboard at /admin: traffic, live visitors, pages, conversions, contact messages,
// job applications, team and settings. Data comes from /api/admin.php (PHP + MySQL on Hostinger).

type Section = 'overview' | 'realtime' | 'pages' | 'events' | 'content' | 'announcement' | 'redirects' | 'media' | 'forms' | 'activity' | 'settings'
type Me = { user: User; badges: { inbox: number; careers: number; forms: number; drafts: number; broken: number }; timezone: string }

const NAV: { id: Section; label: string; icon: string; group: 'Analytics' | 'Website' | 'Admin' }[] = [
  { id: 'overview', label: 'Overview', icon: 'M3 13h4v8H3zM10 8h4v13h-4zM17 3h4v18h-4z', group: 'Analytics' },
  { id: 'realtime', label: 'Live', icon: 'M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8', group: 'Analytics' },
  { id: 'pages', label: 'Pages', icon: 'M6 3h9l4 4v14H6zM14 3v5h5', group: 'Analytics' },
  { id: 'events', label: 'Clicks & goals', icon: 'M12 3l2.7 5.6 6.3.9-4.5 4.4 1 6.1-5.5-2.9L6.5 20l1-6.1L3 9.5l6.3-.9z', group: 'Analytics' },
  { id: 'content', label: 'Content', icon: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4', group: 'Website' },
  { id: 'forms', label: 'Forms', icon: 'M5 3h14v18H5zM9 8h6M9 12h6M9 16h4', group: 'Website' },
  { id: 'announcement', label: 'Announcement', icon: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8', group: 'Website' },
  { id: 'redirects', label: 'Redirects & 404s', icon: 'M4 7h11l-3-3M20 17H9l3 3', group: 'Website' },
  { id: 'media', label: 'Media', icon: 'M4 5h16v14H4zM4 15l4-4 5 5 3-3 4 4M15 9.5a1.5 1.5 0 1 0 0-.01', group: 'Website' },
  { id: 'activity', label: 'Activity log', icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', group: 'Admin' },
  { id: 'settings', label: 'Settings & team', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z', group: 'Admin' },
]

const TITLES: Record<Section, string> = {
  overview: 'Overview',
  realtime: 'Live visitors',
  pages: 'Pages',
  events: 'Clicks & goals',
  content: 'Content',
  announcement: 'Announcement',
  redirects: 'Redirects & broken links',
  media: 'Media library',
  forms: 'Forms',
  activity: 'Activity log',
  settings: 'Settings & team',
}

const PRESETS = [
  { id: 'today', label: 'Today', days: 1 },
  { id: '7d', label: '7 days', days: 7 },
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: '12m', label: '12 months', days: 365 },
] as const

function isoDay(d: Date, tz: string) {
  return d.toLocaleDateString('en-CA', { timeZone: tz })
}

function presetRange(days: number, tz: string): Range {
  const to = isoDay(new Date(), tz)
  const [y = 1970, m = 1, d = 1] = to.split('-').map(Number)
  const from = new Date(Date.UTC(y, m - 1, d - (days - 1))).toISOString().slice(0, 10)
  return { from, to }
}

type Route = { section: Section; rest: string }

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#/, '')
  const i = raw.indexOf('/')
  let s = i === -1 ? raw : raw.slice(0, i)
  let rest = i === -1 ? '' : raw.slice(i + 1)
  // Old links (emails sent before Forms existed).
  if (s === 'inbox' || s === 'careers') {
    rest = s === 'inbox' ? `contact${rest ? `/${rest}` : ''}` : `careers${rest ? `/${rest}` : ''}`
    s = 'forms'
  }
  const section = (NAV.some((n) => n.id === s) ? s : 'overview') as Section
  return { section, rest }
}

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null)
  const [state, setState] = useState<'checking' | 'login' | 'in'>('checking')
  const [route, setRoute] = useState<Route>({ section: 'overview', rest: '' })
  const [preset, setPreset] = useState<string>('30d')
  const [custom, setCustom] = useState<Range | null>(null)
  const [visitor, setVisitor] = useState<string | null>(null)
  const [menu, setMenu] = useState(false)

  const tz = me?.timezone ?? 'America/Chicago'
  const range = useMemo<Range>(() => {
    if (preset === 'custom' && custom) return custom
    return presetRange(PRESETS.find((p) => p.id === preset)?.days ?? 30, tz)
  }, [preset, custom, tz])

  const loadMe = useCallback(async () => {
    try {
      const m = await get<Me>('me')
      setMe(m)
      setState('in')
    } catch (e) {
      // Not signed in (or the API is unreachable): show the sign-in form.
      if (e instanceof AuthError || e instanceof Error) setState('login')
    }
  }, [])

  useEffect(() => {
    setRoute(parseHash())
    try {
      const saved = window.localStorage.getItem('atr_dash_range')
      if (saved && (PRESETS.some((p) => p.id === saved) || saved === 'custom')) setPreset(saved === 'custom' ? '30d' : saved)
    } catch {}
    loadMe()
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [loadMe])

  // Refresh unread badges every minute.
  useEffect(() => {
    if (state !== 'in') return
    const id = window.setInterval(() => document.visibilityState === 'visible' && loadMe(), 60_000)
    return () => window.clearInterval(id)
  }, [state, loadMe])

  function go(section: string) {
    window.location.hash = section
    setMenu(false)
  }

  function choosePreset(id: string) {
    setPreset(id)
    try {
      window.localStorage.setItem('atr_dash_range', id)
    } catch {}
  }

  async function logout() {
    await post('logout').catch(() => {})
    setMe(null)
    setState('login')
  }

  if (state === 'checking') return <div className="min-h-screen" style={{ background: C.page }} />
  if (state === 'login' || !me) return <Login onDone={loadMe} />

  const showRange = ['overview', 'pages', 'events'].includes(route.section)
  const badge = (s: Section) => (s === 'forms' ? me.badges.forms : s === 'content' ? me.badges.drafts : s === 'redirects' ? me.badges.broken : 0)

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]" style={{ background: C.page }}>
      {/* Sidebar */}
      <aside
        className={`${menu ? 'flex' : 'hidden'} fixed inset-0 z-40 flex-col px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen`}
        style={{ background: C.ink, color: '#faf9f5' }}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <a href="/" className="no-underline" style={{ color: '#faf9f5' }} title="Open the website">
            <span className="text-[1.25rem] font-semibold tracking-tight">Atrium</span>
            <span className="ml-2 text-[0.75rem] opacity-60">Dashboard</span>
          </a>
          <button type="button" className="lg:hidden" onClick={() => setMenu(false)} aria-label="Close menu">
            ✕
          </button>
        </div>
        <nav className="grid gap-5" aria-label="Dashboard">
          {(['Analytics', 'Website', 'Admin'] as const).map((g) => (
            <div key={g}>
              <div className="mb-1 px-3 text-[0.7rem] font-semibold tracking-[0.12em] uppercase opacity-50">{g}</div>
              <ul className="m-0 grid list-none gap-0.5 p-0">
                {NAV.filter((n) => n.group === g).map((n) => {
                  const on = route.section === n.id
                  const b = badge(n.id)
                  return (
                    <li key={n.id}>
                      <a
                        href={`#${n.id}`}
                        onClick={() => setMenu(false)}
                        aria-current={on ? 'page' : undefined}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-[0.9rem] no-underline transition"
                        style={{ background: on ? 'rgba(184,232,154,0.14)' : 'transparent', color: on ? C.mint : 'rgba(250,249,245,0.85)' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d={n.icon} />
                        </svg>
                        <span className="flex-1">{n.label}</span>
                        {b > 0 && (
                          <span className="rounded-full px-2 py-0.5 text-[0.7rem] font-bold" style={{ background: C.mint, color: C.ink }}>
                            {b}
                          </span>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-auto grid gap-2 border-t pt-4 text-[0.8rem]" style={{ borderColor: 'rgba(250,249,245,0.12)' }}>
          <a href="/" target="_blank" rel="noopener" className="rounded-lg px-3 py-1.5 no-underline opacity-80 hover:opacity-100" style={{ color: '#faf9f5' }}>
            View website ↗
          </a>
          <div className="flex items-center justify-between gap-2 px-3">
            <span className="min-w-0 truncate opacity-70" title={me.user.email}>
              {me.user.name && me.user.name !== 'Owner' ? me.user.name : me.user.email}
            </span>
            <button type="button" onClick={logout} className="shrink-0 underline opacity-80 hover:opacity-100">
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 border-b px-4 py-3 backdrop-blur md:px-8" style={{ borderColor: C.line, background: 'rgba(243,239,228,0.88)' }}>
          <button type="button" className="rounded-lg px-2 py-1 lg:hidden" onClick={() => setMenu(true)} aria-label="Open menu" style={{ color: C.ink, background: 'rgba(4,47,52,0.06)' }}>
            ☰
          </button>
          <h1 className="m-0 mr-auto text-[1.35rem] font-semibold" style={{ color: C.ink }}>
            {TITLES[route.section]}
          </h1>
          {showRange && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex flex-wrap rounded-full bg-white p-1" style={{ border: `1px solid ${C.line}` }} role="group" aria-label="Date range">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => choosePreset(p.id)}
                    aria-pressed={preset === p.id}
                    className="rounded-full px-3 py-1 text-[0.8rem] font-medium"
                    style={{ background: preset === p.id ? C.ink : 'transparent', color: preset === p.id ? C.mint : C.ink }}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setCustom(custom ?? range)
                    setPreset('custom')
                  }}
                  aria-pressed={preset === 'custom'}
                  className="rounded-full px-3 py-1 text-[0.8rem] font-medium"
                  style={{ background: preset === 'custom' ? C.ink : 'transparent', color: preset === 'custom' ? C.mint : C.ink }}
                >
                  Custom
                </button>
              </div>
              {preset === 'custom' && custom && (
                <span className="flex items-center gap-1 text-[0.8rem]" style={{ color: C.ink }}>
                  <input type="date" value={custom.from} max={custom.to} onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })} className={`${field} !w-auto !py-1`} style={fieldStyle} aria-label="From" />
                  –
                  <input type="date" value={custom.to} min={custom.from} onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })} className={`${field} !w-auto !py-1`} style={fieldStyle} aria-label="To" />
                </span>
              )}
            </div>
          )}
        </header>

        <main className="px-4 py-6 md:px-8">
          {route.section === 'overview' && <Overview range={range} onNavigate={go} />}
          {route.section === 'realtime' && <Realtime onVisitor={setVisitor} />}
          {route.section === 'pages' && <PagesReport range={range} />}
          {route.section === 'events' && <EventsReport range={range} onVisitor={setVisitor} tz={tz} />}
          {route.section === 'content' && (
            <Content
              user={me.user}
              path={route.rest ? decodeURIComponent(route.rest) : null}
              onOpen={(p) => {
                window.location.hash = p ? `content/${encodeURIComponent(p)}` : 'content'
              }}
              onChange={loadMe}
            />
          )}
          {route.section === 'announcement' && <AnnouncementView user={me.user} />}
          {route.section === 'redirects' && <RedirectsView user={me.user} tz={tz} />}
          {route.section === 'media' && <MediaView user={me.user} />}
          {route.section === 'forms' && <Forms user={me.user} rest={route.rest} onChange={loadMe} tz={tz} />}
          {route.section === 'activity' && <ActivityView tz={tz} />}
          {route.section === 'settings' && <SettingsView user={me.user} onSaved={loadMe} />}
        </main>
      </div>

      {visitor && <VisitorDrawer visitor={visitor} tz={tz} onClose={() => setVisitor(null)} />}
    </div>
  )
}

function Login({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await post('login', { email, password })
      setIgnored(true)
      setPassword('')
      await onDone()
    } catch (err) {
      const status = (err as { status?: number | undefined }).status
      setError(status === 429 ? 'Too many tries. Wait 15 minutes and try again.' : 'Wrong email or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: C.page }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm" style={{ border: `1px solid ${C.line}` }}>
        <p className="m-0 mb-2 text-[0.75rem] font-semibold tracking-[0.14em] uppercase" style={{ color: C.muted }}>
          Atrium
        </p>
        <h1 className="m-0 mb-6 text-[1.75rem] font-semibold" style={{ color: C.ink }}>
          Website dashboard
        </h1>
        <label className="mb-4 grid gap-1.5 text-[0.9rem] font-semibold" style={{ color: C.ink }}>
          Email
          <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={field} style={fieldStyle} required />
        </label>
        <label className="grid gap-1.5 text-[0.9rem] font-semibold" style={{ color: C.ink }}>
          Password
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} style={fieldStyle} required />
        </label>
        {error && (
          <p role="alert" className="m-0 mt-4 text-[0.9rem]" style={{ color: C.down }}>
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="mt-6 w-full rounded-full px-6 py-3 font-semibold disabled:opacity-60" style={{ background: C.ink, color: C.mint }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

