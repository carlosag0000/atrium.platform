import type { Metadata } from 'next'
import Link from 'next/link'
import CTABanner from '@/components/sections/CTABanner'
import PurchaseFAQ from '@/components/sections/PurchaseFAQ'
import Eyebrow from '@/components/ui/Eyebrow'
import { CAL_LINKS } from '@/lib/cal'
import { CTA } from '@/lib/cta'
import E from '@/components/cms/Editable'

export const metadata: Metadata = {
  title: 'Atrium Pricing — Hospitality Marketing Engagement Models',
  description: 'Custom Atrium engagement models for hospitality marketing: Foundation, Growth, and Full System — built around what your business actually needs.',
  alternates: { canonical: '/pricing' },
}

const tiers = [
  {
    name: 'Foundation',
    tagline: 'Strategy, content, social. The essentials.',
    fit: 'Best for restaurants that need consistency and a stronger local presence.',
    includes: ['Brand strategy', 'Monthly content production', 'Social management', 'Google optimization', 'Monthly reporting'],
    calLink: CAL_LINKS.foundation,
  },
  {
    name: 'Growth',
    tagline: 'Paid, email, SMS, reputation. Ready to scale.',
    fit: 'Best for operators with proven demand who want more channels working together.',
    includes: ['Everything in Foundation', 'Email & SMS', 'Paid media', 'Reputation management', 'CRM setup'],
    calLink: CAL_LINKS.growth,
  },
  {
    name: 'Full System',
    tagline: 'Everything. Dashboard, automations, dedicated team.',
    fit: 'Best for multi-location brands or high-growth concepts that need a complete engine.',
    includes: ['Everything in Growth', 'Custom dashboard', 'Advanced automations', 'Dedicated strategy team', 'Multi-location support'],
    calLink: CAL_LINKS.fullSystem,
  },
]

const scopePrinciples = [
  {
    title: 'Scope first',
    body: 'We confirm location count, channel gaps, production needs, and internal capacity before recommending a model.',
  },
  {
    title: 'A monthly operating rhythm',
    body: 'The cadence is built around content production, campaign launches, reporting, and continuous optimization.',
  },
  {
    title: 'No generic bundle',
    body: 'A coffee shop, a fine-dining concept, and a multi-location group should not buy the same marketing package.',
  },
]

function TierServices({ services, index, highlighted = false }: { services: string[]; index: number; highlighted?: boolean }) {
  return (
    <ul className="m-0 list-none p-0" aria-label={`Services included in model ${index + 1}`}>
      {services.map(service => (
        <li
          key={service}
          className="type-caption border-t py-3"
          style={{
            borderColor: highlighted ? 'rgba(181,242,219,0.22)' : 'rgba(7,47,52,0.14)',
            color: highlighted ? 'var(--text-on-dark)' : 'var(--text-muted)',
            opacity: highlighted ? 0.76 : 1,
          }}
        >
          {service}
        </li>
      ))}
    </ul>
  )
}

