// Client for the dashboard API (/api/admin.php). The session cookie is HttpOnly, path /api/.

export const API = '/api/admin.php'

export class AuthError extends Error {}

export type Range = { from: string; to: string }

export function url(action: string, params: Record<string, string | number | undefined> = {}) {
  const q = new URLSearchParams({ action })
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v))
  return `${API}?${q}`
}

export async function get<T>(action: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const res = await fetch(url(action, params), { credentials: 'same-origin' })
  if (res.status === 401) throw new AuthError('auth')
  if (!res.ok) throw new Error(`${action}: ${res.status}`)
  return res.json() as Promise<T>
}

export async function post<T = { ok: boolean }>(action: string, body: unknown = {}, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const res = await fetch(url(action, params), {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 401) throw new AuthError('auth')
  const json = (await res.json().catch(() => ({}))) as T & { error?: string | undefined }
  if (!res.ok) throw Object.assign(new Error(json.error || `${action}: ${res.status}`), { status: res.status, code: json.error })
  return json
}

// ── Shared types ─────────────────────────────────────────────────────────────

export type User = { id: number; email: string; name: string; role: 'owner' | 'editor' | 'viewer' }

export type Step =
  | { ts: string; type: 'page'; path: string; title: string; duration: number; scroll: number }
  | { ts: string; type: 'event'; path: string; name: string; label: string }

export type Visit = {
  started: string
  channel: string
  ref_host: string
  campaign: string
  device: string
  browser: string
  os: string
  country: string
  steps: Step[]
}

export type Journey = {
  visits: Visit[]
  summary: null | { first_seen: string; first_channel: string; first_referrer: string; visits: number; pageviews: number; time: number }
}

// ── Formatting ───────────────────────────────────────────────────────────────

export const nf = new Intl.NumberFormat('en-US')

export function fmtNum(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k`
  return nf.format(n)
}

export function fmtDuration(s: number) {
  if (!s) return '0s'
  const m = Math.floor(s / 60)
  const r = Math.round(s % 60)
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`
  return m ? `${m}m ${r.toString().padStart(2, '0')}s` : `${r}s`
}

export function fmtWhen(iso: string, tz?: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: tz })
}

export function fmtAgo(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export function fmtDay(day: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  const [y = 1970, m = 1, d = 1] = day.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })
}

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null
export function countryName(code: string) {
  if (!code || code.length !== 2) return code || 'Unknown'
  try {
    return regionNames?.of(code) ?? code
  } catch {
    return code
  }
}

export function flag(code: string) {
  if (!code || code.length !== 2) return '🌐'
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))
}

export function downloadUrl(action: string, params: Record<string, string | number | undefined> = {}) {
  return url(action, params)
}
