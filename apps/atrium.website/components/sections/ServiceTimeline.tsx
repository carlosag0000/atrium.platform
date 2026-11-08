'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import type { TimelineStep } from '@/lib/services'
import E from '@/components/cms/Editable'

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
    <section className="bg-dark px-6 md:px-12 py-20 md:py-28">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 md:gap-24">
        <div className="md:w-80 flex-shrink-0 md:sticky md:top-[8rem] md:self-start">
          <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">
            Your plug-in brand team, <em className="font-serif italic">from kickoff to rollout.</em>
          </h2>
          <p className="mt-5 max-w-[22rem] text-base leading-relaxed text-cream/[0.66]">
            We work side-by-side with your team to shape, evolve, and scale your brand
            without the slowdowns of traditional agencies.
          </p>
        </div>
        <ol ref={listRef} className="flex-1 flex flex-col divide-y divide-cream/10">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="timeline-item flex gap-6 py-8 first:pt-0 last:pb-0"
              style={{ opacity: 0 }}
            >
              <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border border-cream/20 bg-cream/[0.12] text-xs text-lime">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex flex-col gap-1.5">
                <p className="m-0 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-cream">
                  <E>{step.title}</E>
                </p>
                <p className="m-0 text-[0.875rem] leading-relaxed text-cream/72">
                  <E>{step.body}</E>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
