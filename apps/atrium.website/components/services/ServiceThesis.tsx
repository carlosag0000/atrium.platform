import { Eyebrow } from '@atrium/ui'
import Image from 'next/image'
import type { Service } from '@/lib/services'
import { parseHeadline } from './utils'

export default function ServiceThesis({ svc }: { svc: Service }) {
  return (
    <section className="bg-cream px-[var(--gutter)] pt-20 pb-26">
      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] items-center gap-16 max-w-[var(--container-max)] mx-auto max-md:grid-cols-1 max-md:gap-10">
        <div className="flex flex-col gap-[1.2rem]">
          <Eyebrow>{svc.thesis.eyebrow}</Eyebrow>
          <h2 className="m-0 max-w-[17ch] text-[clamp(2.6rem,4.5vw,4rem)] leading-[1.08] text-charcoal">
            {parseHeadline(svc.thesis.headline, 'font-serif italic')}
          </h2>
          <p className="m-0 max-w-120 text-base leading-relaxed text-muted">
            {svc.thesis.body}
          </p>
        </div>

        <div className="overflow-hidden relative min-h-124 max-md:min-h-112 rounded-card shadow-soft">
          <Image
            src={svc.thesis.image}
            alt={svc.hero.coverAlt}
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0 bg-linear-to-b from-ink/[0.04] to-ink/[0.22]"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
