'use client'

import { Eyebrow } from '@atrium/ui'
import TransitionLink from '@/components/ui/TransitionLink'
import E from '@/components/cms/Editable'

// Each path carries a `filled` count out of the twelve cells in the footprint
// diagram below. The diagram is the section's whole visual idea: one room, a
// handful, a full board — the scale is read before a single word is.
const paths = [
  {
    count: '1',
    filled: 1,
    label: 'Independent restaurant',
    tension: 'You are the marketing department, and it happens after close — between payroll, a vendor call, and a line that never really ends.',
    outcome: 'A local demand system that runs without you in it.',
    href: '/pricing#foundation',
    cta: 'Foundation model',
  },
  {
    count: '3–10',
    filled: 6,
    label: 'Multi-location group',
    tension: 'Five rooms, five vendors, five versions of the same brand — and no single number that tells you which one is working.',
    outcome: 'One brand, one calendar, one team accountable for the result.',
    href: '/pricing#growth',
    cta: 'Growth model',
  },
  {
    count: '10+',
    filled: 12,
    label: 'Franchise or enterprise',
    tension: 'Corporate ships the assets. Every market posts something else, and the brand arrives differently in each city.',
    outcome: 'A playbook markets follow because it performs locally.',
    href: '/pricing#full-system',
    cta: 'Full System model',
  },
]

// Stable keys for a fixed, never-reordered diagram — the cells have no
// identity of their own beyond their position in the grid.
const CELLS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l']

// Twelve cells, four across. Purely decorative — the count beside it is the
// accessible version of the same information.
function Footprint({ filled }: { filled: number }) {
  return (
    <div aria-hidden="true" className="grid w-[5.25rem] grid-cols-4 gap-1.5">
      {CELLS.map((cell, i) => (
        <span
          className={`aspect-square rounded-[3px] transition-colors duration-500 ease-atrium ${
            i < filled ? 'bg-green-fill' : 'bg-ink/10'
          }`}
          key={cell}
        />
      ))}
    </div>
  )
}

export default function AudiencePaths() {
  return (
    <section className="bg-cream px-[var(--gutter)] py-24 md:py-36">
      <div className="mx-auto max-w-[var(--container-max)]">
        {/* The same two-column opener every other section on the page uses. */}
        <div className="mb-14 grid gap-8 border-t border-line pt-8 lg:grid-cols-12 lg:items-end lg:gap-16 md:mb-20">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-6">Where you are now</Eyebrow>
            <h2 className="max-w-[13ch] text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em]">
              Different footprint. <em className="font-serif italic">Different first move.</em>
            </h2>
          </div>
          <p className="m-0 max-w-md text-base leading-relaxed text-muted lg:col-span-5">
            One dining room, a regional group, and a national rollout do not share a problem — so they should not share a scope. Start with the one that sounds like your week.
          </p>
        </div>

        {/* Cards rather than rows: the old layout put four columns on one line
            per path, which read as a spreadsheet and flattened the copy. */}
        <div className="grid gap-5 md:grid-cols-3">
          {paths.map((path, index) => (
            <TransitionLink
              className="group flex flex-col rounded-card border border-line bg-card p-8 no-underline shadow-soft transition duration-500 ease-atrium hover:-translate-y-1 hover:shadow-float motion-reduce:transition-none motion-reduce:hover:translate-y-0 md:p-9"
              href={path.href}
              key={path.label}
            >
              <div className="flex items-start justify-between gap-6">
                <Footprint filled={path.filled} />
                {/* nowrap: at this size "3–10" would otherwise break over two
                    lines and knock its card's copy out of line with the rest. */}
                <p className="m-0 whitespace-nowrap font-serif text-[clamp(2.75rem,3.6vw,3.75rem)] font-normal leading-none tracking-[-0.05em] text-charcoal">
                  {path.count}
                </p>
              </div>

              <div className="mt-9 border-t border-line pt-6">
                <Eyebrow>Path {String(index + 1).padStart(2, '0')}</Eyebrow>
                <h3 className="mt-3 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-charcoal">
                  <E>{path.label}</E>
                </h3>
                <p className="mt-4 text-base leading-relaxed text-body">{path.tension}</p>
              </div>

              {/* mt-auto pins the outcome and the CTA to the bottom, so the
                  three cards line up on both despite uneven copy lengths. */}
              {/* The outcome takes the serif the rest of the page reserves for
                  the turn in a sentence: it is the answer to the paragraph
                  above it, and at the same weight the two read as one block. */}
              <p className="mt-7 mb-8 font-serif text-[1.2rem] leading-[1.35] text-charcoal italic">
                <E>{path.outcome}</E>
              </p>

              <span className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-6 text-[0.875rem] text-charcoal">
                <span>{path.cta}</span>
                <span
                  aria-hidden="true"
                  className="text-xl transition-transform duration-300 ease-atrium group-hover:translate-x-2 motion-reduce:transition-none"
                >
                  →
                </span>
              </span>
            </TransitionLink>
          ))}
        </div>
      </div>
    </section>
  )
}
