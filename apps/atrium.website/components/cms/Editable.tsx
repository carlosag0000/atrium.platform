'use client'

import { usePathname } from 'next/navigation'
import { isValidElement, type ReactNode } from 'react'

// Text that can be changed from the dashboard (Website → Content).
//
// The page is built with the default text. On the server, /api/render.php swaps in the published
// edits for every [data-cms] element and puts the same edits in window.__CMS__, so the browser
// renders the identical HTML when React hydrates (no flash, and search engines see the edits).
// The key is the page path plus a hash of the default text, so nothing has to be named by hand.

declare global {
  interface Window {
    __CMS__?: { t?: Record<string, string>; g?: Record<string, unknown>; seo?: Record<string, Record<string, string>> }
  }
}

function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(nodeText).join('')
  if (isValidElement(node)) {
    const type = typeof node.type === 'string' ? node.type : 'c'
    return `<${type}>${nodeText((node.props as { children?: ReactNode }).children)}</${type}>`
  }
  return ''
}

function fnv(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

export function cmsKey(path: string, children: ReactNode) {
  return `${path || '/'}#${fnv(nodeText(children).replace(/\s+/g, ' ').trim())}`
}

export function cmsText(key: string): string | undefined {
  if (typeof window === 'undefined') return undefined
  return window.__CMS__?.t?.[key]
}

/** Wrap text that should be editable. `global` shares one value across every page (navbar, footer). */
export default function E({ children, global = false }: { children: ReactNode; global?: boolean }) {
  const pathname = usePathname()
  const key = cmsKey(global ? 'global' : (pathname ?? '/'), children)
  const html = cmsText(key)
  if (html === undefined) return <span data-cms={key}>{children}</span>
  // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitised server-side (allows em, strong, br, a)
  return <span data-cms={key} dangerouslySetInnerHTML={{ __html: html }} />
}
