import { Tag } from '@atrium/ui'
import { CATEGORY_COLOR } from './utils'

/** The stage a service belongs to, as a tinted pill. Shape, radius and type
 *  come from the design system's Tag; only the stage tint is local — the
 *  accent lightened to 72% over white, which keeps charcoal above 4.5:1 on all
 *  three stages (generate 6.02:1, convert 10.13:1, retain 4.71:1). */
export default function CategoryBadge({ category }: { category: string }) {
  return (
    <Tag
      className="border-transparent uppercase tracking-[0.14em]"
      size="sm"
      style={{ background: `color-mix(in srgb, ${CATEGORY_COLOR[category]} 72%, white)` }}
      variant="outline"
    >
      {category}
    </Tag>
  )
}
