import { Eyebrow, NumberReel } from '@atrium/ui'
import CldImage from '@/components/media/CldImage'
import TransitionLink from '@/components/ui/TransitionLink'
import type { CaseStudy } from '@/lib/work'
import type { WorkStory } from '@/lib/work-stories'

/** How the engagement ran, told beside four of the pieces it produced.
 *  Alternating grounds and sides keep consecutive stories from reading as one
 *  long block. */
export default function WorkStoryBlock({
  story,
  study,
  index,
}: {
  story: WorkStory
  study: CaseStudy
  /** Even blocks sit on cream with the images right; odd blocks invert both. */
  index: number
}) {
  const dark = index % 2 === 1
  const images = (study.galleryIds ?? []).slice(0, 4)

  return (
    <section
      className={`px-[var(--gutter)] py-24 md:py-32 ${dark ? 'bg-dark' : 'bg-cream'}`}
    >
      <div className="mx-auto grid max-w-[var(--container-max)] gap-12 lg:grid-cols-12 lg:gap-16">
        <div className={`lg:col-span-5 ${dark ? 'lg:order-2' : ''}`}>
          <Eyebrow className="mb-5" tone={dark ? 'on-dark' : 'default'}>
            {story.eyebrow}
          </Eyebrow>

          <h3
            className={`m-0 max-w-[18ch] text-[clamp(1.9rem,3vw,2.6rem)] leading-[1.12] ${dark ? 'text-cream' : 'text-charcoal'}`}
          >
            {story.headline}
          </h3>

          {story.body.map((paragraph) => (
            <p
              className={`mt-5 max-w-xl text-base leading-relaxed ${dark ? 'text-cream/[0.78]' : 'text-body'}`}
              key={paragraph.slice(0, 40)}
            >
              {paragraph}
            </p>
          ))}

          <div
            className={`mt-10 grid gap-8 border-t pt-8 sm:grid-cols-3 ${dark ? 'border-cream/20' : 'border-line'}`}
          >
            {story.metrics.map((metric) => (
              <div key={metric.label}>
                <p
                  className={`m-0 font-serif text-[clamp(1.9rem,3vw,2.6rem)] leading-none tracking-[-0.03em] ${dark ? 'text-lime' : 'text-green'}`}
                >
                  <NumberReel value={metric.number} />
                </p>
                <p
                  className={`mt-3 text-[0.8125rem] leading-relaxed ${dark ? 'text-cream/[0.7]' : 'text-muted'}`}
                >
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          <TransitionLink
            className={`group mt-9 inline-flex items-center gap-2 text-[0.9375rem] no-underline transition-colors ${dark ? 'text-cream hover:text-lime' : 'text-charcoal hover:text-green'}`}
            href={`/work/${story.slug}`}
          >
            Read the full case
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </TransitionLink>
        </div>

        <div className={`lg:col-span-7 ${dark ? 'lg:order-1' : ''}`}>
          <p
            className={`mb-5 text-[0.8125rem] ${dark ? 'text-cream/[0.65]' : 'text-muted'}`}
          >
            {story.craft}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {images.map((publicId, position) => (
              <div
                className={`relative overflow-hidden rounded-card-sm ${position % 3 === 0 ? 'aspect-[4/5]' : 'aspect-square'}`}
                key={publicId}
              >
                <CldImage
                  alt={`Work produced for ${study.client}`}
                  className="object-cover"
                  fill
                  publicId={publicId}
                  sizes="(min-width: 1024px) 28vw, 45vw"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
