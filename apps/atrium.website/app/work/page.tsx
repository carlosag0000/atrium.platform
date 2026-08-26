import { Eyebrow } from '@atrium/ui'
import type { Metadata } from 'next'
import LazyVideo from '@/components/media/LazyVideo'
import CTABanner from '@/components/sections/CTABanner'
import TransitionLink from '@/components/ui/TransitionLink'
import WorkStoryBlock from '@/components/work/WorkStoryBlock'
import { CTA } from '@/lib/cta'
import { type CaseStudy, caseStudies } from '@/lib/work'
import { workStories } from '@/lib/work-stories'

export const metadata: Metadata = {
  title: 'Atrium Case Studies — Hospitality Marketing Results',
  description:
    'Hospitality-only case studies from Atrium across brand, content, social, retention, and reporting — real restaurants and hotels, real systems, real results.',
  alternates: { canonical: '/work' },
}

const sortedCases = [...caseStudies].sort((a, b) => a.order - b.order)

/** One line of the full archive. The gallery above is the argument; this is
 *  the reference — scannable, every case, no pictures competing for the eye. */
function CaseIndexRow({ study, index }: { study: CaseStudy; index: number }) {
  const metric = study.metrics[0]

  return (
    <TransitionLink
      aria-label={`Read case study: ${study.client}`}
      className="group grid grid-cols-1 items-baseline gap-x-8 gap-y-3 border-line border-b py-7 no-underline last:border-b-0 lg:grid-cols-[3rem_minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,1fr)_auto]"
      href={`/work/${study.slug}`}
    >
      <p className="m-0 font-serif text-[1.35rem] leading-none text-muted italic">
        {String(index + 1).padStart(2, '0')}
      </p>

      <div>
        <h3 className="m-0 text-[1.25rem] leading-[1.2] text-charcoal">{study.client}</h3>
        <p className="mt-1.5 text-[0.875rem] text-muted">{study.category}</p>
      </div>

      {metric ? (
        <p className="m-0 text-[0.9375rem] text-body">
          <span className="text-charcoal">{metric.number}</span> {metric.label}
        </p>
      ) : (
        <span />
      )}

      <p className="m-0 text-[0.875rem] text-muted">{study.serviceTags.slice(0, 3).join(' · ')}</p>

      <span
        aria-hidden="true"
        className="text-xl text-charcoal transition-transform duration-300 group-hover:translate-x-2"
      >
        →
      </span>
    </TransitionLink>
  )
}

export default function WorkPage() {
  // A story only renders if its case study still exists to link to.
  const stories = workStories.flatMap((story) => {
    const study = sortedCases.find((item) => item.slug === story.slug)
    return study ? [{ story, study }] : []
  })

  return (
    <>
      {/* The agency opens the page, not a client. No hero band — the extra top
          padding is what the fixed header used to sit over. */}
      <section className="bg-cream px-[var(--gutter)] pt-32 pb-2 md:pt-40 md:pb-4">
        <div className="mx-auto max-w-[var(--container-max)]">
          <Eyebrow className="mb-5">Our work</Eyebrow>
          <h1 className="max-w-[16ch] text-[clamp(2.6rem,4.5vw,4rem)] leading-[1.08] text-charcoal">
            Hospitality only. <em className="font-serif italic">Results first.</em>
          </h1>
          {/* Our own reel, not a client's. The file is shot 9:16, so a wide
              frame crops it to a band — object-cover keeps the centre. */}
          <div className="mt-12 h-[26rem] overflow-hidden rounded-card md:h-[34rem]">
            <LazyVideo
              className="h-full w-full object-cover"
              src="https://cdn.atriumad.com/clients/ATRM/reels/ATRM_%20JUL02%20Recap%209-16.mp4"
            />
          </div>

          <div className="mt-7 grid gap-6 border-line border-t pt-7 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <p className="m-0 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-charcoal">
                One accountable team
              </p>
              <p className="mt-2 text-[0.875rem] text-muted">
                Hospitality only · Strategy through reporting
              </p>
            </div>
            <div className="lg:col-span-7">
              <p className="m-0 max-w-2xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-body">
                Every brand below is a restaurant, a hotel, or a food company. We do not take work
                outside hospitality, because the playbook only compounds when the room, the menu and
                the market are the same problem we solved last month.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
                One team runs all of it — strategy, the shoot, the channels, the reporting — so
                nothing is briefed twice and nobody hands the brand off mid-campaign. What follows
                is the record: what the business looked like when we arrived, what we built, and
                what changed, measured against revenue rather than reach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {stories.map((entry, index) => (
        <WorkStoryBlock
          index={index}
          key={entry.story.slug}
          story={entry.story}
          study={entry.study}
        />
      ))}

      {/* The complete list, including the cases shown above. The gallery sells;
          this is for the visitor who wants to find a specific kind of client. */}
      <section className="bg-cream px-[var(--gutter)] py-24 md:py-32">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-12 md:mb-16">
            <Eyebrow className="mb-5">Full archive</Eyebrow>
            <h2 className="type-subsection-title max-w-[18ch] text-charcoal">
              Every case, <em className="font-serif italic">start to finish.</em>
            </h2>
          </div>

          <div className="border-line border-t">
            {sortedCases.map((study, index) => (
              <CaseIndexRow index={index} key={study.slug} study={study} />
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        body="If your marketing has activity but not a clear story of growth, Atrium can rebuild the system around outcomes."
        cta={CTA.primary.label}
        ctaExternal={CTA.primary.external}
        ctaHref={CTA.primary.href}
        eyebrow="NEXT STEP"
        headline={
          <>
            Build the case study <em>your restaurant deserves.</em>
          </>
        }
      />
    </>
  )
}
