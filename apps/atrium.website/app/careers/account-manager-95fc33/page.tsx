import { Eyebrow } from '@atrium/ui'
import type { Metadata } from 'next'
import ApplicationForm from '@/components/careers/ApplicationForm'
import { ACCOUNT_MANAGER_JOB, listing } from '@/lib/careers/account-manager'

// Private listing: reachable only by link. Not in the navbar, footer or sitemap, and not indexed.
export const metadata: Metadata = {
  title: 'Account Manager · La Habana — Atrium',
  description: 'Únete al equipo de Atrium en La Habana como Account Manager.',
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {items.map((item) => (
        <li key={item} className="type-body flex gap-3" style={{ color: 'var(--teal-800)' }}>
          <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--teal-800)' }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-6 border-t py-12 md:grid-cols-[minmax(0,0.35fr)_minmax(0,1fr)] md:gap-12" style={{ borderColor: 'rgba(7,47,52,0.14)' }}>
      <h2 className="m-0 text-[clamp(1.5rem,2vw,2rem)] font-normal leading-tight" style={{ color: 'var(--teal-800)' }}>
        {title}
      </h2>
      <div>{children}</div>
    </section>
  )
}

export default function AccountManagerPage() {
  return (
    <>
      <section className="bg-dark px-[var(--gutter)] pt-[7.5rem] pb-16 max-sm:pt-[6rem]">
        <div className="mx-auto max-w-[var(--container-max)]">
          <Eyebrow className="mb-6" tone="on-dark">
            {listing.eyebrow}
          </Eyebrow>
          <h1 className="m-0 text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">{listing.title}</h1>
          <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/[0.78]">{listing.lead}</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#aplicar"
              className="inline-flex items-center rounded-full px-7 py-4 font-semibold no-underline transition hover:opacity-90"
              style={{ background: 'var(--mint-400)', color: 'var(--teal-800)' }}
            >
              Aplicar ahora →
            </a>
          </div>
          <dl className="mt-12 grid gap-6 border-cream/25 border-t pt-6 sm:grid-cols-3">
            {listing.facts.map((f) => (
              <div key={f.label}>
                <dt className="type-eyebrow text-cream/60">{f.label}</dt>
                <dd className="m-0 mt-2 text-cream">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="px-[var(--gutter)] pt-8 pb-20" style={{ background: 'var(--surface-page)' }}>
        <div className="mx-auto max-w-[var(--container-max)]">
          <Block title={listing.role.title}>
            <p className="type-lead m-0" style={{ color: 'var(--teal-800)' }}>
              {listing.role.body}
            </p>
          </Block>
          <Block title="Lo que harás">
            <List items={listing.responsibilities} />
          </Block>
          <Block title="Lo que buscamos">
            <List items={listing.requirements} />
          </Block>
          <Block title="Herramientas">
            <div className="flex flex-wrap gap-2">
              {listing.tools.core.map((t) => (
                <span key={t} className="rounded-full px-4 py-2 text-[0.95rem]" style={{ background: 'var(--teal-800)', color: 'var(--mint-400)' }}>
                  {t}
                </span>
              ))}
              {listing.tools.plus.map((t) => (
                <span key={t} className="rounded-full border px-4 py-2 text-[0.95rem]" style={{ borderColor: 'rgba(7,47,52,0.25)', color: 'var(--teal-800)' }}>
                  {t} · plus
                </span>
              ))}
            </div>
            <p className="type-body mt-5 mb-0" style={{ color: 'var(--text-muted)' }}>
              {listing.tools.note}
            </p>
          </Block>
          <Block title="Habilidades personales">
            <List items={listing.softSkills} />
          </Block>
          <Block title={listing.offer.title}>
            <List items={listing.offer.items} />
            <p className="type-lead mt-6 mb-0 font-semibold" style={{ color: 'var(--teal-800)' }}>
              {listing.offer.closing}
            </p>
            <p className="type-body mt-4 mb-0" style={{ color: 'var(--text-muted)' }}>
              {listing.pay}
            </p>
          </Block>
          <p className="type-body m-0 border-t pt-8" style={{ borderColor: 'rgba(7,47,52,0.14)', color: 'var(--text-muted)' }}>
            {listing.inclusion}
          </p>
        </div>
      </div>

      <section id="aplicar" className="scroll-mt-20 px-[var(--gutter)] py-20" style={{ background: 'var(--surface-sunken)' }}>
        <div className="mx-auto max-w-3xl">
          <Eyebrow className="mb-4">Aplicar</Eyebrow>
          <h2 className="type-section-title m-0 mb-4" style={{ color: 'var(--teal-800)' }}>
            Cuéntanos de ti.
          </h2>
          <p className="type-lead m-0 mb-10" style={{ color: 'var(--text-muted)' }}>
            Son 6 pasos cortos. Te toma unos 10 minutos.
          </p>
          <ApplicationForm job={ACCOUNT_MANAGER_JOB} />
        </div>
      </section>
    </>
  )
}
