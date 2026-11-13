import type { Metadata } from 'next'
import E from '@/components/cms/Editable'
import InsightsRoot from '@/components/insights/InsightsRoot'
import CTABanner from '@/components/sections/CTABanner'

// The Insights (blog) list. Articles are written in the dashboard (Website → Insights) and
// filled in on the server by /api/render.php; see components/insights/InsightsRoot.tsx.
export const metadata: Metadata = {
  title: 'Insights — Hospitality Marketing Playbooks | Atrium',
  description: 'Practical playbooks on restaurant and hospitality marketing: local SEO, Google reviews, social content, paid ads, email and loyalty.',
  alternates: { canonical: '/insights' },
}

export default function InsightsPage() {
  return (
    <>
      <section className="bg-dark px-[var(--gutter)] pt-[7.5rem] pb-14 max-sm:pt-[6rem]">
        <div className="mx-auto max-w-[var(--container-max)]">
          <p className="type-eyebrow m-0 mb-6 text-lime">
            <E>Insights</E>
          </p>
          <h1 className="m-0 max-w-[16ch] text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">
            <E>
              Playbooks for hospitality <em>growth.</em>
            </E>
          </h1>
          <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/[0.78]">
            <E>What we learn running marketing for restaurants, hotels and food brands: local SEO, reviews, content, ads and retention, written to be used.</E>
          </p>
        </div>
      </section>
      <section className="px-[var(--gutter)] py-14 md:py-20" style={{ background: 'var(--surface-page)' }}>
        <InsightsRoot kind="list" className="mx-auto max-w-[var(--container-max)]" />
      </section>
      <CTABanner
        eyebrow="FREE TOOL"
        headline={
          <>
            How does your restaurant <em>score?</em>
          </>
        }
        body="The Atrium Marketing Grader checks your search, reviews, social and website in minutes, and shows what to fix first."
        cta="Get my free score"
        ctaHref="https://grader.atriumad.com"
        ctaExternal
      />
    </>
  )
}

