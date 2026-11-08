import { Eyebrow } from '@atrium/ui'
import E from '@/components/cms/Editable'

// ─── Comparison vs alternatives (doc vs.md §2.3 / §9.9) ─────────────────────
// Answers the decisive objection: "Why hire Atrium instead of keeping my
// photographer, social manager, and ads agency?"

const columns = ['Atrium', 'Freelancer', 'Generalist agency', 'In-house team'] as const

type Row = { criterion: string; values: [string, string, string, string] }

const rows: Row[] = [
  { criterion: 'Hospitality expertise', values: ['High', 'Variable', 'Low or variable', 'High'] },
  { criterion: 'Strategy + production integrated', values: ['Yes', 'Rarely', 'Sometimes', 'Depends'] },
  { criterion: 'Google, CRM & retention', values: ['Integrated', 'Limited', 'Fragmented', 'Needs specialists'] },
  { criterion: 'On-site production', values: ['Yes', 'Possible', 'Possible', 'Costly'] },
  { criterion: 'Reporting tied to revenue', values: ['Yes', 'Rarely', 'Variable', 'Tool-dependent'] },
  { criterion: 'Multi-location scale', values: ['Built for it', 'Limited', 'Possible', 'Needs hiring'] },
  { criterion: 'One accountable owner', values: ['Yes', 'Partial', 'Yes', 'Internal'] },
  { criterion: 'Operating cadence', values: ['28-day cycle', 'Ad hoc', 'Campaigns or retainers', 'Variable'] },
]

export default function ComparisonMatrix() {
  return (
    <section className="bg-dark px-[var(--gutter)] py-24 md:py-32">
      <div className="mx-auto max-w-[var(--container-max)]">
        <div className="mb-12 max-w-2xl md:mb-16">
          <Eyebrow className="mb-4" tone="on-dark"><E>Why Atrium</E></Eyebrow>
          <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] font-normal leading-[1.08] tracking-[-0.02em] text-cream">
            <E>One accountable team, <em className="font-serif italic">not five vendors.</em></E>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/70">
            <E>The real question isn&apos;t Atrium versus another agency. It&apos;s Atrium versus the
            photographer, the social manager, and the ads shop you&apos;re already juggling.</E>
          </p>
        </div>

        <div className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
          <table className="w-full min-w-[42rem] border-collapse">
            <thead>
              <tr>
                <th className="text-left" aria-hidden />
                {columns.map((col) => {
                  const isAtrium = col === 'Atrium'
                  return (
                    <th
                      key={col}
                      scope="col"
                      className={`px-4 py-4 text-left align-bottom text-[0.875rem] ${
                        isAtrium
                          ? 'rounded-t-md bg-lime/[0.14] text-lime'
                          : 'text-cream/70'
                      }`}
                    >
                      {col}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.criterion} className="border-t border-cream/20">
                  <th scope="row" className="px-4 py-4 text-left text-[0.875rem] text-cream">
                    {row.criterion}
                  </th>
                  {row.values.map((value, i) => {
                    const isAtrium = i === 0
                    return (
                      <td
                        key={columns[i]}
                        className={`px-4 py-4 text-[0.875rem] ${
                          isAtrium ? 'bg-lime/[0.06] text-lime' : 'font-normal text-cream/70'
                        }`}
                      >
                        {value}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
