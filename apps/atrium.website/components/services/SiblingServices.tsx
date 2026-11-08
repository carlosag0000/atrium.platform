import Eyebrow from '@/components/ui/Eyebrow'
import TransitionLink from '@/components/ui/TransitionLink'
import { getSiblingServices } from '@/lib/services'
import { CATEGORY_COLOR } from './utils'
import E from '@/components/cms/Editable'

export default function SiblingServices({ current }: { current: string }) {
  const siblings = getSiblingServices(current, 3)
  return (
    <section className="px-6 md:px-12 py-20 md:py-28" style={{ background: 'var(--surface-page)' }}>
      <div className="max-w-6xl mx-auto">
        <Eyebrow className="mb-10">OTHER SERVICES</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {siblings.map(svc => (
            <TransitionLink
              key={svc.slug}
              href={`/services/${svc.slug}`}
              className="group flex flex-col gap-4 rounded-2xl p-8 no-underline"
              style={{ background: 'var(--cloud-100)', border: '1px solid var(--border-light)' }}
            >
              <span className="type-eyebrow" style={{ color: CATEGORY_COLOR[svc.category] }}>
                {svc.category}
              </span>
              <h3 className="type-card-title" style={{ color: 'var(--text-strong)' }}>
                <E>{svc.name}</E>
              </h3>
              <p className="type-caption flex-1" style={{ color: 'var(--text-strong)', opacity: 0.7 }}>
                <E>{svc.hero.body}</E>
              </p>
              <span className="type-caption " style={{ color: 'var(--teal-700)' }}>
                Learn more &rarr;
              </span>
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  )
}