function PricingOffers() {
  return (
    <section className="px-[var(--gutter)] pb-24 pt-36 md:pb-36 md:pt-44" style={{ background: 'var(--surface-page)' }}>
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mb-14 grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16 md:mb-20">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-6"><E>Pricing</E></Eyebrow>
            <h1 className="type-section-title max-w-[13ch]">
              <E>Three ways to build the <em>right operating system.</em></E>
            </h1>
          </div>
          <div className="border-t pt-7 lg:col-span-5" style={{ borderColor: 'rgba(7,47,52,0.18)' }}>
            <p className="type-body m-0 max-w-md" style={{ color: 'var(--text-muted)' }}>
              <E>Compare the operating level first. We adapt the final scope to your locations, production volume, active channels, and internal team.</E>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 border-y lg:grid-cols-3" style={{ borderColor: 'rgba(7,47,52,0.18)' }}>
          {tiers.map((tier, index) => (
            <article
              key={tier.name}
              id={tier.name.toLowerCase().replaceAll(' ', '-')}
              className={`flex min-h-[42rem] flex-col border-t px-0 py-10 first:border-t-0 lg:border-t-0 lg:px-8 lg:py-12 first:lg:pl-0 last:lg:pr-0 ${index > 0 ? 'lg:border-l' : ''}`}
              style={{
                background: index === 1 ? 'var(--teal-800)' : 'transparent',
                color: index === 1 ? 'var(--text-on-dark)' : 'var(--text-strong)',
                borderColor: 'rgba(7,47,52,0.18)',
                scrollMarginTop: '8rem',
              }}
            >
              <div className={index === 1 ? 'px-6 lg:px-0' : ''}>
                <p className="type-eyebrow m-0 mb-6" style={{ color: index === 1 ? 'var(--mint-400)' : 'var(--teal-500)' }}>
                  Model {String(index + 1).padStart(2, '0')}
                </p>
                <h2 className="type-card-title" style={{ color: index === 1 ? 'var(--text-on-dark)' : 'var(--text-strong)' }}>
                  <E>{tier.name}</E>
                </h2>
                <p className="type-lead mt-6" style={{ color: index === 1 ? 'var(--text-on-dark)' : 'var(--text-body)' }}>
                  <E>{tier.tagline}</E>
                </p>
                <p className="type-body mt-5" style={{ color: index === 1 ? 'var(--text-on-dark)' : 'var(--text-muted)', opacity: index === 1 ? 0.68 : 1 }}>
                  {tier.fit}
                </p>
              </div>

              <div className={`mt-12 ${index === 1 ? 'px-6 lg:px-0' : ''}`}>
                <p className="type-eyebrow m-0 mb-5" style={{ color: index === 1 ? 'var(--mint-400)' : 'var(--teal-500)' }}>
                  <E>Included</E>
                </p>
                <TierServices services={tier.includes} index={index} highlighted={index === 1} />
              </div>

              <div className={`mt-auto pt-10 ${index === 1 ? 'px-6 lg:px-0' : ''}`}>
                <p className="type-caption m-0 " style={{ color: index === 1 ? 'var(--mint-400)' : 'var(--teal-800)' }}>
                  <E>Custom pricing after discovery</E>
                </p>
                <Link
                  href={CTA.primary.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="type-caption group mt-6 inline-flex items-center gap-3 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  style={{ color: index === 1 ? 'var(--text-on-dark)' : 'var(--teal-800)' }}
                >
                  Request this scope
                  <span className="transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ScopeSection() {
  return (
    <section className="px-[var(--gutter)] py-24 md:py-36" style={{ background: 'var(--teal-900)', color: 'var(--text-on-dark)' }}>
      <div className="mx-auto grid max-w-[var(--container-max)] gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow tone="onDark" className="mb-6"><E>How scope works</E></Eyebrow>
          <h2 className="type-section-title max-w-[11ch]">
            <E>The number follows <em>the diagnosis.</em></E>
          </h2>
          <p className="type-body mt-7 max-w-md" style={{ opacity: 0.68 }}>
            <E>We recommend the smallest complete system capable of solving the actual operating problem.</E>
          </p>
        </div>

        <div className="border-t lg:col-span-7" style={{ borderColor: 'rgba(181,242,219,0.22)' }}>
          {scopePrinciples.map((principle, index) => (
            <article
              key={principle.title}
              className="grid gap-6 border-b py-10 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-8 md:py-12"
              style={{ borderColor: 'rgba(181,242,219,0.22)' }}
            >
              <p className="type-eyebrow m-0" style={{ color: 'var(--mint-400)' }}>
                {String(index + 1).padStart(2, '0')}
              </p>
              <div>
                <h3 className="type-card-title" style={{ color: 'var(--text-on-dark)' }}>
                  <E>{principle.title}</E>
                </h3>
                <p className="type-body mt-5 max-w-2xl" style={{ color: 'var(--text-on-dark)', opacity: 0.68 }}>
                  <E>{principle.body}</E>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function PricingPage() {
  return (
    <>
      <PricingOffers />
      <ScopeSection />
      <PurchaseFAQ />

      <CTABanner
        eyebrow="SCOPE THE WORK"
        headline={<>The right number comes <em>after the right diagnosis.</em></>}
        body="Tell us what you are trying to grow, what channels are already active, and what has stopped working. We will map the practical scope."
        cta={CTA.primary.label}
        ctaHref={CTA.primary.href}
        ctaExternal={CTA.primary.external}
      />
    </>
  )
}
