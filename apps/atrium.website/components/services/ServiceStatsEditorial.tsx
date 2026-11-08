'use client'
import { Eyebrow, NumberReel } from '@atrium/ui'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import type { StatItem } from '@/lib/services'
import E from '@/components/cms/Editable'

type Props = {
  stats: StatItem[]
  eyebrow?: string
  headline?: ReactNode
}

export default function ServiceStatsEditorial({
  stats,
  eyebrow = 'The business case',
  headline = (
    <>
      Not more activity.<br />
      <em className="font-serif italic">More momentum.</em>
    </>
  ),
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        container.querySelectorAll('.metric-reveal'),
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: container, start: 'top 78%', once: true },
        }
      )
    }, container)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="relative bg-dark px-[var(--gutter)] py-24 md:py-36">
      <div className="relative mx-auto max-w-[var(--container-max)]">
        <div className="metric-reveal max-w-4xl pb-14 md:pb-20">
          <Eyebrow tone="on-dark"><E>{eyebrow}</E></Eyebrow>
          <h2 className="m-0 mt-5 text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">
            <E>{headline}</E>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-16 lg:gap-x-24">
          {stats.map(stat => (
            <article
              key={`${stat.number}-${stat.label}`}
              className="metric-reveal grid min-h-[15rem] grid-cols-1 items-center gap-7 border-t border-cream/20 py-10 md:min-h-[17rem] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8 md:py-12"
            >
              <p className="stat-number m-0 flex font-serif text-[clamp(5rem,13vw,11.5rem)] font-normal leading-none tracking-[-0.02em] text-cream md:order-2 md:justify-end md:text-[clamp(4.5rem,7.5vw,8.5rem)]">
                <NumberReel value={stat.number} />
              </p>
              <div className="md:order-1">
                <p className="stat-label m-0 max-w-sm text-base leading-relaxed text-cream/70">
                  <E>{stat.label}</E>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
