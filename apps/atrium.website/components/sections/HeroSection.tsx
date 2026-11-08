'use client'
import { Eyebrow } from '@atrium/ui'
import { useEffect, useRef } from 'react'
import HeroPerspectiveGallery from '@/components/sections/HeroPerspectiveGallery'
import { OutlineCTA, PillCTA } from '@/components/ui/PillCTA'
import { CTA } from '@/lib/cta'
import { gsap } from '@/lib/gsap'
import { heroGalleryTiles } from '@/lib/work'
import E from '@/components/cms/Editable'

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!textRef.current) return
    const ctx = gsap.context(() => {
      gsap.from(Array.from(textRef.current?.children ?? []), {
        y: 32, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out', delay: 0.2,
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      // Deliberately short of the viewport: the next section shows below the
      // fold, so the page reads as continuing rather than ending here.
      className="@container atr-hero-bloom relative flex min-h-[78vh] overflow-hidden pt-14 lg:h-[78vh]"
    >
      {/* Above the grain layer, which the bloom paints at z-0. */}
      <div className="relative z-10 flex w-full flex-1 flex-col lg:flex-row">
        {/* The copy column is half the viewport, so it cannot inherit the
            page's centred container. Instead it reproduces where that
            container's left edge lands — (100% - container-max) / 2 once the
            page is wider than the container, and the plain gutter below that —
            so the hero starts on the same line as every section under it. The
            width unit is 100cqw off the section, not 100vw, because vw counts
            the scrollbar and would push it ~8px right of everything else. */}
        <div className="flex flex-1 flex-col justify-center py-20 lg:w-1/2">
          <div
            className="w-full pr-[var(--gutter)] pl-[max(var(--gutter),calc((100cqw-var(--container-max))/2))]"
            ref={textRef}
          >
            <Eyebrow className="mb-6" tone="on-dark">
              <E>The hospitality-only growth team</E>
            </Eyebrow>

            <h1 className="mb-6 text-[clamp(2.6rem,6vw,4.6rem)] font-normal leading-[1.02] tracking-[-0.02em] text-cream">
              <E>
                You handle the experience.
                <br />
                <em className="font-serif italic">We take care of the rest.</em>
              </E>
            </h1>

            {/* Kept as a paragraph rather than an h2: it reads as a heading but
                it is a description, and an h2 here would put a sentence into
                the document outline. */}
            <p className="mb-10 max-w-xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/[0.78]">
              <E>
                A full marketing agency for restaurants and hospitality. Discoverability, acquisition, retention, growth.
              </E>
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <OutlineCTA href={CTA.proof.href} tone="on-dark">
                {CTA.proof.label}
              </OutlineCTA>
              <PillCTA external href={CTA.primary.href} tone="on-dark">
                {CTA.primary.label}
              </PillCTA>
            </div>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2">
          <HeroPerspectiveGallery tiles={heroGalleryTiles} />
        </div>
      </div>
    </section>
  )
}
