import type { Metadata } from 'next'
import Link from 'next/link'
import CTABanner from '@/components/sections/CTABanner'
import Eyebrow from '@/components/ui/Eyebrow'
import { CTA } from '@/lib/cta'
import E from '@/components/cms/Editable'

export const metadata: Metadata = {
  title: 'About Atrium — Hospitality Marketing Studio, Houston TX',
  description: 'Atrium is a hospitality-native marketing studio based in Houston, TX, built for restaurants and hotels.',
  alternates: { canonical: '/about' },
}

const principles = [
  {
    title: 'Hospitality-native',
    body: 'Restaurants, hotels, and food brands are not a vertical for us. They are the only context we build for.',
  },
  {
    title: 'Creative with a job',
    body: 'A campaign has to look right, but it also has to move reservations, repeat visits, reviews, and revenue signals.',
  },
  {
    title: 'One team, one system',
    body: 'Strategy, production, content, paid media, CRM, and reporting sit close together so operators do not manage agency handoffs.',
  },
]

const teamCards = [
  {
    label: 'Creative Director & Founder',
    title: 'Carlos',
    body: 'Inside the kitchens, on the shoots, and behind the dashboards for 15+ hospitality brands across Houston and beyond.',
    background: 'var(--mint-400)',
    text: 'var(--teal-900)',
  },
  {
    label: 'Marketing Coordination',
    title: 'Litzabel',
    body: 'Keeps campaigns moving across calendars, approvals, content delivery, and the details that make the system feel calm.',
    background: 'var(--amber-500)',
    text: 'var(--teal-900)',
  },
  {
    label: 'Production Hub',
    title: 'Houston production team',
    body: 'A dedicated creative crew built for on-location shoots, edits, campaign assets, and monthly execution rhythm.',
    background: 'var(--teal-700)',
    text: 'var(--mint-300)',
  },
]

