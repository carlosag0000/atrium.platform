'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Applies dashboard-managed extras on the public site:
//  - SEO title/description edits after client-side navigation (the first page load already has
//    them, written into the HTML by /api/render.php)
//  - the site-wide bottom bar (Website → Announcement). Until one is saved in the dashboard, the
//    bar promotes the free Marketing Grader.

export type Announcement = {
  on?: boolean
  style?: 'banner' | 'pill'
  title?: string
  text?: string
  link?: string
  label?: string
  tone?: 'mint' | 'dark' | 'amber'
  ends?: string
  id?: string
}

export const DEFAULT_BAR: Announcement = {
  on: true,
  style: 'banner',
  title: 'Marketing Grader',
  text: 'How does your restaurant show up online? Get your free score in minutes.',
  link: 'https://grader.atriumad.com',
  label: 'Get my free score',
  tone: 'dark',
  id: 'grader-2026',
}

const PRIVATE = /^\/(admin|forms)(\/|$)/

function setMeta(selector: string, attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function left(ends?: string) {
  if (!ends) return null
  const ms = new Date(ends).getTime() - Date.now()
  if (Number.isNaN(ms) || ms <= 0) return null
  const s = Math.floor(ms / 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${Math.floor(s / 86400)}d ${pad(Math.floor((s % 86400) / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`
}

export function BarView({ bar, onClose, preview = false }: { bar: Announcement; onClose?: () => void; preview?: boolean }) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!bar.ends) return
    const id = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [bar.ends])
  const tone = bar.tone ?? 'dark'
  const bg = tone === 'dark' ? 'linear-gradient(100deg,#042f34 0%,#0e4a4f 55%,#1e8c7c 130%)' : tone === 'amber' ? '#ffc933' : '#b8e89a'
  const fg = tone === 'dark' ? '#faf9f5' : '#042f34'
  const accent = tone === 'dark' ? '#b8e89a' : '#042f34'
  const external = /^https?:\/\//.test(bar.link ?? '') && !/atriumad\.com\/(?!$)/.test('')
  const countdown = left(bar.ends)
  const wrap = preview ? 'relative flex justify-center' : 'fixed inset-x-0 bottom-3 z-[60] flex justify-center px-3 md:bottom-5'

  if ((bar.style ?? 'banner') === 'pill') {
    return (
      <div className={wrap} role="region" aria-label="Announcement">
        <div className="flex max-w-2xl items-center gap-3 rounded-full py-2 pr-2 pl-5 text-[0.9rem] shadow-lg" style={{ background: bg, color: fg }}>
          <span className="min-w-0">{bar.text}</span>
          {bar.link && (
            <a href={bar.link} className="shrink-0 rounded-full px-3 py-1 font-semibold no-underline" style={{ background: accent, color: tone === 'dark' ? '#042f34' : bg }} data-track="announcement_click" data-track-label={bar.text} {...(external ? { target: '_blank', rel: 'noopener' } : {})}>
              {bar.label || 'Learn more'}
            </a>
          )}
          {onClose && (
            <button type="button" aria-label="Close announcement" className="shrink-0 rounded-full px-2 py-1 opacity-70 hover:opacity-100" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={wrap} role="region" aria-label="Announcement">
      <div
        className="relative grid w-full max-w-[1000px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 overflow-hidden rounded-xl px-4 py-3 shadow-[0_12px_40px_rgba(4,47,52,0.35)] md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:gap-x-8 md:px-8 md:py-5"
        style={{ background: bg, color: fg }}
      >
        {bar.title && (
          <p className="m-0 hidden font-serif text-[clamp(1.5rem,2.4vw,2.1rem)] leading-none italic md:block" style={{ color: accent }}>
            {bar.title}
          </p>
        )}
        <p className="m-0 min-w-0 text-[0.85rem] leading-snug md:text-[1rem]">
          {bar.title && (
            <b className="mr-1 font-semibold md:hidden" style={{ color: accent }}>
              {bar.title}:
            </b>
          )}
          {bar.text}
          {countdown && (
            <span className="ml-2 font-semibold tabular-nums md:hidden" style={{ color: accent }}>
              {countdown}
            </span>
          )}
        </p>
        {countdown && (
          <p className="m-0 hidden text-[1.6rem] font-light tracking-wide tabular-nums md:block" aria-label="Time left">
            {countdown}
          </p>
        )}
        <div className="flex items-center gap-2">
          {bar.link && (
            <a
              href={bar.link}
              className="rounded-full px-4 py-2 text-[0.85rem] font-semibold whitespace-nowrap no-underline transition hover:brightness-105 md:px-5 md:py-2.5 md:text-[0.95rem]"
              style={{ background: accent, color: tone === 'dark' ? '#042f34' : '#faf9f5' }}
              data-track="announcement_click"
              data-track-label={bar.title || bar.text}
              {...(/^https?:\/\//.test(bar.link) ? { target: '_blank', rel: 'noopener' } : {})}
            >
              {bar.label || 'Learn more'} →
            </a>
          )}
          {onClose && (
            <button type="button" aria-label="Close" className="rounded-full p-1.5 text-[1.1rem] leading-none opacity-70 hover:opacity-100" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CmsRuntime() {
  const pathname = usePathname()
  const [bar, setBar] = useState<Announcement | null>(null)

  useEffect(() => {
    const seo = window.__CMS__?.seo?.[pathname || '/']
    if (!seo) return
    // Next sets the built-in title after navigation; apply ours on the next frame.
    const id = window.requestAnimationFrame(() => {
      if (seo.title) document.title = seo.title
      if (seo.description) {
        setMeta('meta[name="description"]', 'name', 'description', seo.description)
        setMeta('meta[property="og:description"]', 'property', 'og:description', seo.description)
      }
      if (seo.title) setMeta('meta[property="og:title"]', 'property', 'og:title', seo.title)
    })
    return () => window.cancelAnimationFrame(id)
  }, [pathname])

  useEffect(() => {
    // Inside the dashboard's page editor (?cms=draft) the bar would cover the page being edited.
    if (/[?&]cms=/.test(window.location.search)) return
    const saved = window.__CMS__?.g?.announcement as Announcement | undefined
    const a = saved ?? DEFAULT_BAR
    if (!a.on || !a.text) return
    if (a.ends && !left(a.ends)) return
    try {
      if (window.localStorage.getItem('atr_bar_closed') === (a.id ?? a.text)) return
    } catch {}
    setBar(a)
  }, [])

  if (!bar || PRIVATE.test(pathname ?? '')) return null
  return (
    <BarView
      bar={bar}
      onClose={() => {
        try {
          window.localStorage.setItem('atr_bar_closed', bar.id ?? bar.text ?? '')
        } catch {}
        setBar(null)
      }}
    />
  )
}
