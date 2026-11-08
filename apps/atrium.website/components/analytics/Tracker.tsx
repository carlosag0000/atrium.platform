'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { ids, rid, send, track } from '@/lib/analytics'

// Counts page views, engaged time, scroll depth and key clicks for the dashboard at /admin.
// Private pages (the dashboard itself) are never tracked.

const PRIVATE = /^\/(admin|careers\/admin)(\/|$)/
const HEARTBEAT_MS = 30_000

type Current = { id: string; engagedMs: number; visibleSince: number | null; maxScroll: number }

export default function Tracker() {
  const pathname = usePathname()
  const current = useRef<Current | null>(null)
  const firstView = useRef(true)

  // Sends engaged seconds + max scroll for the current page view.
  const flush = useCallback((keepVisible = false) => {
    const c = current.current
    if (!c) return
    if (c.visibleSince !== null) {
      c.engagedMs += Date.now() - c.visibleSince
      c.visibleSince = keepVisible ? Date.now() : null
    }
    send({ t: 'ping', id: c.id, d: Math.round(c.engagedMs / 1000), sc: c.maxScroll })
  }, [])

  // Page views: one per route change.
  useEffect(() => {
    if (!pathname || PRIVATE.test(pathname)) return

    const id = rid()
    const { v, s, isNew, isEntry } = ids()
    current.current = { id, engagedMs: 0, visibleSince: document.visibilityState === 'visible' ? Date.now() : null, maxScroll: 0 }
    // Wait a tick so the new page's <title> is in place.
    const t = window.setTimeout(() => {
      send({
        t: 'pv',
        id,
        v,
        s,
        n: isNew ? 1 : 0,
        e: isEntry ? 1 : 0,
        p: pathname,
        q: window.location.search,
        ti: document.title,
        r: firstView.current ? document.referrer : '',
        w: window.screen?.width ?? window.innerWidth,
        l: navigator.language,
        z: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      firstView.current = false
    }, 50)

    return () => {
      window.clearTimeout(t)
      flush()
      current.current = null
    }
  }, [pathname, flush])

  // Engagement, scroll depth, heartbeat and click tracking (mounted once).
  useEffect(() => {
    const onScroll = () => {
      const c = current.current
      if (!c) return
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 100
      if (pct > c.maxScroll) c.maxScroll = Math.min(100, pct)
    }
    const onVisibility = () => {
      const c = current.current
      if (!c) return
      if (document.visibilityState === 'hidden') flush()
      else c.visibleSince = Date.now()
    }
    const onHide = () => flush()
    const beat = window.setInterval(() => {
      if (document.visibilityState === 'visible') flush(true)
    }, HEARTBEAT_MS)

    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('a, button, [data-track]')
      if (!el) return
      const text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
      const custom = el.getAttribute('data-track')
      if (custom) return track(custom, el.getAttribute('data-track-label') || text)
      const cal = el.getAttribute('data-cal-link')
      if (cal) return track('cal_click', `${text} (${cal})`)
      const href = el.getAttribute('href') || ''
      if (href.startsWith('mailto:')) return track('email_click', href.slice(7).split('?')[0])
      if (href.startsWith('tel:')) return track('phone_click', href.slice(4))
      if (/^https?:\/\//i.test(href)) {
        try {
          const u = new URL(href)
          if (u.hostname.replace(/^www\./, '') !== 'atriumad.com') return track('outbound_click', u.hostname + u.pathname)
        } catch {
          return
        }
      }
      if (/^\/(contact|pricing)(\?|#|$)/.test(href)) return track('cta_click', `${text} → ${href}`)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onHide)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('click', onClick, true)
      window.clearInterval(beat)
    }
  }, [flush])

  return null
}
