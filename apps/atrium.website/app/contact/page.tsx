import type { Metadata } from 'next'
import PageHero from '@/components/pages/PageHero'
import CTABanner from '@/components/sections/CTABanner'
import Eyebrow from '@/components/ui/Eyebrow'
import { CAL_LINKS } from '@/lib/cal'
import { getService } from '@/lib/services'

export const metadata: Metadata = {
  title: 'Contact Atrium — Book a Hospitality Marketing Diagnostic',
  description: "Start a hospitality marketing conversation with Atrium. Tell us about your restaurant, hotel, or food brand and we'll map out where growth is leaking.",
  alternates: { canonical: '/contact' },
}

const email = 'hello@atriumad.com'

const briefItems = [
  'Restaurant, hotel, or food brand name',
  'Location count and market',
  'Current channels you are using',
  'What you need to improve in the next 90 days',
]

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service: serviceSlug } = await searchParams
  const selectedService = serviceSlug ? getService(serviceSlug) : undefined
  const subject = encodeURIComponent(selectedService ? `Atrium diagnostic — ${selectedService.name}` : 'New Atrium project')
  const emailHref = `mailto:${email}?subject=${subject}`

  return (
    <>
      <PageHero
        eyebrow="CONTACT"
        title={<>Tell us what needs <em>to grow.</em></>}
        body="The fastest first step is context: where the brand is now, what is already working, and what has become too hard for the team to manage alone."
        actions={[
          { label: 'Book a call', href: emailHref, calLink: CAL_LINKS.intro },
          { label: 'View pricing models', href: '/pricing', variant: 'outlineLight' },
        ]}
        stats={[
          { value: 'HOU', label: 'Houston, TX home base' },
          { value: '15+', label: 'hospitality brands in the operating network' },
        ]}
      />

      <section className="px-6 py-20 md:px-12 md:py-28" style={{ background: 'var(--color-cream)' }}>
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <Eyebrow className="mb-5">Direct line</Eyebrow>
            {selectedService && (
              <p className="type-eyebrow mb-5 inline-flex rounded-full px-4 py-2" style={{ color: 'var(--color-ink)', background: 'var(--color-lime)' }}>
                Interest selected: {selectedService.name}
              </p>
            )}
            <h2 className="type-section-title">
              Start with the messy version.
            </h2>
            <p className="type-body mt-6 max-w-md" style={{ color: 'var(--color-muted)' }}>
              You do not need a perfect brief. Send the business context, the current pressure, and the outcome you want to make visible.
            </p>
            <a href={emailHref} className="type-card-title mt-8 inline-flex" style={{ color: 'var(--color-ink)' }}>
              {email}
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border p-7" style={{ borderColor: 'rgba(7,47,52,0.10)', background: 'var(--color-card)' }}>
              <h3 className="type-card-title">Include this</h3>
              <ul className="mt-6 space-y-4">
                {briefItems.map((item) => (
                  <li key={item} className="type-caption" style={{ color: 'var(--color-muted)' }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border p-7" style={{ borderColor: 'rgba(7,47,52,0.10)', background: 'var(--color-card)' }}>
              <h3 className="type-card-title">Good reasons to reach out</h3>
              <div className="type-caption mt-6 space-y-4" style={{ color: 'var(--color-muted)' }}>
                <p>Your content has activity but no clear system.</p>
                <p>Your restaurant has more locations than your current process can support.</p>
                <p>Your reporting does not explain what marketing actually changed.</p>
                <p>Your team needs a partner that understands hospitality before the first meeting.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        eyebrow="WHAT HAPPENS NEXT"
        headline={<>A short conversation, then <em>a practical scope.</em></>}
        body="We will look at the current system, identify the missing operating pieces, and recommend whether Foundation, Growth, or Full System makes sense."
        cta="Book a call"
        ctaHref={emailHref}
        ctaCalLink={CAL_LINKS.intro}
      />
    </>
  )
}
