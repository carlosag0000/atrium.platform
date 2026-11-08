import { Eyebrow } from '@atrium/ui'
import TransitionLink from '@/components/ui/TransitionLink'
import type { Service } from '@/lib/services'
import E from '@/components/cms/Editable'

const modelByCategory = {
  'Generate Demand': {
    name: 'Foundation',
    href: '/pricing#foundation',
    fit: 'For operators who need a clear brand foundation, a dependable production rhythm, and stronger local demand.',
  },
  'Convert Demand': {
    name: 'Growth',
    href: '/pricing#growth',
    fit: 'For operators with attention already in market who need more of it turning into calls, orders, reservations, and measurable action.',
  },
  'Retain Demand': {
    name: 'Full System',
    href: '/pricing#full-system',
    fit: 'For operators ready to connect direct guest relationships, automation, attribution, and reporting across the full engine.',
  },
} as const

export default function ServiceEngagementModel({ svc }: { svc: Service }) {
  const model = modelByCategory[svc.category as keyof typeof modelByCategory]

  return (
    <section className="bg-cream px-[var(--gutter)] py-24 md:py-32">
      <div className="mx-auto grid max-w-[var(--container-max)] gap-10 border-y border-line py-12 md:py-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-20">
        <div className="min-w-0">
          <Eyebrow className="mb-6">Related engagement model</Eyebrow>
          <p className="m-0 max-w-full font-serif font-normal italic leading-[0.86] tracking-[-0.055em] text-charcoal text-[clamp(3.5rem,5.5vw,6.75rem)]">
            <E>{model.name}</E>
          </p>
        </div>
        <div className="min-w-0">
          <h2 className="max-w-[24ch] text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-charcoal">
            The most common starting point for {svc.name.toLowerCase()}.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">{model.fit}</p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            <TransitionLink href={model.href} className="group inline-flex items-center gap-3 text-[0.875rem] text-charcoal no-underline">
              Compare the {model.name} model <span className="transition-transform group-hover:translate-x-2" aria-hidden="true">→</span>
            </TransitionLink>
            <TransitionLink href={`/contact?service=${svc.slug}`} className="group inline-flex items-center gap-3 text-[0.875rem] text-green no-underline">
              Scope this service <span className="transition-transform group-hover:translate-x-2" aria-hidden="true">→</span>
            </TransitionLink>
          </div>
        </div>
      </div>
    </section>
  )
}
