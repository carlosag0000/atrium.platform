'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import type { TimelineStep } from '@/lib/services'

type Props = { steps: TimelineStep[] }

export default function ServiceTimeline({ steps }: Props) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll('.timeline-item')
    const ctx = gsap.context(() => {
      gsap.fromTo(items,
        { x: -32, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: { trigger: listRef.current, start: 'top 78%', once: true },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    // Same gutter and container as every other section on the page — this one
    // used to run in a narrower max-w-6xl, so its left edge fell out of line
    // with the sections above and below it.
    <section className="bg-dark px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 gap-12 md:grid-cols-[minmax(0,0.68fr)_minmax(25rem,1fr)] md:gap-x-16 lg:gap-x-24">
        <div className="md:sticky md:top-[8rem] md:self-start">
          <h2 className="m-0 type-subsection-title text-cream">
            Your plug-in brand team, <em className="font-serif italic">from kickoff to rollout.</em>
          </h2>
          <p className="mt-5 max-w-[22rem] text-base leading-relaxed text-cream/[0.66]">
            We work side-by-side with your team to shape, evolve, and scale your brand
            without the slowdowns of traditional agencies.
          </p>
        </div>
        {/* The step copy keeps its own measure: the container is wide, and a
            line that runs its full width is unreadable. */}
        <ol ref={listRef} className="flex flex-col divide-y divide-cream/10">
          {steps.map((step, i) => (
            <li
              key={step.title}
              // No inline opacity: GSAP's fromTo sets the hidden state itself,
              // so the steps stay readable if the animation never runs.
              className="timeline-item flex gap-6 py-9 first:pt-0 last:pb-0 md:py-10"
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border border-cream/20 bg-cream/[0.12] text-xs text-lime">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex max-w-[46rem] flex-col gap-1.5">
                <p className="m-0 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-cream">
                  {step.title}
                </p>
                <p className="m-0 text-[0.875rem] leading-relaxed text-cream/72">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
