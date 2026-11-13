'use client'

import { useEffect, useState } from 'react'

// Where Insights content goes. On a normal page load, /api/render.php has already written the list
// or the article into this element and into window.__INSIGHTS__, so the first render matches and
// search engines see the full text. After client-side navigation (e.g. from the menu) the content
// is fetched from /api/insights.php instead.

declare global {
  interface Window {
    __INSIGHTS__?: { kind: 'list' | 'post'; html: string; title: string }
    __INSIGHTS_USED__?: boolean
  }
}

function initial(kind: 'list' | 'post'): string {
  if (typeof window === 'undefined') return ''
  const d = window.__INSIGHTS__
  return d && d.kind === kind && !window.__INSIGHTS_USED__ ? d.html : ''
}

export default function InsightsRoot({ kind, className }: { kind: 'list' | 'post'; className?: string }) {
  const [html, setHtml] = useState(() => initial(kind))

  useEffect(() => {
    if (html) {
      window.__INSIGHTS_USED__ = true
      return
    }
    window.__INSIGHTS_USED__ = true
    const q = new URLSearchParams(window.location.search)
    const url =
      kind === 'list'
        ? `/api/insights.php?list=1&category=${encodeURIComponent(q.get('category') ?? '')}&page=${encodeURIComponent(q.get('page') ?? '1')}`
        : `/api/insights.php?post=${encodeURIComponent(window.location.pathname.split('/').pop() ?? '')}`
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { html: string; title: string }) => {
        setHtml(d.html)
        if (kind === 'post' && d.title) document.title = d.title
      })
      .catch(() => setHtml('<div class="ins-wrap"><div class="ins-empty"><p class="ins-empty-title">This article could not be loaded.</p><p><a href="/insights">See all insights</a></p></div></div>'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  return (
    <div
      data-insights-root={kind}
      className={className}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: written by /api/blog.php from sanitised article HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
