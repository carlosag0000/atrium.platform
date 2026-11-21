'use client'
import { Button } from '@atrium/ui'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CTA } from '@/lib/cta'
import { SERVICE_MENU } from '@/lib/servicesMenu'
import MegaMenu from './MegaMenu'
import { PillCTA } from './PillCTA'
import ResourcesMenu, { RESOURCE_LINKS } from './ResourcesMenu'
import TransitionLink from './TransitionLink'

// ─── Icons ────────────────────────────────────────────────────────────────────

const otherLinks = [
  { label: 'Our Work', href: '/work' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

// ─── Navbar ────────────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bgOpacity, setBgOpacity] = useState(0)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const heroH = window.innerHeight
        setBgOpacity(Math.min(window.scrollY / heroH, 1))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const closeMobile = () => setMobileOpen(false)
  // The light heroes: a case study and a single service page both open on cream
  // with the glint cluster running to the top edge, so their bar fills in cream
  // with dark nav text. `/services` itself is not one of them — its hero is the
  // full-screen dark panel, which the bar sits on cleanly.
  const isLightHero = pathname.startsWith('/work/') || /^\/services\/[^/]+/.test(pathname)
  const isHome = pathname === '/'
  // Home and the light heroes all open on a full-bleed hero the bar should not
  // cut into, so they animate from transparent → solid on scroll. Every other
  // page shows a solid header from the start.
  const effOpacity = isHome || isLightHero ? bgOpacity : 1
  // The bar has to finish opaque on the light-hero pages: the dark story section
  // scrolls under it further down, and a translucent cream bar over that ground
  // leaves the nav text unreadable.
  const caseBarAlpha = effOpacity * 0.95
  const navTextColor = isLightHero ? 'var(--text-strong)' : 'var(--color-surface)'
  const headerBorder = isLightHero
    ? effOpacity > 0.3
      ? `1px solid rgba(7,47,52,${effOpacity * 0.08})`
      : '1px solid transparent'
    : effOpacity > 0.3
      ? `1px solid rgba(228,238,240,${effOpacity * 0.08})`
      : '1px solid transparent'
  const headerShadow = isLightHero
    ? effOpacity > 0.6
      ? `0 1px 24px rgba(7,47,52,${effOpacity * 0.05})`
      : 'none'
    : effOpacity > 0.6
      ? `0 1px 24px rgba(4,32,36,${effOpacity * 0.4})`
      : 'none'

  return (
    <header
      // Same edge as the page content: the container's left edge once the
      // viewport is wider than the container, the plain gutter below that. The
      // header is fixed, so its percentage resolves against the viewport.
      className="fixed top-0 left-0 right-0 w-full z-50 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center px-[max(var(--gutter),calc((100%-var(--container-max))/2))] h-14"
      style={{
        borderBottom: headerBorder,
        boxShadow: headerShadow,
      }}
    >
      {/* Blur backdrop — separate element so it doesn't make header a fixed containing block */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 transition-opacity duration-300"
        style={{
          background: isLightHero ? `rgba(247,249,242,${caseBarAlpha})` : `rgba(7,47,52,${effOpacity})`,
          backdropFilter: effOpacity > 0.05 ? `blur(${Math.round(effOpacity * 14)}px)` : 'none',
          WebkitBackdropFilter: effOpacity > 0.05 ? `blur(${Math.round(effOpacity * 14)}px)` : 'none',
        }}
      />
      {/* Logo */}
      <TransitionLink href="/" className="flex justify-self-start items-center">
        <Image
          src="/logos/atrium-wordmark.svg"
          alt="Atrium"
          width={88}
          height={24}
          priority
          unoptimized
          style={{ height: '24px', width: 'auto', filter: isLightHero ? 'brightness(0)' : 'brightness(0) invert(1)' }}
        />
      </TransitionLink>

      {/* Nav links — centered column */}
      <nav className="hidden gap-8 justify-self-center items-center md:flex">
        <MegaMenu label="Services" textColor={navTextColor} />

        {otherLinks.map((link, i) => [
          i === 1 ? <ResourcesMenu key="resources" textColor={navTextColor} /> : null,
          <TransitionLink
            key={link.href}
            href={link.href}
            className="relative text-sm transition-opacity hover:opacity-70 after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-[var(--color-accent)] after:transition-all after:duration-300 hover:after:w-full"
            style={{ color: navTextColor }}
          >
            {link.label}
          </TransitionLink>,
        ])}
      </nav>

      {/* Right column — CTA on desktop, menu toggle on mobile */}
      <div className="flex gap-4 justify-end justify-self-end items-center">
        <div className="hidden md:flex">
          <PillCTA external={CTA.primary.external} href={CTA.primary.href} size="sm" tone={isLightHero ? 'on-light' : 'on-dark'}>
            {CTA.primary.label}
          </PillCTA>
        </div>

        {/* Mobile menu toggle — icon-only, morphs into an X when open */}
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMobileOpen((v) => !v)}
          className="-m-2 flex items-center justify-center rounded-md p-2 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-green-fill)]"
        >
          <span
            className="relative flex-shrink-0 w-4 h-4"
            style={{ color: isLightHero ? 'var(--text-strong)' : 'var(--color-accent)' }}
          >
            <span
              className={`absolute left-0 top-1/2 w-full h-px transition-transform duration-200 ${mobileOpen ? 'rotate-45' : '-translate-y-[3px]'}`}
              style={{ background: 'currentColor' }}
            />
            <span
              className={`absolute left-0 top-1/2 w-full h-px transition-transform duration-200 ${mobileOpen ? '-rotate-45' : 'translate-y-[3px]'}`}
              style={{ background: 'currentColor' }}
            />
          </span>
        </button>
      </div>

      {/* Backdrop — dims and blurs the page while the services mega menu is open */}
      {/* Mobile full-screen panel */}
      <div
        className={`md:hidden fixed inset-0 top-14 overflow-y-auto transition-opacity duration-200 ease-out ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'var(--color-primary)' }}
        role="menu"
      >
        <div className="flex flex-col gap-8 px-6 pt-8 pb-10">
          <div
            className="flex flex-col gap-4 pb-6 border-b"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            {otherLinks.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="text-lg "
                style={{ color: 'var(--color-surface)' }}
              >
                {link.label}
              </TransitionLink>
            ))}
          </div>

          {SERVICE_MENU.flatMap((column) => column.engines).map((engine) => (
            <div key={engine.name} className="flex flex-col gap-1">
              <p className="type-eyebrow mb-3" style={{ color: 'var(--color-accent)', opacity: 0.55 }}>
                {engine.name}
              </p>
              {engine.services.map((svc) =>
                svc.external ? (
                  <a key={svc.name} href={svc.href} target="_blank" rel="noopener" onClick={closeMobile} className="flex flex-col gap-0.5 rounded-lg px-2 py-2 -mx-2 hover:bg-white/5" style={{ color: 'var(--color-surface)' }}>
                    <span className="text-sm">{svc.name} ↗</span>
                    <span className="text-xs" style={{ opacity: 0.4 }}>{svc.line}</span>
                  </a>
                ) : (
                  <TransitionLink key={svc.name} href={svc.href} onClick={closeMobile} className="flex flex-col gap-0.5 rounded-lg px-2 py-2 -mx-2 hover:bg-white/5" style={{ color: 'var(--color-surface)' }}>
                    <span className="text-sm">{svc.name}</span>
                    <span className="text-xs" style={{ opacity: 0.4 }}>{svc.line}</span>
                  </TransitionLink>
                ),
              )}
            </div>
          ))}

          <div className="flex flex-col gap-1">
            <p className="type-eyebrow mb-3" style={{ color: 'var(--color-accent)', opacity: 0.55 }}>
              Resources
            </p>
            {RESOURCE_LINKS.map((r) =>
              r.external ? (
                <a key={r.href} href={r.href} target="_blank" rel="noopener" onClick={closeMobile} className="flex flex-col gap-0.5 rounded-lg px-2 py-2 -mx-2 hover:bg-white/5" style={{ color: 'var(--color-surface)' }}>
                  <span className="text-sm">{r.label} ↗</span>
                  <span className="text-xs" style={{ opacity: 0.4 }}>{r.desc}</span>
                </a>
              ) : (
                <TransitionLink key={r.href} href={r.href} onClick={closeMobile} className="flex flex-col gap-0.5 rounded-lg px-2 py-2 -mx-2 hover:bg-white/5" style={{ color: 'var(--color-surface)' }}>
                  <span className="text-sm">{r.label}</span>
                  <span className="text-xs" style={{ opacity: 0.4 }}>{r.desc}</span>
                </TransitionLink>
              ),
            )}
          </div>

          <Button href={CTA.primary.href} {...(CTA.primary.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} variant="primary" onClick={closeMobile} size="sm" className="w-full justify-center">
            {CTA.primary.label}
          </Button>
        </div>
      </div>
    </header>
  )
}
