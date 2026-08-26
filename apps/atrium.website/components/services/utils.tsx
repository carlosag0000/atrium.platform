import type { ReactNode } from 'react'

/** Splits `*accented*` markup into plain text and `<em>` runs. Pass
 *  `emClassName` only for a section-level headline earning the one
 *  serif-italic accent per composition; repeated card titles (bento,
 *  deliverables) stay uncoloured, inheriting the card's own text tone —
 *  matching the pattern already established in BentoGrid. */
export function parseHeadline(raw: string, emClassName?: string): ReactNode[] {
  return raw.split('*').map((part, i) =>
    i % 2 === 1 ? <em key={part} className={emClassName}>{part}</em> : part
  )
}

/** The three Growth Engine stages, in one table. Every surface that colours by
 *  stage reads from here — the services index, the category badge, the sibling
 *  rail and the mega menu — so a stage can't wear one colour in the menu and
 *  another on the page.
 *
 *  `accent` and `pillFill` are deliberately different values, not a mistake:
 *  the accent is the stage's identity colour, used for text on the page ground
 *  and for the diagram's dots. It cannot carry a filled pill — stage-generate
 *  measures 3.59:1 against cream and 3.89:1 against charcoal, and the menu's
 *  pill label is 22px normal weight, which needs 4.5:1. The pill fills below
 *  clear it with room: lime 11.49:1, amber 10.43:1, green 5.32:1. Recheck both
 *  columns if the palette moves. */
export const STAGES = {
  'Generate Demand': { accent: 'var(--stage-generate)', pillFill: 'bg-lime text-charcoal' },
  'Convert Demand':  { accent: 'var(--stage-convert)',  pillFill: 'bg-amber text-charcoal' },
  'Retain Demand':   { accent: 'var(--stage-retain)',   pillFill: 'bg-green text-cream' },
} as const satisfies Record<string, { accent: string; pillFill: string }>

export type StageName = keyof typeof STAGES

export const CATEGORY_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(STAGES).map(([name, stage]) => [name, stage.accent])
)
