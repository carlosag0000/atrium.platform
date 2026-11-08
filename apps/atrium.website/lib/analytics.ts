// First-party visit tracking for www.atriumad.com. Sends small beacons to /api/v.php (PHP on Hostinger).
// No cookies: a random visitor id lives in localStorage and a session id in sessionStorage (30 min idle).

const ENDPOINT = '/api/v.php'
const SESSION_IDLE_MS = 30 * 60 * 1000
export const IGNORE_KEY = 'atr_ignore'

function rid(): string {
  const a = new Uint8Array(8)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('')
}

function store(kind: 'local' | 'session'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function isIgnored(): boolean {
  return store('local')?.getItem(IGNORE_KEY) === '1'
}

export function setIgnored(on: boolean) {
  const ls = store('local')
  if (!ls) return
  if (on) ls.setItem(IGNORE_KEY, '1')
  else ls.removeItem(IGNORE_KEY)
}

/** Returns visitor + session ids, creating them when missing. `isNew` / `isEntry` mark first sightings. */
export function ids(): { v: string; s: string; isNew: boolean; isEntry: boolean } {
  const ls = store('local')
  const ss = store('session')
  let isNew = false
  let isEntry = false
  let v = ls?.getItem('atr_v') ?? ''
  if (!/^[a-f0-9]{16}$/.test(v)) {
    v = rid()
    isNew = true
    ls?.setItem('atr_v', v)
  }
  let s = ss?.getItem('atr_s') ?? ''
  const last = Number(ss?.getItem('atr_st') ?? 0)
  if (!/^[a-f0-9]{16}$/.test(s) || Date.now() - last > SESSION_IDLE_MS) {
    s = rid()
    isEntry = true
    ss?.setItem('atr_s', s)
  }
  ss?.setItem('atr_st', String(Date.now()))
  return { v, s, isNew, isEntry }
}

export function send(payload: Record<string, unknown>) {
  if (typeof window === 'undefined' || isIgnored() || navigator.webdriver) return
  const body = JSON.stringify(payload)
  try {
    // text/plain keeps the beacon a "simple" request (no CORS preflight).
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return
  } catch {
    // fall through to fetch
  }
  fetch(ENDPOINT, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {})
}

/** Record a custom event, e.g. track('cta_click', 'Book a call'). */
export function track(name: string, label = '') {
  if (typeof window === 'undefined') return
  const { v, s } = ids()
  send({ t: 'ev', v, s, p: window.location.pathname, n: name, l: label.slice(0, 255) })
}

export { rid }
