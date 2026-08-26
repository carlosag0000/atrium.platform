'use client'
import { Button } from '@atrium/ui'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CTA } from '@/lib/cta'
import MegaMenu from './MegaMenu'
import { PillCTA } from './PillCTA'
import TransitionLink from './TransitionLink'

// ─── Icons ────────────────────────────────────────────────────────────────────
const icons: Record<string, React.ReactNode> = {
  gem: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 6L8 14L13 6L10.5 2H5.5L3 6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3 6H13M5.5 2L8 6L10.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  camera: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="5" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 5V4C5.5 3.4 6 3 6.5 3H9.5C10 3 10.5 3.4 10.5 4V5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  grid: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  chat: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 2H14C14.6 2 15 2.4 15 3V10C15 10.6 14.6 11 14 11H5L1 15V3C1 2.4 1.4 2 2 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  target: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
    </svg>
  ),
  search: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5L14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  star: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L10 6H15L11 9L12.5 14.5L8 11.5L3.5 14.5L5 9L1 6H6L8 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  sparkle: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1V4M8 12V15M1 8H4M12 8H15M3.5 3.5L5.5 5.5M10.5 10.5L12.5 12.5M12.5 3.5L10.5 5.5M5.5 10.5L3.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  mail: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 4L8 9L15 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),
  users: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M1 13C1 10.8 3 9 5.5 9S10 10.8 10 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="11" cy="5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M13 13C13 11.3 12 10 11 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  chart: (
    <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 14H15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="2" y="8" width="3" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="6.5" y="4" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="11" y="1" width="3" height="13" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
}

// ─── Service data ──────────────────────────────────────────────────────────────
const leftGroup = {
  label: 'Generate Demand',
  services: [
    { label: 'Brand Strategy & Creative Direction', href: '/services/brand-strategy', desc: 'Identity, voice, and visual system', icon: 'gem' },
    { label: 'Film & Photo Production', href: '/services/film-photo', desc: 'Cinematic content for every channel', icon: 'camera' },
    { label: 'Social Content', href: '/services/social-content', desc: 'Scroll-stopping creative at scale', icon: 'grid' },
    { label: 'Social Media Management', href: '/services/social-management', desc: 'Always-on channel management', icon: 'chat' },
    { label: 'Paid Media Strategies', href: '/services/paid-media', desc: 'Campaigns that drive real revenue', icon: 'target' },
  ],
}

const rightGroups = [
  {
    label: 'Convert Demand',
    services: [
      { label: 'Google & Local SEO', href: '/services/google-seo', desc: 'Dominate local search and maps', icon: 'search' },
      { label: 'Reputation Management & Reviews', href: '/services/reputation', desc: 'Turn reviews into a growth engine', icon: 'star' },
      { label: 'Experiential & Collabs', href: '/services/experiential', desc: 'Events and partnerships that convert', icon: 'sparkle' },
    ],
  },
  {
    label: 'Retain Demand',
    services: [
      { label: 'Email & SMS Marketing', href: '/services/email-sms', desc: 'Direct channels that retain guests', icon: 'mail' },
      { label: 'CRM & Loyalty', href: '/services/crm-loyalty', desc: 'Systems that bring guests back', icon: 'users' },
    ],
  },
  {
    // Transversal layer — measures Generate, Convert and Retain (doc vs.md §2.3 / §6).
    label: 'Measure & Optimize',
    services: [
      { label: 'Analytics & Reporting', href: '/services/analytics', desc: 'One dashboard across every stage', icon: 'chart' },
    ],
  },
]

const otherLinks = [
  { label: 'Our Work', href: '/work' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
]

// ─── Service item ──────────────────────────────────────────────────────────────
function ServiceItem({
  svc,
  onClose,
  tone = 'dark',
}: {
  svc: { label: string; href: string; desc: string; icon: string }
  onClose: () => void
  /** The mobile panel stays dark; the desktop menu is light. */
  tone?: 'dark' | 'light'
}) {
  const light = tone === 'light'
  return (
    <TransitionLink
      href={svc.href}
      onClick={onClose}
      className={`flex gap-3 items-start px-2 py-2 -mx-2 rounded-lg transition-colors group ${light ? 'hover:bg-black/[0.04]' : 'hover:bg-white/5'}`}
      style={{ color: light ? 'var(--color-ink)' : 'var(--color-cream)' }}
    >
      <span
        className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-[color-mix(in_srgb,var(--color-lime)_18%,transparent)]"
        style={{
          background: light
            ? 'color-mix(in srgb, var(--stage-generate) 14%, transparent)'
            : 'color-mix(in srgb, var(--color-lime) 9%, transparent)',
          color: light ? 'var(--stage-retain)' : 'var(--color-lime)',
        }}
      >
        {icons[svc.icon]}
      </span>
      <span className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm leading-tight transition-opacity group-hover:opacity-70">
          {svc.label}
        </span>
        <span
          className="text-xs leading-tight"
          style={light ? { color: 'var(--color-muted)' } : { color: 'var(--color-cream)', opacity: 0.4 }}
        >
          {svc.desc}
        </span>
      </span>
    </TransitionLink>
  )
}

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
  const navTextColor = isLightHero ? 'var(--color-ink)' : 'var(--color-cream)'
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

        {otherLinks.map((link) => (
          <TransitionLink
            key={link.href}
            href={link.href}
            className="relative text-sm transition-opacity hover:opacity-70 after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-[var(--color-lime)] after:transition-all after:duration-300 hover:after:w-full"
            style={{ color: navTextColor }}
          >
            {link.label}
          </TransitionLink>
        ))}
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
            style={{ color: isLightHero ? 'var(--color-ink)' : 'var(--color-lime)' }}
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
        style={{ background: 'var(--color-ink)' }}
        role="menu"
      >
        <div className="flex flex-col gap-8 px-6 pt-8 pb-10">
          <div
            className="flex flex-col gap-4 pb-6 border-b"
            style={{ borderColor: 'var(--color-line-inverse)' }}
          >
            {otherLinks.map((link) => (
              <TransitionLink
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="text-lg "
                style={{ color: 'var(--color-cream)' }}
              >
                {link.label}
              </TransitionLink>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <p
              className="type-eyebrow mb-3"
              style={{ color: 'var(--color-lime)', opacity: 0.55 }}
            >
              {leftGroup.label}
            </p>
            {leftGroup.services.map((svc) => (
              <ServiceItem key={svc.href} svc={svc} onClose={closeMobile} />
            ))}
          </div>

          {rightGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1">
              <p
                className="type-eyebrow mb-3"
                style={{ color: 'var(--color-lime)', opacity: 0.55 }}
              >
                {group.label}
              </p>
              {group.services.map((svc) => (
                <ServiceItem key={svc.href} svc={svc} onClose={closeMobile} />
              ))}
            </div>
          ))}

          <Button href={CTA.primary.href} {...(CTA.primary.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} variant="primary" onClick={closeMobile} size="sm" className="w-full justify-center">
            {CTA.primary.label}
          </Button>
        </div>
      </div>
    </header>
  )
}
