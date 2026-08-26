import Eyebrow from '@/components/ui/Eyebrow'
import TransitionLink from '@/components/ui/TransitionLink'
import { getSiblingServices } from '@/lib/services'
import { CATEGORY_COLOR } from './utils'

export default function SiblingServices({ current }: { current: string }) {
  const siblings = getSiblingServices(current, 3)
  return (
    <section className="bg-cream px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        <Eyebrow className="mb-10">OTHER SERVICES</Eyebrow>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {siblings.map(svc => (
            <TransitionLink
              key={svc.slug}
              href={`/services/${svc.slug}`}
              className="group flex flex-col gap-4 rounded-card border border-line bg-card p-8 no-underline transition duration-200 ease-atrium hover:-translate-y-0.5 hover:shadow-float"
            >
              <span className="type-eyebrow" style={{ color: CATEGORY_COLOR[svc.category] }}>
                {svc.category}
              </span>
              <h3 className="type-card-title text-charcoal">{svc.name}</h3>
              <p className="type-caption flex-1 text-body">{svc.hero.body}</p>
              <span className="type-caption text-green">Learn more &rarr;</span>
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  )
}
