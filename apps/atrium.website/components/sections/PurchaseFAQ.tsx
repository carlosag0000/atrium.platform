import { Eyebrow } from '@atrium/ui'

type FAQItem = {
  question: string
  answer: string
  signal: string
}

const purchaseQuestions: FAQItem[] = [
  {
    question: 'What is the minimum engagement?',
    answer: 'We scope the smallest complete system that can solve the problem. The minimum depends on location count, active channels, production needs, and how much your internal team already owns.',
    signal: 'Scope',
  },
  {
    question: 'How long does onboarding take?',
    answer: 'Onboarding is the first 28-day cycle: discovery, access, measurement setup, strategy lock, and the first production or activation sprint. Your exact launch sequence is mapped before work begins.',
    signal: '28 days',
  },
  {
    question: 'Is media spend included?',
    answer: 'No. Media spend stays separate from Atrium fees, so you can see what funds the work and what goes directly to platforms. We recommend the budget; you approve it.',
    signal: 'Transparent',
  },
  {
    question: 'How many production sessions are included?',
    answer: 'Production cadence follows the content demand of the scope. We define shoot frequency, locations, outputs, and reuse plan before the engagement starts instead of hiding them inside a generic package.',
    signal: 'Planned',
  },
  {
    question: 'Do you work with one location?',
    answer: 'Yes. Atrium works with strong single-location concepts as well as regional groups and multi-location brands. The operating model changes; the standard of measurement does not.',
    signal: '1–many',
  },
  {
    question: 'Who approves the content?',
    answer: 'You name one accountable approver. Atrium brings the strategy, calendar, and work into a clear review rhythm so operators are not chasing approvals across email threads.',
    signal: 'One owner',
  },
  {
    question: 'Does Atrium replace our internal team?',
    answer: 'Not by default. We can operate as the full growth team or fill the gaps around an existing marketing lead. Ownership is made explicit so work does not get duplicated or dropped.',
    signal: 'Embedded',
  },
  {
    question: 'How do you attribute revenue?',
    answer: 'We connect the measurable path available to your business—campaign links, booking or ordering events, CRM activity, and POS data where access allows. Reports separate direct results from influenced outcomes.',
    signal: 'Evidence',
  },
  {
    question: 'What happens to our current vendors?',
    answer: 'Keep the partners who are working. Atrium can coordinate them inside one strategy and reporting cadence, replace a fragmented handoff, or take full ownership. We decide that during discovery.',
    signal: 'No reset',
  },
  {
    question: 'Which platforms do you integrate?',
    answer: 'The stack is selected around your operation: Google Business Profile, Meta, email and SMS, CRM, reservations, ordering, analytics, and compatible POS systems. We confirm access and integration depth in the diagnostic.',
    signal: 'Your stack',
  },
]

type Props = {
  heading?: string
  intro?: string
  limit?: number
  dark?: boolean
}

export default function PurchaseFAQ({
  heading = 'The questions that matter before you hire us.',
  intro = 'Clear scope, clear ownership, clear measurement. If the answer depends on your operation, we say that before the proposal—not after the invoice.',
  limit,
  dark = false,
}: Props) {
  const items = limit ? purchaseQuestions.slice(0, limit) : purchaseQuestions

  return (
    <section className={`px-[var(--gutter)] py-24 md:py-36 ${dark ? 'bg-dark' : 'bg-cream'}`}>
      <div className="mx-auto grid max-w-[var(--container-max)] gap-14 lg:grid-cols-12 lg:gap-20">
        <div className="self-start lg:sticky lg:top-32 lg:col-span-4">
          <Eyebrow tone={dark ? 'on-dark' : 'default'} className="mb-6">Before we start</Eyebrow>
          <h2 className={`m-0 max-w-[12ch] type-subsection-title ${dark ? 'text-cream' : 'text-charcoal'}`}>
            {heading}
          </h2>
          <p className={`mt-7 max-w-sm text-base leading-relaxed ${dark ? 'text-cream/70' : 'text-muted'}`}>
            {intro}
          </p>
        </div>

        <div className={`border-t lg:col-span-8 ${dark ? 'border-cream/20' : 'border-line'}`}>
          {items.map((item, index) => (
            <article
              key={item.question}
              className={`grid gap-5 border-b py-8 sm:grid-cols-[5rem_minmax(0,1fr)] md:gap-8 md:py-10 ${dark ? 'border-cream/20' : 'border-line'}`}
            >
              <div className="flex items-baseline justify-between gap-4 sm:block">
                <p className={`m-0 text-[0.7rem] uppercase tracking-[0.14em] ${dark ? 'text-lime' : 'text-green'}`}>
                  {String(index + 1).padStart(2, '0')}
                </p>
                <p className={`m-0 sm:mt-3 text-[0.7rem] uppercase tracking-[0.14em] ${dark ? 'text-cream/70' : 'text-muted'}`}>
                  {item.signal}
                </p>
              </div>
              <div>
                <h3 className={`max-w-[24ch] text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] ${dark ? 'text-cream' : 'text-charcoal'}`}>
                  {item.question}
                </h3>
                <p className={`mt-4 max-w-2xl text-base leading-relaxed ${dark ? 'text-cream/70' : 'text-muted'}`}>
                  {item.answer}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
