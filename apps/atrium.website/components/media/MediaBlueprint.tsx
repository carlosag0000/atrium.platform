import Image from 'next/image'

import {
  type BlueprintRatio,
  blueprintLabel,
  type MediaBlueprint as MediaBlueprintItem,
  type RealMediaBlueprint,
} from '@/lib/media-blueprints'

import styles from './MediaBlueprint.module.css'
import E from '@/components/cms/Editable'

type Props = {
  item: MediaBlueprintItem
  priority?: boolean
  showBrief?: boolean
}

const ratioClasses: Record<BlueprintRatio, string> = {
  '16:9': 'ratioLandscape',
  '4:3': 'ratioStandard',
  '3:4': 'ratioPortrait',
  '1:1': 'ratioSquare',
  '9:16': 'ratioVertical',
  wide: 'ratioWide',
}

function ProductionBrief({ item, hidden = false }: { item: MediaBlueprintItem; hidden?: boolean }) {
  return (
    <figcaption className={hidden ? styles.visuallyHidden : styles.brief}>
      <span>{blueprintLabel(item)}</span>
      <strong><E>{item.title}</E></strong>
      <span>{item.direction}</span>
    </figcaption>
  )
}

function PlannedVisual() {
  return (
    <div className={styles.visual} aria-hidden="true">
      <span className={styles.cropMark} />
      <span className={styles.orbit} />
      <span className={styles.subjectPlane} />
      <span className={styles.fragmentOne} />
      <span className={styles.fragmentTwo} />
      <span className={styles.fragmentThree} />
      <span className={styles.fragmentFour} />
    </div>
  )
}

function hasRealSource(item: MediaBlueprintItem): item is RealMediaBlueprint {
  return typeof item.src === 'string' && item.src.trim().length > 0
}

export default function MediaBlueprint({ item, priority = false, showBrief = true }: Props) {
  const ratioClass = ratioClasses[item.ratio]
  const frameClassName = [styles.frame, styles[item.kind], styles[ratioClass], item.className]
    .filter(Boolean)
    .join(' ')
  if (hasRealSource(item)) {
    const isVideo = item.assetType === 'video' || item.assetType === 'reel'

    return (
      <figure className={`${frameClassName} ${styles.realMedia}`}>
        <div className={styles.mediaVisual}>
          {isVideo && item.audio === 'speech' ? (
            <video
              className={styles.media}
              controls
              playsInline
              poster={item.poster}
              preload="metadata"
              aria-label={item.alt || undefined}
            >
              <source src={item.src} />
              <track
                default
                kind="captions"
                src={item.captionsSrc}
                srcLang={item.captionsLanguage ?? 'en'}
                label={item.captionsLabel ?? 'English'}
              />
            </video>
          ) : isVideo ? (
            <video
              className={styles.media}
              controls
              muted
              playsInline
              poster={item.poster}
              preload="metadata"
              aria-label={item.alt || undefined}
            >
              <source src={item.src} />
            </video>
          ) : (
            <Image
              className={styles.media}
              src={item.src}
              alt={item.alt}
              fill
              priority={priority}
              sizes="(min-width: 1200px) 60vw, (min-width: 768px) 70vw, 100vw"
            />
          )}
        </div>
        <ProductionBrief item={item} hidden={!showBrief} />
      </figure>
    )
  }

  return (
    <figure className={frameClassName}>
      <PlannedVisual />
      <ProductionBrief item={item} hidden={!showBrief} />
    </figure>
  )
}
