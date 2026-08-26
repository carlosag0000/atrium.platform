import { Eyebrow } from '@atrium/ui'
import type { Service } from '@/lib/services'

export default function ServiceDeliverables({ svc }: { svc: Service }) {
  return (
    <section className="bg-cream px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto grid max-w-[var(--container-max)] gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="self-start lg:sticky lg:top-32 lg:col-span-4">
          <Eyebrow className="mb-6">What you receive</Eyebrow>
          <h2 className="max-w-[10ch] type-subsection-title text-charcoal">
            Outputs with an <em className="font-serif italic">operating job.</em>
          </h2>
          <p className="mt-7 max-w-sm text-base leading-relaxed text-muted">
            Every output has an owner, a channel, and a place in the monthly reporting rhythm. Nothing ships as an orphaned asset.
          </p>
        </div>

        <div className="border-t border-line lg:col-span-8">
          {svc.perks.map((perk, index) => (
            <article
              key={perk.title}
              className="grid gap-5 border-b border-line py-8 sm:grid-cols-[4rem_minmax(0,0.7fr)_minmax(0,1.3fr)] sm:gap-8 md:py-10"
            >
              <p className="m-0 text-[0.7rem] uppercase tracking-[0.14em] text-muted">{String(index + 1).padStart(2, '0')}</p>
              <h3 className="text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-charcoal">{perk.title}</h3>
              <p className="m-0 max-w-xl text-base leading-relaxed text-muted">{perk.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
