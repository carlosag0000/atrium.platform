import { Eyebrow } from '@atrium/ui'
import Image from 'next/image'
import type { ReactNode } from 'react'
import type { TestimonialCard } from '@/lib/testimonials'

type Props = { items: TestimonialCard[]; eyebrow?: string; headline?: ReactNode; body?: string }

/** Portrait diameter. Fixed in one place because it is the whole argument for
 *  this treatment: at 56px a 400px crop off LinkedIn and a magazine frame are
 *  indistinguishable, so the rail stops depending on photographs whose quality
 *  nobody here controls. Grow this and the mismatch comes back. */
const PORTRAIT_PX = 56

/** The evidence rail: operator quotes running past on a loop.
 *
 *  It is a marquee rather than a grid because the set grows with every client.
 *  A grid has to be re-balanced each time a quote is added — the row either
 *  fills or leaves a hole — while a rail takes any number of cards and asks
 *  nothing of their count.
 *
 *  The loop is the same one the logo strip runs: two copies of the set inside
 *  an overflow window, translated by exactly half the track. The seam is
 *  invisible because the second copy starts where the first began. Only the
 *  first copy is read by assistive tech; the clone carries `aria-hidden`, or a
 *  screen reader announces every quote twice.
 *
 *  The quote is the card and the face is a token beside the name. An earlier
 *  pass ran the photographs full bleed, and the trouble with that was never the
 *  layout: the portraits arrive from press pages, phones and LinkedIn, and at
 *  any size where a face reads as a face, the differences in resolution,
 *  lighting and crop read too. Demoting the portrait is what lets a client send
 *  whatever they have.
 *
 *  Cream cards on the section's dark ground, which is the card vocabulary the
 *  rest of the page already uses — the rail borrows it rather than introducing
 *  a fourth kind of card to the home page. */
export default function TestimonialMarquee({ items, eyebrow, headline, body }: Props) {
  return (
    <section className="overflow-hidden bg-dark py-20 md:py-28">
      <div className="mx-auto mb-14 max-w-3xl px-[var(--gutter)] text-center md:mb-16">
        {eyebrow && (
          <Eyebrow className="mb-6" tone="on-dark">
            {eyebrow}
          </Eyebrow>
        )}
        {headline && (
          <h2 className="m-0 type-subsection-title text-cream">
            {headline}
          </h2>
        )}
        {body && (
          <p className="m-0 mx-auto mt-6 max-w-[38rem] text-[clamp(1rem,1.3vw,1.15rem)] leading-relaxed text-cream/70">
            {body}
          </p>
        )}
      </div>

      {/* The window masks both edges so cards dissolve instead of being sliced
          by the viewport. The track holds the animation; hovering pauses it, so
          a quote someone is reading stops running away from them. */}
      <div className="testimonial-marquee-window">
        <div className="testimonial-marquee-track flex w-max items-stretch">
          {[0, 1].map(copy => (
            <div
              aria-hidden={copy > 0}
              className="flex shrink-0 items-stretch gap-5 pr-5"
              key={copy}
            >
              {items.map(item => (
                <figure
                  className="testimonial-card m-0 flex w-[clamp(19rem,24vw,21rem)] shrink-0 flex-col justify-between rounded-card bg-card p-8 shadow-float"
                  // The quote itself, not the index: a client can appear twice
                  // in the rail, and the index shifts every time a card is
                  // inserted above.
                  key={item.quote}
                >
                  <blockquote className="m-0">
                    {/* Decorative: the quotation is already carried by the
                        blockquote, so the glyph is hidden rather than read out
                        as punctuation. */}
                    <p
                      aria-hidden="true"
                      className="m-0 font-serif text-[2.75rem] leading-[0.5] text-green-ink"
                    >
                      &ldquo;
                    </p>
                    {/* Sans, not the serif italic an earlier pass used: a whole
                        paragraph of italic serif is a display face doing a
                        reading job. The serif stays on the name, where it is
                        one line and earns its character. */}
                    <p className="m-0 mt-6 text-[1.0625rem] leading-[1.6] tracking-[-0.006em] text-charcoal">
                      {item.quote}
                    </p>
                  </blockquote>

                  <figcaption className="mt-8 flex items-center gap-4">
                    {item.photo ? (
                      <span
                        className="relative block shrink-0 overflow-hidden rounded-full"
                        style={{ height: PORTRAIT_PX, width: PORTRAIT_PX }}
                      >
                        <Image
                          alt=""
                          className="object-cover"
                          fill
                          sizes={`${PORTRAIT_PX}px`}
                          src={item.photo}
                          // Inline rather than a utility: the value is per-photo
                          // data, so it cannot be a class known at build time.
                          style={{ objectPosition: item.focal ?? 'center top' }}
                        />
                      </span>
                    ) : (
                      // No portrait: a lime disc carrying the company's initial
                      // keeps the row on one rhythm instead of leaving a hole
                      // where every other card has a face.
                      <span
                        aria-hidden="true"
                        className="flex shrink-0 items-center justify-center rounded-full bg-lime font-serif text-[1.35rem] italic leading-none text-charcoal"
                        style={{ height: PORTRAIT_PX, width: PORTRAIT_PX }}
                      >
                        {item.company.charAt(0)}
                      </span>
                    )}

                    {/* min-w-0 so a long restaurant name wraps inside the card
                        instead of forcing the flex row wider than the card. */}
                    <span className="min-w-0">
                      {/* The name is dropped rather than printed empty when it
                          is unconfirmed, and the role only appears where we
                          have it. */}
                      {item.author && (
                        <span className="block font-serif text-[1.0625rem] italic leading-tight text-charcoal">
                          {item.author}
                        </span>
                      )}
                      <Eyebrow as="span" className={item.author ? 'mt-1 block' : 'block'}>
                        {item.role ? `${item.role} · ${item.company}` : item.company}
                      </Eyebrow>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
