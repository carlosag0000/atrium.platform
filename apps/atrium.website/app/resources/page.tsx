import type { Metadata } from 'next'
import PageHero from '@/components/pages/PageHero'
import CTABanner from '@/components/sections/CTABanner'
import Eyebrow from '@/components/ui/Eyebrow'
import { CTA } from '@/lib/cta'
import E from '@/components/cms/Editable'

export const metadata: Metadata = {
  title: 'Atrium Resources — Hospitality Marketing Guides & Stories',
  description: 'Restaurant marketing resources from Atrium: essays, guides, and customer stories for hospitality operators growing bookings, retention, and brand.',
  alternates: { canonical: '/resources' },
}

const resourceGroups = [
  {
    label: 'Blog',
    description: 'Short operator essays on what is actually moving demand.',
    items: [
      "Views Don't Pay the Bills",
      "The 5 Photos Every Restaurant Needs That Aren't Food",
      'Why the Creative Cart Is Dead',
      'Your Google Profile Is Your New Front Door',
      'One Campaign That Moved the Needle',
    ],
  },
  {
    label: 'Guides',
    description: 'Practical playbooks for channels that restaurants keep underusing.',
    items: ['UGC Guide for Restaurant Creators', "The Restaurant Owner's Guide to Email ROI", 'Google Business Profile Checklist'],
  },
  {
    label: 'Customer Stories',
    description: 'Long-form case studies with interviews, context, and data.',
    items: ['Taco Naco KC', "T'ÄHÄ Mexican Kitchen", 'Old Shawnee Pizza', 'Chick-in-Waffle', 'Jerusalem Cafe'],
  },
]

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        eyebrow="RESOURCES"
        title={<>Useful thinking for <em>restaurant operators.</em></>}
        body="A focused resource library for owners and marketing leads who need clearer decisions around content, reviews, retention, and local demand."
        actions={[{ label: 'Read customer stories', href: '/work' }, { label: 'Talk through your market', href: CTA.primary.href, external: CTA.primary.external, variant: 'outlineLight' }]}
        stats={[
          { value: '3', label: 'resource tracks' },
          { value: '10+', label: 'case studies and guides planned' },
          { value: '1', label: 'hospitality-only point of view' },
        ]}
      />

      <section className="px-6 py-20 md:px-12 md:py-28" style={{ background: 'var(--surface-page)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <Eyebrow className="mb-5">Library</Eyebrow>
            <h2 className="type-section-title">
              Organized by the decisions restaurant teams keep making.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {resourceGroups.map((group) => (
              <div key={group.label} className="rounded-2xl border p-7" style={{ borderColor: 'rgba(7,47,52,0.10)', background: 'var(--surface-card)' }}>
                <p className="type-eyebrow" style={{ color: 'var(--accent)' }}>
                  <E>{group.label}</E>
                </p>
                <p className="type-caption mt-4" style={{ color: 'var(--text-muted)' }}>
                  <E>{group.description}</E>
                </p>
                <div className="mt-8 space-y-3">
                  {group.items.map((item) => (
                    <div key={item} className="rounded-xl px-4 py-3" style={{ background: 'rgba(7,47,52,0.05)' }}>
                      <p className="type-caption ">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:px-12 md:py-24" style={{ background: 'var(--teal-900)', color: 'var(--text-on-dark)' }}>
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">
          <div>
            <Eyebrow tone="onDark" className="mb-5">Editorial stance</Eyebrow>
            <h2 className="type-section-title">
              No generic marketing advice.
            </h2>
          </div>
          <p className="type-body" style={{ opacity: 0.74 }}>
            Every resource should help an operator make one sharper decision: what to shoot, what to fix, what to measure, what to send, or what to stop doing.
          </p>
        </div>
      </section>

      <CTABanner
        eyebrow="NEED A READ ON YOUR SYSTEM?"
        headline={<>Bring the messy context. <em>We will sort it.</em></>}
        body="If a resource gets you part of the way there, a short conversation can turn the idea into the next operating move."
        cta={CTA.primary.label}
        ctaHref={CTA.primary.href}
        ctaExternal={CTA.primary.external}
      />
    </>
  )
}
