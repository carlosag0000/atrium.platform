import type { ReactNode } from 'react'

import Eyebrow from '@/components/ui/Eyebrow'
import type { MediaBlueprint as MediaBlueprintItem } from '@/lib/media-blueprints'

import MediaBlueprint from './MediaBlueprint'
import styles from './MediaBlueprint.module.css'
import E from '@/components/cms/Editable'

type Props = {
  eyebrow?: string
  headline?: ReactNode
  body?: string
  items: MediaBlueprintItem[]
  tone?: 'light' | 'dark'
  layout?: 'feature' | 'pair' | 'triptych'
}

export default function MediaBlueprintSection({
  eyebrow,
  headline,
  body,
  items,
  tone = 'light',
  layout = 'feature',
}: Props) {
  const headingId = headline ? `media-blueprints-${items.map((item) => item.code).join('-').toLowerCase()}` : undefined

  return (
    <section
      className={`${styles.section} ${styles[tone]}`}
      aria-labelledby={headingId}
    >
      <div className={styles.sectionInner}>
        {(eyebrow || headline || body) && (
          <header className={styles.sectionHeader}>
            {eyebrow && <Eyebrow tone={tone === 'dark' ? 'onDark' : 'default'}><E>{eyebrow}</E></Eyebrow>}
            {headline && <h2 id={headingId} className={styles.sectionTitle}><E>{headline}</E></h2>}
            {body && <p className={styles.sectionBody}><E>{body}</E></p>}
          </header>
        )}

        <div className={`${styles.blueprintGrid} ${styles[layout]}`}>
          {items.map((item, index) => (
            <MediaBlueprint key={item.code} item={item} priority={index === 0} />
          ))}
        </div>
      </div>
    </section>
  )
}
