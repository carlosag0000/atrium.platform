'use client'

import { ArrowUpRight, BookOpen, Gauge, LayoutGrid, Library } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import TransitionLink from './TransitionLink'

// "Resources" in the header: a full-width hover panel like the Services menu. Left, the list of
// resources; right, the newest Insights articles (loaded from /api/insights.php when first opened).

export const RESOURCE_LINKS = [
  { label: 'Insights', desc: 'Playbooks on restaurant & hospitality marketing', href: '/insights', Icon: BookOpen, external: false },
  { label: 'Marketing Grader', desc: 'Free score for your restaurant in minutes', href: 'https://grader.atriumad.com', Icon: Gauge, external: true },
  { label: 'Case studies', desc: 'What changed for the brands we work with', href: '/work', Icon: LayoutGrid, external: false },
  { label: 'Resource library', desc: 'Guides organized by the decisions you make', href: '/resources', Icon: Library, external: false },
] as const

type Latest = { url: string; title: string; cover: string; cover_alt: string; category: string; date: string }

export default function ResourcesMenu({ textColor }: { textColor?: string }) {
  const [open, setOpen] = useState(false)
  const [latest, setLatest] = useState<Latest[] | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)

  const onEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const onLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  // Load the newest articles the first time the menu opens.
  useEffect(() => {
    if (!open || latest) return
    fetch('/api/insights.php?latest=2')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { posts: Latest[] }) => setLatest(d.posts))
      .catch(() => setLatest([]))
  }, [open, latest])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onPointerDown)
    }
  }, [open])

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover bridge only; the keyboard path is the button's own focus and Escape
    <div className="flex h-14 items-center" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <button
        aria-controls="resources-menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md text-sm transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-green-fill)]"
        onClick={() => setOpen((v) => !v)}
        ref={triggerRef}
        style={textColor ? { color: textColor } : undefined}
        type="button"
      >
        Resources
        <span aria-hidden="true" className={`text-[0.7rem] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      <div
        aria-hidden="true"
        className={`-z-10 fixed inset-0 transition-opacity duration-300 ease-out ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onMouseEnter={close}
        style={{
          background: 'color-mix(in srgb, var(--teal-900) 32%, transparent)',
          backdropFilter: 'blur(var(--blur-md))',
          WebkitBackdropFilter: 'blur(var(--blur-md))',
        }}
      />

      <div
        aria-label="Resources"
        className={`absolute right-0 left-0 top-full transition-all duration-200 ease-out ${
          open ? 'pointer-events-auto translate-y-0 opacity-100' : '-translate-y-2 pointer-events-none opacity-0'
        }`}
        id="resources-menu"
        ref={panelRef}
        role="menu"
      >
        <div className="border-line border-b bg-cream shadow-float">
          <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] gap-12 px-[var(--gutter)] py-12">
            <div className="flex flex-col">
              <p className="m-0 mb-5 text-charcoal text-[1.05rem]">Our resources</p>
              <div className="flex flex-col divide-y divide-line">
                {RESOURCE_LINKS.map(({ label, desc, href, Icon, external }) => {
                  const inner = (
                    <>
                      <span aria-hidden="true" className="-translate-y-1/2 absolute top-1/2 left-0 h-1.5 w-1.5 rounded-full bg-green opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      <span className="flex min-w-0 flex-1 flex-col gap-1 transition-transform duration-200 group-hover:translate-x-1">
                        <span className="text-charcoal text-[0.95rem] leading-tight">{label}</span>
                        <span className="text-muted text-xs leading-snug">{desc}</span>
                      </span>
                      {external ? (
                        <ArrowUpRight aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.5} />
                      ) : (
                        <Icon aria-hidden="true" className="h-4 w-4 flex-shrink-0 text-muted" strokeWidth={1.5} />
                      )}
                    </>
                  )
                  const cls = 'group relative flex items-center gap-4 py-4 pl-5 no-underline'
                  return external ? (
                    <a className={cls} href={href} key={href} onClick={close} rel="noopener" role="menuitem" target="_blank" data-track="resources_menu" data-track-label={label}>
                      {inner}
                    </a>
                  ) : (
                    <TransitionLink className={cls} href={href} key={href} onClick={close} role="menuitem">
                      {inner}
                    </TransitionLink>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col border-line border-l pl-12">
              <p className="m-0 mb-5 text-charcoal text-[1.05rem]">Latest insights</p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  ...(latest ?? []),
                  { url: 'https://grader.atriumad.com', title: 'Get your free restaurant marketing score', cover: '', cover_alt: '', category: 'Free tool', date: '' },
                  { url: '/insights', title: 'Playbooks for hospitality growth', cover: '', cover_alt: '', category: 'Insights', date: '' },
                ]
                  .slice(0, 2)
                  .map((p, i) => (
                  <a
                    className="group flex flex-col gap-3 no-underline"
                    href={p.url}
                    key={p.url}
                    onClick={close}
                    role="menuitem"
                    {...(p.url.startsWith('http') ? { target: '_blank', rel: 'noopener' } : {})}
                  >
                    <span className="block aspect-[16/9] overflow-hidden rounded-xl" style={{ background: i % 2 ? 'var(--mint-400)' : 'var(--teal-800)' }}>
                      {p.cover ? (
                        <img alt={p.cover_alt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" src={p.cover} />
                      ) : (
                        <span className="flex h-full items-end p-5 font-serif text-[1.8rem] leading-none italic" style={{ color: i % 2 ? 'var(--teal-800)' : 'var(--mint-400)' }}>
                          {p.category}
                        </span>
                      )}
                    </span>
                    <span className="text-charcoal text-[1rem] leading-snug transition-opacity group-hover:opacity-70">{p.title}</span>
                    {(p.category || p.date) && (
                      <span className="text-muted text-xs">
                        {[p.category, p.date].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
