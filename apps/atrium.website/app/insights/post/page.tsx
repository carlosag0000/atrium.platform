import type { Metadata } from 'next'
import InsightsRoot from '@/components/insights/InsightsRoot'
import CTABanner from '@/components/sections/CTABanner'
import { CAL_LINKS } from '@/lib/cal'

// Shell for every Insights article (/insights/<slug>). /api/render.php fills in the article,
// its title, description, canonical link and structured data.
export const metadata: Metadata = {
  title: 'Insights — Atrium',
  alternates: { canonical: null },
}

export default function InsightPostPage() {
  return (
    <>
      <section className="px-[var(--gutter)] pt-[7.5rem] pb-16 max-sm:pt-[6rem]" style={{ background: 'var(--surface-page)' }}>
        <InsightsRoot kind="post" className="mx-auto max-w-[var(--container-max)]" />
      </section>
      <CTABanner
        eyebrow="WORK WITH ATRIUM"
        headline={
          <>
            Put this to work for <em>your brand.</em>
          </>
        }
        body="One team for content, local SEO, ads, reviews and retention, built for hospitality."
        cta="Book a call"
        ctaHref="/contact"
        ctaCalLink={CAL_LINKS.intro}
      />
    </>
  )
}
