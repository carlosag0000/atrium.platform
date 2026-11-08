import { Eyebrow } from '@atrium/ui'
import Image from 'next/image'
import E from '@/components/cms/Editable'

// ─── Atrium Growth Engine (doc vs.md §2.1 / §5 / §7.5) ──────────────────────
// Generate → Convert → Retain, read as three cards rather than a rail. Each
// one is a picture with a caption strip carrying its stage colour at rest, so
// the three stages are coded the moment the section is seen. Hover is left to
// do one job: open the strip to the copy underneath.
//
// The serif accent falls on the verb here, against the site's usual habit of
// stressing the second half. All three cards end in "Demand", so italicising
// that would mark the one word the three have in common; the verb is what
// separates them, and the stress belongs on whatever carries the meaning.
export const stages = [
  {
    n: '01',
    id: 'Generate',
    // Consumed by app/services/page.tsx for its stage markers.
    dot: 'var(--stage-generate)',
    lead: 'Generate',
    rest: 'Demand',
    tagline: 'Create awareness and desire.',
    body: 'Create awareness and desire through photography and film that show what it feels like. Build social presence where people spend time. Place paid discovery in front of people already looking for what you do.',
    caps: ['Film & Photo', 'Social', 'Paid Media'],
    // Strip fill and the text colour that clears 4.5:1 on it.
    fill: 'bg-lime',
    onFill: 'text-charcoal',
    onFillSoft: 'text-charcoal/80',
  },
  {
    n: '02',
    id: 'Convert',
    // Consumed by app/services/page.tsx for its stage markers.
    dot: 'var(--stage-convert)',
    lead: 'Convert',
    rest: 'Demand',
    tagline: 'Turn interest into reservations.',
    body: 'Turn interest into visits by owning local search, earning trust signals through reputation and reviews, and running campaigns that give people a reason to come in now.',
    caps: ['Google & Local SEO', 'Reputation', 'Offers & Campaigns'],
    fill: 'bg-amber',
    onFill: 'text-charcoal',
    onFillSoft: 'text-charcoal/80',
  },
  {
    n: '03',
    id: 'Retain',
    // Consumed by app/services/page.tsx for its stage markers.
    dot: 'var(--stage-retain)',
    lead: 'Retain',
    rest: 'Demand',
    tagline: 'Bring guests back.',
    body: 'Bring guests back through direct communication that stays relevant, loyalty systems that recognize repeat visits, and win-back sequences that activate the lapsed.',
    caps: ['Email & SMS', 'CRM & Loyalty', 'Win-back Flows'],
    // green is dark enough that the copy has to invert with it: charcoal on
    // green is 2.6:1, cream on green is 5.32:1.
    fill: 'bg-green',
    onFill: 'text-cream',
    onFillSoft: 'text-cream/85',
  },
]

// Shot for this section and staged on our own CDN, so the URLs are absolute
// and hardcoded rather than pulled from a case study's gallery. next/image
// cannot take a bare public ID, and next-cloudinary's CldImage would drag
// client-only code into this server component.
const COVERS = [
  'https://cdn.atriumad.com/clients/ATRM/photos/home_growth_fundations/hf_20260813_200354_5ca297ca-a0be-482a-87fa-247d35375eaf.jpg',
  'https://cdn.atriumad.com/clients/ATRM/photos/home_growth_fundations/hf_20260813_194857_d037d490-333d-421f-b20a-ba9f2a7516ae.png',
  'https://cdn.atriumad.com/clients/ATRM/photos/home_growth_fundations/DSC08166.JPG',
]

export default function GrowthEngineDiagram() {
  return (
    <section className="bg-dark px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
          <Eyebrow className="mb-6" tone="on-dark">
            <E>Growth Foundation</E>
          </Eyebrow>
          <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] leading-[1.08] tracking-[-0.02em] text-cream">
            Positioning, identity, and systems built to{' '}
            <em className="font-serif italic">convert strangers into regulars.</em>
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {stages.map((stage, i) => {
            const cover = COVERS[i]
            return (
              <article
                className="group relative aspect-[3/4] overflow-hidden rounded-card bg-charcoal"
                key={stage.id}
              >
                {cover && (
                  <Image
                    alt=""
                    className="object-cover transition-transform duration-700 ease-atrium group-hover:scale-[1.04]"
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    src={cover}
                  />
                )}

                {/* Hover scrim, same as the home bento. It carries no z-index
                    so it stays under the numeral and the copy panel, both of
                    which sit at z-10. */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-charcoal/40 opacity-0 transition-opacity duration-500 ease-atrium group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
                />

                <span className="absolute top-5 left-5 z-10 font-serif text-[1.1rem] text-cream/70 italic">
                  {stage.n}
                </span>

                {/* Anchored to the bottom of a fixed-ratio card, so opening it
                    grows the panel up over the picture instead of making the
                    card taller — the row keeps one height at rest and hover. */}
                <div
                  className={`absolute inset-x-0 bottom-0 z-10 p-6 md:p-7 ${stage.fill}`}
                >
                  <h3
                    className={`m-0 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] ${stage.onFill}`}
                  >
                    <em className="font-serif italic">{stage.lead}</em> {stage.rest}
                  </h3>

                  {/* 0fr → 1fr is the one height transition that works without
                      hardcoding a max-height that would clip longer copy. */}
                  <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-atrium group-focus-within:grid-rows-[1fr] group-hover:grid-rows-[1fr]">
                    <div className="overflow-hidden">
                      <p
                        className={`mt-3 text-[0.9375rem] leading-relaxed ${stage.onFillSoft}`}
                      >
                        <E>{stage.body}</E>
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
