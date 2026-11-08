'use client'
import { Eyebrow } from '@atrium/ui'
import { useEffect, useRef } from 'react'
import { OutlineCTA } from '@/components/ui/PillCTA'
import CasePanel from '@/components/work/CasePanel'
import { gsap } from '@/lib/gsap'
import type { CaseStudy } from '@/lib/work'
import E from '@/components/cms/Editable'

export type Project = {
  study: CaseStudy
  result: string
}

export default function WorkGrid({ projects }: { projects: Project[] }) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!trackRef.current) return
    const cards = trackRef.current.querySelectorAll('.work-panel')
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cards,
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: { trigger: trackRef.current, start: 'top 85%', once: true },
        },
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="bg-cream px-[var(--gutter)] py-20 md:py-28">
      <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
        <Eyebrow className="mb-3"><E>Selected Work</E></Eyebrow>
        <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em]">
          <E>See what changed. <em className="font-serif italic">Not just what shipped.</em></E>
        </h2>
        <div className="mt-10 flex justify-center">
          <E><OutlineCTA href="/work">See all work</OutlineCTA></E>
        </div>
      </div>

      {/* One row either way. On desktop the cards divide the container, so the
          whole set is in view at once. On a phone a 9:16 card that fits five
          across would be a thumbnail, so the row keeps its width and scrolls
          sideways — the gesture is already natural there. */}
      <div className="mx-auto max-w-[var(--container-max)]">
        <div
          className="-mx-[var(--gutter)] flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] pb-2 md:mx-0 md:snap-none md:overflow-visible md:px-0 md:pb-0"
          ref={trackRef}
        >
          {projects.map((project) => (
            <div
              className="work-panel w-[64vw] flex-shrink-0 snap-start opacity-0 sm:w-[40vw] md:w-auto md:min-w-0 md:flex-1 md:flex-shrink"
              key={project.study.slug}
            >
              <CasePanel study={project.study} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
