import { Eyebrow, Tag } from '@atrium/ui'
import type { Service } from '@/lib/services'
import E from '@/components/cms/Editable'

const stages = [
  {
    name: 'Generate Demand',
    short: 'Generate',
    job: 'Create awareness and desire.',
    handoff: 'Hands qualified attention to conversion.',
  },
  {
    name: 'Convert Demand',
    short: 'Convert',
    job: 'Turn intent into visits and orders.',
    handoff: 'Captures the guest relationship for retention.',
  },
  {
    name: 'Retain Demand',
    short: 'Retain',
    job: 'Earn the next visit.',
    handoff: 'Feeds revenue evidence into the next cycle.',
  },
] as const

export default function ServiceSystemMap({ svc }: { svc: Service }) {
  return (
    <section className="bg-cream px-[var(--gutter)] py-24 md:py-32">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mb-12 grid gap-7 lg:grid-cols-12 lg:items-end lg:gap-16 md:mb-16">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-5"><E>Inside the Growth Engine</E></Eyebrow>
            <h2 className="max-w-[14ch] text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-charcoal">
              <E>This service has a job <em className="font-serif italic">before and after launch.</em></E>
            </h2>
          </div>
          <p className="max-w-lg border-t border-line pt-6 text-base leading-relaxed text-muted lg:col-span-5">
            {svc.name} sits inside {svc.category.toLowerCase()}. It does not operate as an isolated deliverable; it passes signal and demand into the next stage.
          </p>
        </div>

        <div className="grid border-y border-line md:grid-cols-3">
          {stages.map((stage, index) => {
            const active = stage.name === svc.category
            return (
              <article
                key={stage.name}
                className={`relative flex min-h-[17rem] flex-col border-b border-line px-6 py-8 last:border-b-0 md:min-h-[19rem] md:border-b-0 md:px-8 md:py-9 ${index > 0 ? 'md:border-l md:border-line' : ''} ${active ? 'bg-green-soft' : ''}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className={`m-0 text-[0.7rem] uppercase tracking-[0.14em] ${active ? 'text-green' : 'text-muted'}`}>
                    {String(index + 1).padStart(2, '0')} · {stage.short}
                  </p>
                  {active && <Tag variant="mint" size="sm">This service</Tag>}
                </div>
                <h3 className="mt-8 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-charcoal">{stage.job}</h3>
                <p className="mt-auto max-w-xs pt-8 text-[0.875rem] text-muted">{stage.handoff}</p>
              </article>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 border-b border-line py-6 md:flex-row md:items-center md:gap-6">
          <Eyebrow as="span" className="flex items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden>↺</span> Measure · learn · optimize
          </Eyebrow>
          <p className="m-0 text-[0.875rem] text-muted"><E>Every stage returns evidence to the next 28-day cycle.</E></p>
        </div>
      </div>
    </section>
  )
}
