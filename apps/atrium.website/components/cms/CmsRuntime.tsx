'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Applies dashboard-managed extras on the public site:
//  - SEO title/description edits after client-side navigation (the first page load already has
//    them, written into the HTML by /api/render.php)
//  - the site-wide announcement bar (Website → Announcement)

type Announcement = { on?: boolean; text?: string; link?: string; label?: string; tone?: 'mint' | 'dark' | 'amber'; id?: string }

function setMeta(selector: string, attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
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
    const a = window.__CMS__?.g?.announcement as Announcement | undefined
    if (!a?.on || !a.text) return
    try {
      if (window.localStorage.getItem('atr_bar_closed') === (a.id ?? a.text)) return
    } catch {}
    setBar(a)
  }, [])

  if (!bar || /^\/admin(\/|$)/.test(pathname ?? '')) return null
  const tone = bar.tone ?? 'mint'
  const bg = tone === 'dark' ? '#042f34' : tone === 'amber' ? '#ffc933' : '#b8e89a'
  const fg = tone === 'dark' ? '#faf9f5' : '#042f34'
  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4" role="region" aria-label="Announcement">
      <div className="flex max-w-2xl items-center gap-3 rounded-full py-2 pr-2 pl-5 text-[0.9rem] shadow-lg" style={{ background: bg, color: fg }}>
        <span className="min-w-0">{bar.text}</span>
        {bar.link && (
          <a href={bar.link} className="shrink-0 rounded-full px-3 py-1 font-semibold no-underline" style={{ background: fg, color: bg }} data-track="announcement_click" data-track-label={bar.text}>
            {bar.label || 'Learn more'}
          </a>
        )}
        <button
          type="button"
          aria-label="Close announcement"
          className="shrink-0 rounded-full px-2 py-1 opacity-70 hover:opacity-100"
          onClick={() => {
            try {
              window.localStorage.setItem('atr_bar_closed', bar.id ?? bar.text ?? '')
            } catch {}
            setBar(null)
          }}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