function AboutHero() {
  return (
    <section className="px-[var(--gutter)] pb-24 pt-36 md:pb-32 md:pt-48" style={{ background: 'var(--surface-page)' }}>
      <div className="mx-auto max-w-[var(--container-max)]">
        <Eyebrow className="mb-8">About Atrium</Eyebrow>

        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-16">
          <h1 className="type-page-title max-w-[11ch] lg:col-span-8" style={{ color: 'var(--text-strong)' }}>
            Hospitality is not our vertical. <em>It is the work.</em>
          </h1>

          <div className="border-t pt-7 lg:col-span-4" style={{ borderColor: 'rgba(7,47,52,0.18)' }}>
            <p className="type-lead" style={{ color: 'var(--text-body)' }}>
              Atrium works inside the industry, connecting strategy, creative production, and performance reporting under one roof.
            </p>
            <Link
              href={CTA.primary.href}
              target="_blank"
              rel="noopener noreferrer"
              className="type-caption group mt-9 inline-flex items-center gap-3 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
              style={{ color: 'var(--teal-800)' }}
            >
              Start a project
              <span className="transition-transform duration-300 group-hover:translate-x-2" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap gap-x-3 gap-y-2 border-t pt-6 md:mt-24" style={{ borderColor: 'rgba(7,47,52,0.18)' }}>
          {['Hospitality strategy', 'Creative production', 'Growth systems'].map((discipline, index) => (
            <p key={discipline} className="type-caption m-0 flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {discipline}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

function StudioStory() {
  return (
    <section className="px-[var(--gutter)] py-24 md:py-36" style={{ background: 'var(--surface-page)' }}>
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch lg:gap-16">
        <div
          className="aspect-[4/3] min-h-[25rem] rounded-[var(--radius-bento)] lg:col-span-7 lg:aspect-auto lg:min-h-[38rem]"
          style={{ background: 'var(--teal-800)' }}
          role="img"
          aria-label="Atrium team working inside a hospitality business"
        />

        <div className="flex h-full flex-col justify-between gap-16 border-t pt-8 lg:col-span-5" style={{ borderColor: 'rgba(7,47,52,0.18)' }}>
          <div>
            <Eyebrow className="mb-6">Inside the industry</Eyebrow>
            <h2 className="type-section-title">
              Built from the floor, <em>not the sidelines.</em>
            </h2>
          </div>

          <div>
            <p className="type-lead" style={{ color: 'var(--text-body)' }}>
              We work close enough to service, production, and performance data to understand what hospitality teams actually need.
            </p>
            <p className="type-body mt-6" style={{ color: 'var(--text-muted)' }}>
              Atrium connects strategy and production under one roof in Houston, Texas. The same people who shape the campaign stay close to the work after it goes live.
            </p>
            <ul className="m-0 mt-8 flex list-none flex-wrap gap-x-3 gap-y-1 border-t p-0 pt-6" style={{ borderColor: 'rgba(7,47,52,0.14)' }}>
              {['Houston', 'United States'].map((location, index) => (
                <li key={location} className="type-caption flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {location}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

function PrinciplesSection() {
  return (
    <section className="px-[var(--gutter)] py-24 md:py-36" style={{ background: 'var(--cloud-100)' }}>
      <div className="mx-auto grid max-w-[var(--container-max)] gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <Eyebrow className="mb-6">Operating principles</Eyebrow>
          <h2 className="type-section-title max-w-[10ch]">
            Built for the rhythm of <em>restaurants.</em>
          </h2>
        </div>

        <div className="border-t lg:col-span-8" style={{ borderColor: 'rgba(7,47,52,0.18)' }}>
          {principles.map((item, index) => (
            <article
              key={item.title}
              className="grid gap-6 border-b py-10 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-8 md:py-12"
              style={{ borderColor: 'rgba(7,47,52,0.18)' }}
            >
              <p className="type-eyebrow m-0" style={{ color: 'var(--teal-500)' }}>
                {String(index + 1).padStart(2, '0')}
              </p>
              <div className="grid gap-5 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-10">
                <h3 className="type-card-title" style={{ color: 'var(--text-strong)' }}>
                  <E>{item.title}</E>
                </h3>
                <p className="type-body max-w-xl" style={{ color: 'var(--text-muted)' }}>
                  <E>{item.body}</E>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function TeamSection() {
  const [founder, coordinator, production] = teamCards
  if (!founder || !coordinator || !production) return null

  return (
    <section className="px-[var(--gutter)] py-24 md:py-36" style={{ background: 'var(--teal-900)', color: 'var(--text-on-dark)' }}>
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mb-16 grid gap-10 border-t pt-8 lg:grid-cols-12 lg:items-end lg:gap-16 md:mb-24" style={{ borderColor: 'rgba(181,242,219,0.22)' }}>
          <div className="lg:col-span-7">
            <Eyebrow tone="onDark" className="mb-6">The team</Eyebrow>
            <h2 className="type-section-title">
              Strategy close to execution. <em>Execution close to reporting.</em>
            </h2>
          </div>
          <p className="type-body m-0 max-w-md lg:col-span-5" style={{ opacity: 0.72 }}>
            Fewer handoffs, faster feedback, and creative that improves because the same team sees what happens after publication.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-16 lg:grid-cols-12">
          {[founder, coordinator].map((member, index) => (
            <article key={member.title} className={index === 0 ? 'lg:col-span-7' : 'lg:col-span-5'}>
              <div
                className="aspect-[4/3] rounded-[var(--radius-bento)]"
                style={{ background: member.background }}
                role="img"
                aria-label={`${member.title} portrait — natural on-location team photography to be supplied`}
              />
              <div className="mt-7 grid gap-5 border-t pt-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" style={{ borderColor: 'rgba(181,242,219,0.22)' }}>
                <div>
                  <p className="type-eyebrow m-0" style={{ color: 'var(--mint-400)' }}>
                    <E>{member.label}</E>
                  </p>
                  <h3 className="type-card-title mt-4" style={{ color: 'var(--text-on-dark)' }}>
                    <E>{member.title}</E>
                  </h3>
                </div>
                <p className="type-body m-0" style={{ color: 'var(--text-on-dark)', opacity: 0.68 }}>
                  <E>{member.body}</E>
                </p>
              </div>
            </article>
          ))}

          <article className="grid gap-8 border-t pt-8 lg:col-span-12 lg:grid-cols-12 lg:items-stretch lg:gap-16" style={{ borderColor: 'rgba(181,242,219,0.22)' }}>
            <div
              className="aspect-[16/10] rounded-[var(--radius-bento)] lg:col-span-5 lg:aspect-auto lg:min-h-[24rem]"
              style={{ background: production.background }}
              role="img"
              aria-label="Atrium production team working across restaurant locations — documentary team photography to be supplied"
            />
            <div className="flex flex-col justify-between gap-12 lg:col-span-7">
              <div>
                <p className="type-eyebrow m-0" style={{ color: 'var(--mint-400)' }}>
                  <E>{production.label}</E>
                </p>
                <h3 className="type-section-title mt-5" style={{ color: 'var(--text-on-dark)' }}>
                  <E>{production.title}</E>
                </h3>
              </div>
              <p className="type-lead m-0 max-w-2xl" style={{ color: 'var(--text-on-dark)', opacity: 0.72 }}>
                <E>{production.body}</E>
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

export default function AboutPage() {
  return (
    <>
      <AboutHero />

      <StudioStory />
      <PrinciplesSection />
      <TeamSection />

      <CTABanner
        eyebrow="START HERE"
        headline={<>Bring us the restaurant. <em>We will bring the system.</em></>}
        body="If your team needs senior creative, operational rhythm, and reporting in the same room, the next step is a short conversation."
        cta={CTA.primary.label}
        ctaHref={CTA.primary.href}
        ctaExternal={CTA.primary.external}
      />
    </>
  )
}
