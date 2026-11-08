import { Eyebrow } from '@atrium/ui'
import { ArrowUpRight } from 'lucide-react'
import { CAL_URL, CONTACT_EMAIL } from '@/lib/cta'
import { services } from '@/lib/services'
import TransitionLink from './TransitionLink'
import E from '@/components/cms/Editable'

// ─── Footer ─────────────────────────────────────────────────────────────────
// The long form of the mega menu: every service, grouped by the same three
// stages and marked with the same dots, so the bottom of the page and the top
// of the page describe the offer identically. Service rows are read from
// lib/services, so a new service appears here without a second edit.
const STAGES = [
  { category: 'Generate Demand', dotClass: 'bg-lime' },
  { category: 'Convert Demand', dotClass: 'bg-amber' },
  { category: 'Retain Demand', dotClass: 'bg-green' },
] as const

const serviceColumns = STAGES.map(({ category, dotClass }) => ({
  category,
  dotClass,
  links: services
    .filter((svc) => svc.category === category)
    .map((svc) => ({ label: svc.name, href: `/services/${svc.slug}` })),
}))

const companyLinks = [
  { label: 'Our Work', href: '/work' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Resources', href: '/resources' },
  { label: 'Contact', href: '/contact' },
]

const linkClass =
  'inline-block text-sm leading-snug text-cream/70 no-underline transition-all duration-200 hover:translate-x-1 hover:text-cream'

export default function Footer() {
  return (
    <footer className="bg-dark px-[var(--gutter)] py-20 text-cream md:py-28">
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* Brand block sits on its own row above the directory, so the columns
            below get the full width and never compress to two lines each. */}
        <div className="flex flex-col gap-10 border-cream/12 border-b pb-14 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <div className="mb-4 flex items-center gap-2">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-lime" />
              <p className="m-0 text-[1.15rem] leading-none">Atrium</p>
            </div>
            <p className="m-0 max-w-none text-cream/70 text-sm leading-relaxed">
              <E global>Smart creative for restaurants, hotels, and food brands. Hospitality is all we do.</E>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              className="group inline-flex w-fit items-center gap-2 text-[1.35rem] text-cream leading-none no-underline"
              href={CAL_URL}
              rel="noreferrer"
              target="_blank"
            >
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                <E global>Book a growth diagnostic</E>
              </span>
              <ArrowUpRight aria-hidden="true" className="h-5 w-5 text-lime" strokeWidth={1.75} />
            </a>
            <a className={linkClass} href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            <p className="m-0 text-lime text-sm leading-snug"><E global>Houston, TX</E></p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {serviceColumns.map((column) => (
            <div key={column.category}>
              <TransitionLink
                className="group mb-5 inline-flex w-fit items-center gap-2 no-underline"
                href="/services"
              >
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${column.dotClass}`} />
                <Eyebrow
                  as="span"
                  className="text-cream transition-transform duration-200 group-hover:translate-x-1"
                >
                  {column.category}
                </Eyebrow>
              </TransitionLink>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <TransitionLink className={linkClass} href={link.href}>
                      {link.label}
                    </TransitionLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <Eyebrow className="mb-5" tone="on-dark">
              Company
            </Eyebrow>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <TransitionLink className={linkClass} href={link.href}>
                    {link.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-cream/12 border-t pt-8 text-cream/45 text-xs md:flex-row md:items-center">
          <p className="m-0">© 2026 Atrium. All rights reserved.</p>
          <p className="m-0"><E global>Built for the people who feed people.</E></p>
        </div>
      </div>
    </footer>
  )
}
