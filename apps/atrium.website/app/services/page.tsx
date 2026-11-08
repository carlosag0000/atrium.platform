import { Eyebrow, NumberReel } from '@atrium/ui'
import type { Metadata } from 'next'
import CTABanner from '@/components/sections/CTABanner'
import { stages } from '@/components/sections/GrowthEngineDiagram'
import TransitionLink from '@/components/ui/TransitionLink'
import { CTA } from '@/lib/cta'
import { services } from '@/lib/services'
import E from '@/components/cms/Editable'

export const metadata: Metadata = {
  title: 'Services — Atrium',
  description: 'Full-stack hospitality marketing across brand, content, paid media, SEO, email, CRM, and analytics.',
  alternates: { canonical: '/services' },
}

const STATS = [
  { number: '11', label: 'Disciplines under one roof — strategy to analytics' },
  { number: '15+', label: 'Active hospitality brand partnerships' },
  { number: '28d', label: 'Engine cycle — first shoot to first report' },
]

export default function ServicesPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-dark px-[var(--gutter)]">
        <div className="mx-auto w-full max-w-[var(--container-max)]">
          <div className="max-w-3xl">
            <Eyebrow tone="on-dark" className="mb-6">HOSPITALITY MARKETING</Eyebrow>
            <h1 className="mb-6 text-[clamp(2.6rem,6vw,4.6rem)] font-normal leading-[1.02] tracking-[-0.02em] text-cream">
              One team. <em className="font-serif italic">Every stage of growth.</em>
            </h1>
            <p className="max-w-xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/[0.78]">
              The complete hospitality marketing engine — one team across all 11 disciplines, no handoffs, no briefing from scratch.
            </p>
          </div>
        </div>
      </section>

      {/* ── The Atrium Growth Engine — framing + the three engines as full-bleed columns ── */}
      <section className="bg-cream">
        <div className="px-[var(--gutter)] pt-24 pb-14 md:pt-36 md:pb-20">
          <div className="mx-auto max-w-[var(--container-max)]">
            <div className="grid gap-7 lg:grid-cols-12 lg:items-end lg:gap-16">
              <div className="lg:col-span-7">
                <Eyebrow className="mb-6">The Atrium Growth Engine</Eyebrow>
                <h2 className="max-w-[14ch] text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em]">
                  Not eleven services. <em className="font-serif italic">One system.</em>
                </h2>
              </div>
              <p className="max-w-lg border-t border-line pt-6 text-base leading-relaxed text-muted lg:col-span-5">
                The services are just the components. What you buy is the engine that runs
                them — on a 28-day cycle, measured end to end.
              </p>
            </div>

            <div className="mt-14 flex flex-col gap-1 border-t border-line pt-5 md:mt-20 md:flex-row md:items-baseline md:gap-6">
              <Eyebrow as="span" className="whitespace-nowrap">Brand Foundation</Eyebrow>
              <span className="text-[0.875rem] text-muted">
                Positioning, identity, and creative direction — everything the engine runs on.
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-1 border-t border-line pt-5 md:flex-row md:items-baseline md:gap-6">
              <Eyebrow as="span" className="flex items-center gap-1.5 whitespace-nowrap">
                <span aria-hidden>↺</span> Measure · Learn · Optimize
              </Eyebrow>
              <span className="text-[0.875rem] text-muted">
                POS attribution and monthly reporting feed the next 28-day cycle — every stage, measured.
              </span>
            </div>
          </div>
        </div>

        {/* Engines — full-bleed, one solid-color column per pillar */}
        <div className="grid min-h-screen grid-cols-1 md:grid-cols-3">
          {stages.map((stage) => {
            const category = `${stage.id} Demand`
            const catServices = services.filter(s => s.category === category)
            // Retain's stage colour is dark enough that ink text fails contrast —
            // every other stage colour is light enough that cream text would fail instead.
            const onDark = stage.id === 'Retain'
            return (
              <div
                key={stage.id}
                className={`flex flex-col gap-10 px-8 py-20 md:px-10 md:py-24 ${onDark ? 'text-cream' : 'text-charcoal'}`}
                style={{ background: stage.dot }}
              >
                <div>
                  <span className="text-[0.7rem] uppercase tracking-[0.14em]">
                    {category}
                  </span>
                  <p className="mt-4 text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed">
                    <E>{stage.tagline}</E>
                  </p>
                </div>

                <ul className="m-0 flex list-none flex-col p-0">
                  {catServices.map((svc) => (
                    <li key={svc.slug} className={`border-t ${onDark ? 'border-cream/20' : 'border-line'}`}>
                      <TransitionLink
                        href={`/services/${svc.slug}`}
                        className="group flex items-center justify-between gap-3 py-4 no-underline"
                      >
                        <span className="m-0 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15]">
                          <E>{svc.name}</E>
                        </span>
                        <span
                          aria-hidden="true"
                          className="flex-shrink-0 transition-transform duration-150 group-hover:translate-x-1"
                        >
                          →
                        </span>
                      </TransitionLink>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Stats — quick proof before CTA, 3 columns matching the engine split ── */}
      <section className="bg-cream px-6 py-20 md:px-16 md:py-28">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="max-w-2xl pb-14 md:pb-20">
            <Eyebrow>The full picture</Eyebrow>
            <h2 className="m-0 mt-5 text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em]">
              Eleven disciplines. <em className="font-serif italic">One engine.</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {STATS.map((stat, i) => (
              <div
                key={stat.number}
                className={`flex flex-col gap-4 py-8 md:py-0 ${i > 0 ? 'border-t border-line md:border-t-0 md:border-l md:pl-10' : ''}`}
              >
                <p className="m-0 flex font-serif text-[clamp(4rem,8vw,7rem)] font-normal leading-[0.85] tracking-[-0.03em] text-charcoal">
                  <NumberReel value={stat.number} />
                </p>
                <p className="m-0 max-w-xs text-base leading-relaxed text-muted">
                  <E>{stat.label}</E>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        eyebrow="JOIN 15+ HOSPITALITY BRANDS"
        headline={<>Been burned by an agency <em>before?</em></>}
        body="If you've outgrown freelancers, been let down by generic agencies, or just want a team that reports revenue instead of vanity — we were built for you. See the system before you commit."
        cta={CTA.primary.label}
        ctaHref={CTA.primary.href}
        ctaExternal={CTA.primary.external}
      />
    </>
  )
}
