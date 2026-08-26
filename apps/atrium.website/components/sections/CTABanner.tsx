import { Button, Eyebrow } from '@atrium/ui'
import type { ReactNode } from 'react'
import { PillCTA } from '@/components/ui/PillCTA'
import { CAL_CONFIG } from '@/lib/cal'

type Props = {
  eyebrow?: string
  headline: ReactNode
  body: string
  cta: string
  /** Real destination — also the fallback if the Cal.com embed script fails to load. */
  ctaHref: string
  /** When set, the CTA opens this Cal.com event as a popup instead of navigating. */
  ctaCalLink?: string
  ctaExternal?: boolean
}

// The last thing on the page, and the only thing on it that matters: a
// sentence, a reason, and the button. It used to run two columns, with a
// glass-panel card holding an ampersand and a line of alt text beside the
// copy — a placeholder for a photograph that never arrived, competing with
// the ask. Centred and alone, nothing pulls the eye off the button.
export default function CTABanner({ eyebrow, headline, body, cta, ctaHref, ctaCalLink, ctaExternal }: Props) {
  return (
    <section className="px-[var(--gutter)] py-24 md:py-32" style={{ background: 'var(--color-ink)' }}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        {eyebrow && <Eyebrow tone="on-dark">{eyebrow}</Eyebrow>}
        <h2 className="text-[clamp(2.6rem,4.5vw,4rem)] leading-[1.08] text-cream">
          {headline}
        </h2>
        {/* `mx-auto` as well as `text-center`: globals.css caps every `main p`
            at 72ch, and a capped block with default margins hugs the left edge
            — centring the text inside it is not the same as centring it. */}
        <p className="m-0 mx-auto max-w-xl text-base leading-relaxed text-cream/[0.78]">{body}</p>
        <div className="mt-2">
          {ctaCalLink ? (
            <Button
              className="group"
              data-cal-config={CAL_CONFIG}
              data-cal-link={ctaCalLink}
              href={ctaHref}
              size="pill"
              variant="light"
            >
              {cta}
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-cream transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Button>
          ) : (
            <PillCTA external={ctaExternal} href={ctaHref} tone="on-dark">
              {cta}
            </PillCTA>
          )}
        </div>
      </div>
    </section>
  )
}
