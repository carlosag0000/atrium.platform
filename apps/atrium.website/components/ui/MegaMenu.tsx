'use client'

import {
  ArrowUpRight,
  Clapperboard,
  Compass,
  HeartHandshake,
  LineChart,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { STAGES } from '@/components/services/utils'
import { services } from '@/lib/services'
import TransitionLink from './TransitionLink'

const MENU_ICONS: Record<string, typeof Compass> = {
  Clapperboard,
  Compass,
  HeartHandshake,
  LineChart,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  Target,
  Users,
}

// Each stage heading is a filled pill in the stage's own fill, paired with the
// ink that clears contrast against it. Both come from the single stage table in
// components/services/utils.tsx — see the note there on why the pill fill is
// not the stage accent.
const menuColumns = Object.entries(STAGES).map(([category, stage]) => ({
  category,
  pillClass: stage.pillFill,
  services: services.filter((svc) => svc.category === category),
}))

/** The full-bleed services menu, kept as its own component so it can run beside
 *  the Navbar's existing dropdown while the two are compared. It owns its
 *  state and its own trigger; the Navbar only places it. */
export default function MegaMenu({
  label = 'Menu test',
  textColor,
}: {
  label?: string
  /** Matches the Navbar's own links, which recolour with the header. */
  textColor?: string
}) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const close = () => setOpen(false)

  // A small delay on leave, so crossing the gap between trigger and panel
  // doesn't shut it.
  const onEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const onLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      triggerRef.current?.focus()
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
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
        aria-controls="mega-menu-test"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md text-sm transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-green-fill)]"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        style={textColor ? { color: textColor } : undefined}
        type="button"
      >
        {label}
        <span
          aria-hidden="true"
          className={`text-[0.7rem] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          ▾
        </span>
      </button>

      {/* Scrim. Same treatment as the Navbar's own menu: it sits behind the
          header on -z-10 and closes on enter, so leaving the panel in any
          direction dismisses it. */}
      <div
        aria-hidden="true"
        className={`-z-10 fixed inset-0 transition-opacity duration-300 ease-out ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onMouseEnter={close}
        style={{
          background: 'color-mix(in srgb, var(--color-ink) 32%, transparent)',
          backdropFilter: 'blur(var(--blur-md))',
          WebkitBackdropFilter: 'blur(var(--blur-md))',
        }}
      />

      {/* Full-bleed panel. It is a child of the fixed header, so left/right-0
          spans the viewport rather than this trigger. */}
      <div
        aria-label="Services"
        className={`absolute right-0 left-0 top-full transition-all duration-200 ease-out ${
          open
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : '-translate-y-2 pointer-events-none opacity-0'
        }`}
        id="mega-menu-test"
        ref={panelRef}
        role="menu"
      >
        <div className="border-line border-b bg-cream shadow-float">
          <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-3 gap-10 px-[var(--gutter)] py-12">
            {menuColumns.map((column) => (
              <div className="flex flex-col" key={column.category}>
                <TransitionLink
                  className={`group mb-6 inline-flex w-fit items-center gap-2 self-start rounded-full px-4 py-2 no-underline transition-opacity duration-200 hover:opacity-90 ${column.pillClass}`}
                  href="/services"
                  onClick={close}
                  role="menuitem"
                >
                  <span className="font-serif text-[1.4rem] leading-none transition-transform duration-200 group-hover:translate-x-0.5">
                    {column.category}
                  </span>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 opacity-70" strokeWidth={1.75} />
                </TransitionLink>

                <div className="flex flex-col divide-y divide-line">
                  {column.services.map((svc) => {
                    const Icon = MENU_ICONS[svc.menu.icon]
                    return (
                      <TransitionLink
                        className="group relative flex items-center gap-4 py-3.5 pl-5 no-underline"
                        href={`/services/${svc.slug}`}
                        key={svc.slug}
                        onClick={close}
                        role="menuitem"
                      >
                        <span
                          aria-hidden="true"
                          className="-translate-y-1/2 absolute top-1/2 left-0 h-1.5 w-1.5 rounded-full bg-green opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        />
                        <span className="flex min-w-0 flex-1 flex-col gap-1 transition-transform duration-200 group-hover:translate-x-1">
                          <span className="text-charcoal text-sm leading-tight">
                            {svc.name}
                          </span>
                          <span className="text-muted text-xs leading-snug">{svc.menu.blurb}</span>
                        </span>
                        {Icon && (
                          <Icon
                            aria-hidden="true"
                            className="h-4 w-4 flex-shrink-0 text-muted"
                            strokeWidth={1.5}
                          />
                        )}
                      </TransitionLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
