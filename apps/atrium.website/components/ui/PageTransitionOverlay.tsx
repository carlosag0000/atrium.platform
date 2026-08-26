'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { usePageTransition } from './PageTransitionProvider'

const COVER_DURATION = 0.5
const REVEAL_DURATION = 0.45

export default function PageTransitionOverlay() {
  const { phase, origin, onCoverComplete, onRevealComplete } = usePageTransition()
  const elRef = useRef<HTMLDivElement>(null)
  const tweenRef = useRef<gsap.core.Tween | null>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el) return
    const maxRadius = Math.hypot(window.innerWidth, window.innerHeight)

    tweenRef.current?.kill()

    if (phase === 'covering') {
      el.style.setProperty('--x', `${origin.x}px`)
      el.style.setProperty('--y', `${origin.y}px`)
      const tween = { r: 0 }
      tweenRef.current = gsap.to(tween, {
        r: maxRadius,
        duration: COVER_DURATION,
        ease: 'power2.inOut',
        onUpdate: () => el.style.setProperty('--r', `${tween.r}px`),
        onComplete: onCoverComplete,
      })
    }

    if (phase === 'revealing') {
      const tween = { r: maxRadius }
      tweenRef.current = gsap.to(tween, {
        r: 0,
        duration: REVEAL_DURATION,
        ease: 'power2.inOut',
        onUpdate: () => el.style.setProperty('--r', `${tween.r}px`),
        onComplete: onRevealComplete,
      })
    }

    // Landing on `idle` with a tween still killed above (e.g. the provider's
    // safety-timeout force-reset an animation that never resolved) — snap the
    // overlay fully open instead of leaving it frozen mid-coverage.
    if (phase === 'idle') {
      el.style.setProperty('--r', '0px')
    }

    return () => {
      tweenRef.current?.kill()
    }
  }, [phase, origin, onCoverComplete, onRevealComplete])

  const isActive = phase !== 'idle'

  return (
    <div
      ref={elRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'var(--color-ink)',
        clipPath: 'circle(var(--r, 0px) at var(--x, 50%) var(--y, 50%))',
        pointerEvents: isActive ? 'auto' : 'none',
      }}
    />
  )
}
