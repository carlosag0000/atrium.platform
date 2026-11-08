'use client'
import { Eyebrow, NumberReel } from '@atrium/ui'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import E from '@/components/cms/Editable'

export type Stat = { number: string; label: string }

type Props = { stats: Stat[] }

export default function StatsStrip({ stats }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current?.querySelectorAll('.metric-reveal') ?? [],
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: containerRef.current, start: 'top 78%', once: true },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="bg-dark px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="metric-reveal max-w-4xl pb-14 md:pb-20">
          <Eyebrow tone="on-dark"><E>Why the system matters</E></Eyebrow>
          <h2 className="m-0 mt-5 text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">
            <E>The first visit is expensive.<br />
            <em className="font-serif italic">The next one should not be.</em></E>
          </h2>
        </div>

        {/* All three across on desktop. In a third of the width there is no
            room to set the number beside its label, so the pair stacks and the
            numbers line up as one row of figures. */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-x-12 lg:gap-x-16">
          {stats.map(stat => (
            <article
              key={`${stat.number}-${stat.label}`}
              className="metric-reveal flex min-h-[15rem] flex-col justify-between gap-7 border-t border-cream/20 py-10 md:min-h-[17rem] md:py-12"
            >
              <p className="stat-number m-0 flex font-serif text-[clamp(5rem,13vw,11.5rem)] font-normal leading-none tracking-[-0.02em] text-cream md:text-[clamp(4rem,6vw,7rem)]">
                <NumberReel value={stat.number} />
              </p>
              <p className="stat-label m-0 max-w-sm text-base leading-relaxed text-cream/70">
                <E>{stat.label}</E>
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
