'use client'
import { Eyebrow } from '@atrium/ui'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import TransitionButton from '@/components/ui/TransitionButton'
import { gsap } from '@/lib/gsap'

export type ProcessStep = { eyebrow: string; title: string; body: string }

type Props = {
  eyebrow?: string
  headline: ReactNode
  body: string
  /** Optional: the section stands on its own steps without a button, which
   *  is how the home page uses it. */
  cta?: string
  ctaHref?: string
  steps: ProcessStep[]
}

// The section that explains the engine, set as a chapter break rather than as
// three cards. It runs dark between two cream neighbours, which is the rhythm
// the case studies already use for their story band, and the steps run left to
// right along a rule with a lit node on each one — the shape of a cycle, which
// is the thing being described. What was here before was a UI kit's step list:
// white panels, drop shadows and mint chips, none of it in the site's language.
export default function DarkProcess({ eyebrow, headline, body, cta, ctaHref, steps }: Props) {
  const stepsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stepsRef.current) return
    const stepEls = stepsRef.current.querySelectorAll('.process-step')
    const ctx = gsap.context(() => {
      // Left to right, in sequence: the stagger is the point — it reads as the
      // cycle advancing rather than as three things fading in together.
      gsap.fromTo(
        stepEls,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.18,
          ease: 'power2.out',
          scrollTrigger: { trigger: stepsRef.current, start: 'top 75%', once: true },
        },
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="bg-dark px-[var(--gutter)] py-24 md:py-32">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
          <div className="lg:col-span-7">
            {eyebrow && (
              <Eyebrow className="mb-6" tone="on-dark">
                {eyebrow}
              </Eyebrow>
            )}
            <h2 className="max-w-[16ch] text-[clamp(2.6rem,4.5vw,4rem)] leading-[1.08] text-cream">
              {headline}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="m-0 max-w-md text-base leading-relaxed text-cream/[0.72]">{body}</p>
            {cta && ctaHref && (
              <div className="mt-6">
                <TransitionButton href={ctaHref} variant="outline">
                  {cta}
                </TransitionButton>
              </div>
            )}
          </div>
        </div>

        <div ref={stepsRef} className="mt-16 grid gap-12 md:mt-24 md:grid-cols-3 md:gap-10">
          {steps.map((step, i) => (
            <article className="process-step opacity-0" key={step.title}>
              {/* The node and the rule that carries it. The rule runs to the
                  edge of the column, so on a three-up row the three of them
                  read as one line with three stops — and on a phone, where the
                  columns stack, each step keeps its own mark. */}
              <div aria-hidden="true" className="flex items-center gap-4">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: 'var(--color-lime)' }}
                />
                <span className="h-px flex-1 bg-cream/20" />
              </div>

              <p
                className="m-0 mt-6 font-serif text-[clamp(2.4rem,4vw,3.2rem)] leading-none tracking-[-0.03em]"
                style={{ color: 'var(--color-lime)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </p>

              <Eyebrow as="p" className="mt-6" tone="on-dark">
                {step.eyebrow}
              </Eyebrow>
              <h3 className="mt-4 max-w-[16ch] text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-cream">
                {step.title}
              </h3>
              <p className="m-0 mt-4 max-w-sm text-base leading-relaxed text-cream/[0.7]">{step.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
