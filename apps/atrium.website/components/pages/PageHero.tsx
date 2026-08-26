import { Button, Eyebrow } from '@atrium/ui'
import type { ReactNode } from 'react'
import TransitionButton from '@/components/ui/TransitionButton'
import { CAL_CONFIG } from '@/lib/cal'

type HeroAction = {
  label: string
  /** Real destination — also the fallback if the Cal.com embed script fails to load. */
  href: string
  variant?: 'primary' | 'secondary' | 'accent' | 'mint' | 'outline' | 'ghost' | 'light' | 'outlineLight'
  external?: boolean
  /** When set, the button opens this Cal.com event as a popup instead of navigating. */
  calLink?: string
}

type HeroStat = {
  value: string
  label: string
}

type PageHeroProps = {
  eyebrow: string
  title: ReactNode
  body: string
  actions?: HeroAction[]
  stats?: HeroStat[]
}

/** The opening band of every subpage. A header rather than a hero: it runs on
 *  the section heading scale, not the page-title scale, so a subpage reads as
 *  part of the site instead of a landing page of its own. */
export default function PageHero({ eyebrow, title, body, actions, stats }: PageHeroProps) {
  return (
    <section className="bg-dark px-[var(--gutter)] pt-[7.5rem] pb-16 max-sm:pt-[6rem]">
      <div className="mx-auto grid max-w-[var(--container-max)] gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.6fr)] lg:items-end">
        <div>
          <Eyebrow className="mb-6" tone="on-dark">
            {eyebrow}
          </Eyebrow>
          <h1 className="m-0 max-w-[18ch] text-[clamp(2.6rem,4.5vw,4rem)] leading-[1.08] text-cream">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/[0.78]">
            {body}
          </p>
          {actions && actions.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-4">
              {actions.map((action, index) =>
                action.calLink ? (
                  <Button
                    data-cal-config={CAL_CONFIG}
                    data-cal-link={action.calLink}
                    href={action.href}
                    key={action.href}
                    variant={action.variant ?? (index === 0 ? 'mint' : 'outlineLight')}
                  >
                    {action.label}
                  </Button>
                ) : (
                  <TransitionButton
                    href={action.href}
                    key={action.href}
                    variant={action.variant ?? (index === 0 ? 'mint' : 'outlineLight')}
                    {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {action.label}
                  </TransitionButton>
                ),
              )}
            </div>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="border-cream/25 border-t md:grid md:grid-cols-3 lg:block">
            {stats.map((stat) => (
              <div
                className="grid min-h-28 grid-cols-[minmax(4.5rem,0.7fr)_minmax(0,1fr)] items-center gap-5 border-cream/25 border-b py-5 md:block md:px-5 lg:grid lg:px-0"
                key={`${stat.value}-${stat.label}`}
              >
                <p className="m-0 font-serif text-[clamp(2.75rem,4vw,4.5rem)] font-normal italic leading-none tracking-[-0.04em] text-lime">
                  {stat.value}
                </p>
                <p className="m-0 text-[0.875rem] text-cream/[0.72] md:mt-4 lg:mt-0">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
