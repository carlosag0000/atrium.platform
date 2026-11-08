'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import type { TimelineStep } from '@/lib/services'
import E from '@/components/cms/Editable'

export default function ServiceTimelineEditorial({ steps }: { steps: TimelineStep[] }) {
  const listRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const ctx = gsap.context(() => {
      const items = list.querySelectorAll('.tl-step')
      for (const el of items) {
        const num = el.querySelector('.tl-num')
        const content = el.querySelector('.tl-content')
        const line = el.querySelector('.tl-line')

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el as HTMLElement,
            start: 'top 80%',
            once: true,
          },
        })

        if (num) {
          tl.fromTo(num, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' })
        }
        if (line) {
          tl.fromTo(line, { scaleY: 0 }, { scaleY: 1, duration: 0.4, ease: 'power2.out' }, '-=0.3')
        }
        if (content) {
          tl.fromTo(content, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2')
        }
      }
    }, list)
    return () => ctx.revert()
  }, [])

  return (
    <section
      className="px-[var(--gutter)] pt-[6rem] pb-[8rem] max-sm:px-[var(--gutter)]"
      style={{ background: 'var(--cloud-100)' }}
    >
      <div className="grid md:grid-cols-[minmax(0,0.68fr)_minmax(25rem,1fr)] gap-[5rem] max-w-[var(--container-max)] mx-auto max-md:grid-cols-1 max-md:gap-[2.5rem]">
        <div className="md:sticky md:top-[50vh] md:self-start">
          <h2
            className="type-section-title m-0 mb-[1.2rem]"
            style={{ color: 'var(--text-strong)' }}
          >
            <E>Your plug-in brand team, <em>from kickoff to rollout.</em></E>
          </h2>
          <p
            className="type-body m-0 max-w-[22rem]"
            style={{ color: 'var(--text-muted)' }}
          >
            <E>We work side-by-side with your team to shape, evolve, and scale your brand
            without the slowdowns of traditional agencies.</E>
          </p>
        </div>

        <ol
          ref={listRef}
          className="relative grid gap-[6.5rem] list-none m-0 p-0 max-sm:gap-[3.5rem]"
          style={{ counterReset: 'step' }}
        >
          <div
            className="absolute top-[0.8rem] bottom-[0.8rem] w-[1px] max-sm:left-[1.6rem]"
            style={{ left: '2.8rem', background: 'var(--mint-400)' }}
            aria-hidden
          />
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="tl-step relative grid gap-[2.2rem] max-sm:gap-[1.2rem]"
              style={{ gridTemplateColumns: '5.6rem minmax(0,1fr)' }}
            >
              <div className="relative flex flex-col items-center">
                <span
                  className="tl-num relative z-1 grid place-items-center w-[5.6rem] h-[5.6rem] rounded-full border-2 text-[2.2rem] italic leading-[1] max-sm:w-[3.6rem] max-sm:h-[3.6rem] max-sm:text-[1.5rem]"
                  style={{
                    borderColor: 'var(--mint-400)',
                    background: 'var(--cloud-100)',
                    color: 'var(--teal-800)',
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="tl-content">
                <h3
                  className="type-card-title m-0 mb-[0.55rem]"
                  style={{ color: 'var(--text-strong)' }}
                >
                  <E>{step.title}</E>
                </h3>
                <p
                  className="type-body m-0 max-w-[32rem]"
                  style={{ color: 'var(--text-muted)' }}
                >
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
