import { Card } from '@atrium/ui'
import type { BentoCard } from '@/lib/services'
import { parseHeadline } from './utils'

function BentoCardPhoto({ card }: { card: BentoCard }) {
  return (
    <article className="atr-bg-atmos--deep relative flex flex-col justify-between overflow-hidden rounded-card p-[26px] max-sm:p-5 md:row-span-2 min-h-[37rem] max-md:min-h-[30rem] text-cream">
      <div className="absolute inset-0 bg-linear-to-b from-ink/[0.2] to-ink/90" aria-hidden="true" />
      <div className="relative z-1 max-w-[15rem] rounded-full bg-cream/[0.17] px-[0.85rem] py-[0.62rem] text-[0.75rem] leading-[1.25] text-cream/72">
        {card.coverAlt}
      </div>
      <div className="relative z-1 grid gap-[0.9rem]">
        <h3 className="m-0 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15]">
          {parseHeadline(card.title)}
        </h3>
        <p className="m-0 text-[0.875rem] leading-relaxed opacity-76">
          {card.copy}
        </p>
      </div>
    </article>
  )
}

function BentoCardStatement({ card }: { card: BentoCard }) {
  return (
    <Card tone="surface" padding="sm" className="relative flex flex-col justify-between gap-[1rem] overflow-hidden">
      <h3 className="m-0 max-w-[11ch] text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15] text-green">
        {parseHeadline(card.title)}
      </h3>
      <p className="m-0 max-w-[31rem] text-[0.875rem] leading-relaxed text-charcoal/72">
        {card.copy}
      </p>
    </Card>
  )
}

function BentoCardPosition({ card }: { card: BentoCard }) {
  return (
    <Card tone="amber" padding="sm" className="relative flex flex-col justify-between gap-[1rem] overflow-hidden">
      <h3 className="m-0 max-w-[15ch] text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15]">
        {parseHeadline(card.title)}
      </h3>
      <p className="m-0 text-[0.875rem] leading-relaxed opacity-76">
        {card.copy}
      </p>
    </Card>
  )
}

function BentoCardMini({ card }: { card: BentoCard }) {
  return (
    <Card tone="warm" padding="sm" className="relative flex flex-col justify-between gap-[1rem] overflow-hidden">
      <h3 className="m-0 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15]">
        {parseHeadline(card.title)}
      </h3>
      <p className="m-0 text-[0.875rem] leading-relaxed opacity-76">
        {card.copy}
      </p>
    </Card>
  )
}

function BentoCardNeutral({ card }: { card: BentoCard }) {
  return (
    <Card tone="warm" padding="sm" className="relative flex flex-col justify-between gap-3-5 overflow-hidden">
      <h3 className="m-0 text-[clamp(1.35rem,2vw,1.8rem)] leading-[1.15]">
        {parseHeadline(card.title)}
      </h3>
      <p className="m-0 text-[0.875rem] leading-relaxed opacity-76">
        {card.copy}
      </p>
    </Card>
  )
}

export default function ServiceBento({ cards }: { cards: BentoCard[] }) {
  const [feature, proof, position, extra] = cards
  const fallbackCards = cards.slice(0, 3)

  if (!feature || !proof || !position) {
    return (
      <section className="bg-cream px-[var(--gutter)] pt-[1rem] pb-[6.5rem] max-sm:px-[var(--gutter)]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[1rem] max-w-[var(--container-max)] mx-auto">
          {fallbackCards.map(card => (
            <BentoCardNeutral key={card.title} card={card} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="bg-cream px-[var(--gutter)] pt-[1rem] pb-[6.5rem] max-sm:px-[var(--gutter)]">
      <div className="grid md:grid-cols-[0.86fr_1.2fr] md:grid-rows-[minmax(20rem,auto)_16rem] gap-[1rem] max-w-[var(--container-max)] mx-auto max-md:grid-cols-1 max-md:grid-rows-auto">
        <BentoCardPhoto card={feature} />
        <BentoCardStatement card={proof} />
        <BentoCardPosition card={position} />
        {extra && <BentoCardMini card={extra} />}
      </div>
    </section>
  )
}
