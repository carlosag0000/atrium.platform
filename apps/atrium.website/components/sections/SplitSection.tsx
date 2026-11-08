'use client'
import { Eyebrow } from '@atrium/ui'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { OutlineCTA } from '@/components/ui/PillCTA'
import { gsap } from '@/lib/gsap'
import E from '@/components/cms/Editable'

type Props = {
  eyebrow?: string
  headline: ReactNode
  body: string
  cta: string
  ctaHref: string
  coverAlt: string
  bg?: string
  flip?: boolean
}

export default function SplitSection({ eyebrow, headline, body, cta, ctaHref, coverAlt, bg, flip = false }: Props) {
  const textRef = useRef<HTMLDivElement>(null)
  const visualRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!textRef.current || !visualRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(textRef.current,
        { x: flip ? 40 : -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: textRef.current as HTMLElement, start: 'top 80%', once: true },
        }
      )
      gsap.fromTo(visualRef.current,
        { x: flip ? -40 : 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
          scrollTrigger: { trigger: visualRef.current as HTMLElement, start: 'top 80%', once: true },
        }
      )
    })
    return () => ctx.revert()
  }, [flip])

  const isDark = bg === 'dark'
  // A caller may still pass an arbitrary CSS colour, so the ground stays a
  // style; everything drawn on top of it now comes from the design system.
  const bg_ = isDark ? 'var(--color-primary)' : (bg ?? 'var(--color-surface)')

  return (
    <section className="overflow-hidden px-[var(--gutter)] py-20 md:py-28" style={{ background: bg_ }}>
      <div
        className={`mx-auto flex max-w-[var(--container-max)] flex-col ${flip ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16 md:gap-24`}
      >
        <div className="flex max-w-lg flex-1 flex-col gap-6" ref={textRef} style={{ opacity: 0 }}>
          {eyebrow && <Eyebrow tone={isDark ? 'on-dark' : 'default'}><E>{eyebrow}</E></Eyebrow>}
          {/* Was .type-section-title, an older and larger scale than the rest
              of the site had moved to, which is why this section read as a
              different size from its neighbours. */}
          <h2
            className={`text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] ${isDark ? 'text-cream' : 'text-charcoal'}`}
          >
            <E>{headline}</E>
          </h2>
          <p className={`text-base leading-relaxed ${isDark ? 'text-cream/[0.78]' : 'text-body'}`}>
            <E>{body}</E>
          </p>
          <div className="mt-2">
            <OutlineCTA href={ctaHref} tone={isDark ? 'on-dark' : 'on-light'}>
              <E>{cta}</E>
            </OutlineCTA>
          </div>
        </div>
        <div className="w-full flex-1" ref={visualRef} style={{ opacity: 0 }}>
          <div
            className={`flex aspect-[4/3] items-center justify-center rounded-card p-10 text-center text-[0.875rem] ${
              isDark
                ? 'border border-cream/10 bg-cream/[0.06] text-cream/30'
                : 'border border-line bg-card text-muted'
            }`}
          >
            <span className="max-w-xs leading-relaxed">[{coverAlt}]</span>
          </div>
        </div>
      </div>
    </section>
  )
}
