import { Eyebrow, NumberReel, PillTags } from '@atrium/ui'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import FeatureFilm from '@/components/media/FeatureFilm'
import CTABanner from '@/components/sections/CTABanner'
import TransitionLink from '@/components/ui/TransitionLink'
import DragGallery from '@/components/work/DragGallery'
import VideoMarquee from '@/components/work/VideoMarquee'
import { CTA } from '@/lib/cta'
import {
  type CaseMetric,
  type CaseStudy,
  caseStudies,
  filmPoster,
  getCaseStudy,
  getCaseSummary,
  isVideoLed,
} from '@/lib/work'
import E from '@/components/cms/Editable'

export async function generateStaticParams() {
  return caseStudies.map(study => ({ slug: study.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) return {}

  return {
    title: `${study.client} — Atrium Case Study`,
    description: getCaseSummary(study),
    alternates: { canonical: `/work/${slug}` },
  }
}

/** Colour, then type, then the work itself. The cover photograph is gone: the
 *  reels are the first thing a case study should show, and a still of the same
 *  footage above them was saying it twice. What replaces it is light rather
 *  than an image — a wash of the brand palette hung off the top edge and gone
 *  by the time the headline starts, so cream is still the ground the type
 *  sits on. */
export function CaseHero({ study }: { study: CaseStudy }) {
  return (
    <section className="relative isolate bg-cream pt-32 pb-24 md:pt-40 md:pb-36">
      {/* The light hangs off the top edge of the section, so it is a child of
          the section rather than of the copy column. Its wrapper is what cuts
          the top — `overflow-hidden` on the section itself would also clip the
          reel marquee below, which has to keep running past both edges. */}
      <div aria-hidden="true" className="atr-hero-glint-clip">
        <div className="atr-hero-glints" />
      </div>

      <div className="px-[var(--gutter)]">
        <div className="relative mx-auto max-w-3xl text-center">
          {/* Positioned so it paints over the glint layer: both are positioned,
              so DOM order decides, and no negative z-index is needed. */}
          <div className="relative">
            <Eyebrow className="mb-6">{study.client}</Eyebrow>
            <h1 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-charcoal">
              {study.heroHeadline ?? study.client}
            </h1>
            <div className="mt-8">
              <PillTags items={study.serviceTags} label="Services" />
            </div>
          </div>
        </div>
      </div>

      {/* A film-led study opens on its feature instead of a rail: the work was
          one piece to sit through, not a calendar of cuts to scroll past. */}
      {study.films ? (
        <div className="relative mt-16 px-[var(--gutter)] md:mt-20">
          <div className="mx-auto max-w-[var(--container-max)]">
            <FeatureFilm
              poster={filmPoster(study.films.feature)}
              src={study.films.feature}
              title={`${study.client} — brand film`}
            />
          </div>
        </div>
      ) : study.videoIds?.length ? (
        <div className="relative mt-16 md:mt-20">
          <VideoMarquee publicIds={study.videoIds} />
        </div>
      ) : null}
    </section>
  )
}

/** The story as the two things a reader actually wants: what was wrong, and
 *  what we did about it. */
export function ChallengeSolutionSection({ study }: { study: CaseStudy }) {
  const challenge = study.challenge ?? study.story[0]
  const solution = study.solution ?? study.story[1] ?? study.story[0]
  if (!challenge) return null

  const columns = [
    { label: 'Challenge', body: challenge },
    { label: 'Solution', body: solution },
  ]

  return (
    <section id="story" className="bg-dark px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <Eyebrow tone="on-dark" className="mb-6">The story</Eyebrow>
          <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">
            {study.storyHeadline ?? <>From challenge to <em>working system.</em></>}
          </h2>
        </div>

        <div className="grid gap-10 md:grid-cols-2 md:gap-16">
          {columns.map(({ label, body }) => (
            <div className="border-t border-cream/20 pt-8" key={label}>
              <Eyebrow tone="on-dark" className="mb-6"><E>{label}</E></Eyebrow>
              <p className="m-0 text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/80">
                <E>{body}</E>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** The client, on camera. A film-led case study argues through the people who
 *  were shot, so the interviews get the dark band to themselves rather than a
 *  slot in a rail where they would play muted and unwatched. */
export function InterviewsSection({ study }: { study: CaseStudy }) {
  const interviews = study.films?.interviews ?? []
  if (interviews.length === 0) return null

  return (
    <section className="bg-dark px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
          <Eyebrow tone="on-dark" className="mb-6">On camera</Eyebrow>
          <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">
            In their <em>own words.</em>
          </h2>
        </div>

        <div className={`grid gap-10 ${interviews.length > 1 ? 'md:grid-cols-2 md:gap-12' : 'mx-auto max-w-4xl'}`}>
          {interviews.map((interview) => (
            <figure className="m-0" key={interview.src}>
              <FeatureFilm
                poster={interview.poster ?? filmPoster(interview.src)}
                src={interview.src}
                title={`${interview.name} on ${study.client}`}
              />
              <figcaption className="mt-6 border-cream/20 border-t pt-6">
                <p className="m-0 text-cream"><E>{interview.name}</E></p>
                {interview.role ? (
                  <p className="m-0 mt-1 font-serif text-cream/70 italic"><E>{interview.role}</E></p>
                ) : null}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}

/** Everything else off the shoot: the rest of the landscape films, then the
 *  vertical cuts that were delivered for social. Same section because they are
 *  the same job — what the campaign produced beyond the headline piece. */
export function FilmLibrarySection({ study }: { study: CaseStudy }) {
  const films = study.films?.films ?? []
  const cuts = study.films?.cuts ?? []
  if (films.length === 0 && cuts.length === 0) return null

  return (
    <section className="bg-cream px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mb-14 grid gap-8 border-t border-line pt-8 lg:grid-cols-12 lg:items-end lg:gap-16 md:mb-20">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-6">The library</Eyebrow>
            <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-charcoal">
              {study.galleryHeadline ?? <>Shot once, <em>cut many ways.</em></>}
            </h2>
          </div>
          <p className="m-0 max-w-md text-base leading-relaxed text-muted lg:col-span-5">
            {study.galleryNote ??
              'One production, edited into a library: the long pieces for the brand, the vertical cuts for the feed.'}
          </p>
        </div>

        {films.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 md:gap-10">
            {films.map((src) => (
              <FeatureFilm key={src} poster={filmPoster(src)} src={src} title={`${study.client} — film`} />
            ))}
          </div>
        ) : null}

        {cuts.length > 0 ? (
          <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-4 ${films.length > 0 ? 'mt-8 md:mt-10' : ''}`}>
            {cuts.map((src) => (
              <FeatureFilm
                key={src}
                poster={filmPoster(src)}
                ratio="9/16"
                src={src}
                title={`${study.client} — social cut`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

function PhotoGallerySection({ study }: { study: CaseStudy }) {
  return (
    <section className="bg-cream py-24 md:py-36">
      <div className="px-[var(--gutter)]">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-14 grid gap-8 border-t border-line pt-8 lg:grid-cols-12 lg:items-end lg:gap-16 md:mb-20">
            <div className="lg:col-span-7">
              <Eyebrow className="mb-6">Photo gallery</Eyebrow>
              <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-charcoal">
                {study.galleryHeadline ?? <>The brand, <em>in frame.</em></>}
              </h2>
            </div>
            <p className="m-0 max-w-md text-base leading-relaxed text-muted lg:col-span-5">
              {study.galleryNote ??
                'A visual record of the atmosphere, details, people, and moments that made the work recognizable.'}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive draggable gallery — stock fillers until real assets land */}
      <div className="mt-14 overflow-hidden md:mt-20">
        <DragGallery publicIds={study.galleryIds} images={study.gallery} />
      </div>
    </section>
  )
}

export function ApproachSection({ study }: { study: CaseStudy }) {
  const approach = study.howWeDidIt ?? []
  if (approach.length === 0) return null

  return (
    <section id="approach" className="bg-cream px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Eyebrow className="mb-6">The approach</Eyebrow>
            <h2 className="max-w-[10ch] text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-charcoal">
              What we <em>changed.</em>
            </h2>
          </div>

          <div className="border-t border-line lg:col-span-8">
            {approach.map((step, index) => (
              <article
                key={step.title}
                className="grid gap-6 border-b border-line py-9 md:grid-cols-[4rem_minmax(0,1fr)] md:gap-8 md:py-11"
              >
                <p className="m-0 text-[0.7rem] uppercase tracking-[0.14em] text-muted">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <div>
                  <h3 className="max-w-[22ch] text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-charcoal">
                    <E>{step.title}</E>
                  </h3>
                  <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted">
                    <E>{step.body}</E>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function ResultsSection({ study, metrics }: { study: CaseStudy; metrics: CaseMetric[] }) {
  if (metrics.length === 0) return null

  const getMetricFontSize = (value: string) => {
    if (value.length >= 8) return 'clamp(4rem, 5vw, 6rem)'
    if (value.length >= 6) return 'clamp(4.5rem, 5.8vw, 7rem)'
    return 'clamp(5rem, 6.5vw, 8rem)'
  }

  return (
    <section id="results" className="bg-dark px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="grid gap-10 pb-16 lg:grid-cols-12 lg:gap-16 lg:pb-24">
          <div className="lg:col-span-7">
            <Eyebrow tone="on-dark" className="mb-6">Measurable growth</Eyebrow>
            <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">
              The work, <em>in numbers.</em>
            </h2>
          </div>
          <p className="m-0 text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/70 lg:col-span-5 lg:self-end">
            {study.resultHeadline}
          </p>
        </div>

        {/* One column per metric, number over label over detail. Three across
            is the shape the copy is written for — the label is a heading now,
            not a sentence, so setting it beside the figure wastes the width. */}
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-x-12 lg:gap-x-16">
          {metrics.map(metric => (
            <article
              key={`${metric.number}-${metric.label}`}
              className="flex flex-col gap-5 border-t border-cream/20 py-10 md:py-12"
            >
              <p
                className="m-0 flex whitespace-nowrap font-normal leading-none tracking-[-0.02em] text-cream"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: getMetricFontSize(metric.number),
                  fontVariantNumeric: 'lining-nums tabular-nums',
                }}
              >
                <NumberReel value={metric.number} />
              </p>
              <div>
                <p className="m-0 text-[0.8125rem] uppercase tracking-[0.12em] text-cream">
                  <E>{metric.label}</E>
                </p>
                {metric.detail && (
                  <p className="m-0 mt-3 max-w-sm text-base leading-relaxed text-cream/70">
                    <E>{metric.detail}</E>
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>

        {study.takeaway && (
          <p className="m-0 mt-8 max-w-5xl border-t border-cream/20 pt-10 text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/70 md:mt-12 md:pt-14">
            {study.takeaway}
          </p>
        )}
      </div>
    </section>
  )
}

export function TestimonialSection({ study }: { study: CaseStudy }) {
  const testimonial = study.testimonial
  if (!testimonial) return null

  return (
    <section className="bg-cream px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow className="mb-6">Client testimonial</Eyebrow>
        <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-charcoal">
          {study.testimonialHeadline ?? <>More than an agency. <em>A true partner.</em></>}
        </h2>

        <blockquote className="m-0 mt-10">
          <p className="m-0 text-[clamp(1.15rem,1.6vw,1.4rem)] leading-relaxed text-body">
            “{testimonial.quote}”
          </p>
          {/* `text-center` is set again here rather than inherited: the
              browser's own blockquote/footer styling resets alignment, so the
              attribution drifts left of the quote it belongs to.

              `mx-auto` is what actually centres them: globals.css caps every
              `main p` at 72ch, and a capped block with default margins hugs the
              left edge — text-align only centres the text inside that narrower
              box. The serif line measures its own 72ch, so it drifted furthest. */}
          <footer className="mt-8 text-center">
            <p className="m-0 mx-auto text-charcoal"><E>{testimonial.name}</E></p>
            <p className="m-0 mx-auto mt-1 font-serif text-muted italic"><E>{testimonial.role}</E></p>
          </footer>
        </blockquote>
      </div>
    </section>
  )
}

/** One line out. The cover, the summary and the service list were all a
 *  second case study competing with the one just read — the name and the way
 *  through is the whole job here. */
export function NextCasePreview({ nextStudy }: { nextStudy: CaseStudy }) {
  return (
    <section className="bg-cream px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow className="mb-6">Next case study</Eyebrow>

        <TransitionLink
          aria-label={`Read next case study: ${nextStudy.client}`}
          className="group inline-flex items-baseline gap-4 no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber focus-visible:ring-offset-4"
          href={`/work/${nextStudy.slug}`}
        >
          <h2 className="m-0 text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-charcoal">
            {nextStudy.client}
          </h2>
          <span
            aria-hidden="true"
            className="text-[clamp(1.6rem,2.6vw,2.4rem)] text-charcoal transition-transform duration-300 ease-atrium group-hover:translate-x-2 motion-reduce:transition-none"
          >
            →
          </span>
        </TransitionLink>
      </div>
    </section>
  )
}

export function getStoryParagraphs(study: CaseStudy) {
  const intro = study.intro ?? study.story[0] ?? study.resultHeadline
  return [intro, ...study.story].filter((paragraph, index, all) => all.indexOf(paragraph) === index)
}

export function getNextStudy(study: CaseStudy) {
  const sortedCases = [...caseStudies].sort((a, b) => a.order - b.order)
  const currentIndex = sortedCases.findIndex(item => item.slug === study.slug)
  return sortedCases[(currentIndex + 1) % sortedCases.length]
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) notFound()

  const nextStudy = getNextStudy(study)
  if (!nextStudy) notFound()

  return (
    <article className="bg-cream text-charcoal">
      {/* Hero carries the reels, so the page opens on the work itself. Then
          the story, the numbers, the pictures — the reels no longer need a
          section of their own further down. A video-led study has no photo
          shoot to build a gallery from, so that one section drops out. */}
      <CaseHero study={study} />
      <ChallengeSolutionSection study={study} />
      <InterviewsSection study={study} />
      <ResultsSection study={study} metrics={study.metrics.slice(0, 3)} />
      <FilmLibrarySection study={study} />
      {!study.films && !isVideoLed(study) && <PhotoGallerySection study={study} />}
      <ApproachSection study={study} />
      <TestimonialSection study={study} />
      <NextCasePreview nextStudy={nextStudy} />
      <CTABanner
        eyebrow="JOIN 15+ HOSPITALITY BRANDS"
        headline={<>Been burned by an agency <em>before?</em></>}
        body="If you've outgrown freelancers, been let down by generic agencies, or just want a team that reports revenue instead of vanity — we were built for you. See the system before you commit."
        cta={CTA.primary.label}
        ctaHref={CTA.primary.href}
        ctaExternal={CTA.primary.external}
      />
    </article>
  )
}
