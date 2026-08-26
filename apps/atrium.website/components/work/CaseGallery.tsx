'use client'

import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CaseGalleryImage } from '@/lib/work'

type CaseGalleryProps = {
  client: string
  images?: CaseGalleryImage[]
}

type LayoutItem = {
  id: string
  image: CaseGalleryImage
  sourceIndex: number
  x: number
  y: number
  width: number
  height: number
}

type Point = {
  x: number
  y: number
}

const fallbackImages: CaseGalleryImage[] = [
  {
    src: 'https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg',
    alt: '{client} visual content sample',
    width: 900,
    height: 1200,
  },
  {
    src: 'https://framerusercontent.com/images/aNsAT3jCvt4zglbWCUoFe33Q.jpg',
    alt: '{client} hospitality campaign asset',
    width: 1200,
    height: 900,
  },
  {
    src: 'https://framerusercontent.com/images/BYnxEV1zjYb9bhWh1IwBZ1ZoS60.jpg',
    alt: '{client} social media creative frame',
    width: 900,
    height: 1125,
  },
  {
    src: 'https://framerusercontent.com/images/2uTNEj5aTl2K3NJaEFWMbnrA.jpg',
    alt: '{client} restaurant content detail',
    width: 1200,
    height: 900,
  },
  {
    src: 'https://framerusercontent.com/images/f9RiWoNpmlCMqVRIHz8l8wYfeI.jpg',
    alt: '{client} campaign gallery image',
    width: 900,
    height: 1200,
  },
]

const cloneOffsets = [-1, 0, 1]
const centerCloneIndex = 4

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function wrap(value: number, size: number) {
  if (size <= 0) return value
  return ((value % size) + size) % size
}

function getImageRatio(image: CaseGalleryImage, index: number) {
  if (image.width && image.height) {
    return clamp(image.height / image.width, 0.62, 1.58)
  }

  const ratios = [1.32, 0.78, 1.18, 0.92, 1.46, 0.7]
  return ratios[index % ratios.length] ?? 1
}

function resolveAlt(image: CaseGalleryImage, client: string) {
  return image.alt.replaceAll('{client}', client)
}

export default function CaseGallery({ client, images = [] }: CaseGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRefs = useRef<Array<HTMLDivElement | null>>([])
  const currentPositionRef = useRef<Point>({ x: 0, y: 0 })
  const targetPositionRef = useRef<Point>({ x: 0, y: 0 })
  const dragStartRef = useRef<Point>({ x: 0, y: 0 })
  const dragOriginRef = useRef<Point>({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const touchGestureRef = useRef<'pending' | 'drag' | 'scroll'>('pending')
  const gridSizeRef = useRef({ width: 0, height: 0 })
  const frameRef = useRef<number | null>(null)

  const [containerSize, setContainerSize] = useState({ width: 1200, height: 720 })
  const [isDragging, setIsDragging] = useState(false)
  const [failedSources, setFailedSources] = useState<Set<string>>(() => new Set())

  const sourceImages = useMemo(() => {
    const preferredImages = images.filter((image) => image.src.trim().length > 0)
    const selectedImages = preferredImages.length > 0 ? preferredImages : fallbackImages
    const withoutFailures = selectedImages.filter((image) => !failedSources.has(image.src))
    return withoutFailures.length > 0 ? withoutFailures : selectedImages
  }, [images, failedSources])

  const masonry = useMemo(() => {
    if (sourceImages.length === 0) {
      return {
        items: [],
        gridSize: { width: 0, height: 0 },
      }
    }

    const isSmall = containerSize.width < 640
    const gap = isSmall ? 8 : 12
    const tileWidth = Math.round(clamp(containerSize.width / (isSmall ? 2.75 : 5.8), isSmall ? 118 : 148, isSmall ? 172 : 238))
    const columns = Math.max(isSmall ? 4 : 7, Math.ceil(containerSize.width / (tileWidth + gap)) + 3)
    const rows = Math.ceil(containerSize.height / Math.max(tileWidth * 1.05, 1)) + 4
    const itemCount = Math.min(Math.max(columns * rows, sourceImages.length * 4), isSmall ? 64 : 88)
    const columnHeights = Array.from({ length: columns }, () => 0)
    const layout: LayoutItem[] = []

    for (let index = 0; index < itemCount; index++) {
      const image = sourceImages[index % sourceImages.length]
      if (!image) continue

      const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights))
      const currentColumnHeight = columnHeights[shortestColumn] ?? 0
      const ratio = getImageRatio(image, index)
      const height = Math.round(tileWidth * ratio)
      const x = shortestColumn * (tileWidth + gap)
      const y = currentColumnHeight
      const sourceIndex = index % sourceImages.length

      layout.push({
        id: `${image.src}-${sourceIndex}-${x}-${y}`,
        image,
        sourceIndex,
        x,
        y,
        width: tileWidth,
        height,
      })

      columnHeights[shortestColumn] = currentColumnHeight + height + gap
    }

    const width = columns * tileWidth + (columns - 1) * gap
    const height = Math.max(...columnHeights)

    return {
      items: layout,
      gridSize: { width, height },
    }
  }, [containerSize.height, containerSize.width, sourceImages])

  const applyGridTransforms = useCallback((position: Point) => {
    const { width, height } = gridSizeRef.current
    if (width <= 0 || height <= 0) return

    const wrappedX = wrap(position.x, width)
    const wrappedY = wrap(position.y, height)

    gridRefs.current.forEach((grid, index) => {
      if (!grid) return

      const xOffset = (index % 3) - 1
      const yOffset = Math.floor(index / 3) - 1
      const translateX = wrappedX + xOffset * width
      const translateY = wrappedY + yOffset * height

      grid.style.transform = `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), 0)`
    })
  }, [])

  const animate = useCallback(() => {
    frameRef.current = null

    const current = currentPositionRef.current
    const target = targetPositionRef.current
    const deltaX = target.x - current.x
    const deltaY = target.y - current.y

    if (Math.abs(deltaX) < 0.08 && Math.abs(deltaY) < 0.08) {
      currentPositionRef.current = target
      applyGridTransforms(target)
      return
    }

    const next = {
      x: current.x + deltaX * 0.14,
      y: current.y + deltaY * 0.14,
    }

    currentPositionRef.current = next
    applyGridTransforms(next)
    frameRef.current = requestAnimationFrame(animate)
  }, [applyGridTransforms])

  const scheduleAnimation = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(animate)
  }, [animate])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      setContainerSize({
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(420, Math.round(rect.height)),
      })
    }

    updateSize()

    const resizeObserver = new ResizeObserver(updateSize)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    gridSizeRef.current = masonry.gridSize
    applyGridTransforms(currentPositionRef.current)
  }, [applyGridTransforms, masonry.gridSize])

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return

    isDraggingRef.current = true
    touchGestureRef.current = 'pending'
    dragStartRef.current = { x: event.clientX, y: event.clientY }
    dragOriginRef.current = targetPositionRef.current
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return

    const rawDeltaX = event.clientX - dragStartRef.current.x
    const rawDeltaY = event.clientY - dragStartRef.current.y

    if (event.pointerType === 'touch') {
      if (touchGestureRef.current === 'pending') {
        const distance = Math.hypot(rawDeltaX, rawDeltaY)
        if (distance < 7) return
        touchGestureRef.current = Math.abs(rawDeltaX) >= Math.abs(rawDeltaY) ? 'drag' : 'scroll'
      }

      if (touchGestureRef.current === 'scroll') return
    }

    targetPositionRef.current = {
      x: dragOriginRef.current.x + rawDeltaX * 1.35,
      y: dragOriginRef.current.y + rawDeltaY * (event.pointerType === 'touch' ? 0.45 : 1.15),
    }
    scheduleAnimation()
  }, [scheduleAnimation])

  const endDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false
    touchGestureRef.current = 'pending'
    setIsDragging(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }, [])

  const handleWheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return

    targetPositionRef.current = {
      x: targetPositionRef.current.x - event.deltaX * 1.2,
      y: targetPositionRef.current.y,
    }
    scheduleAnimation()
  }, [scheduleAnimation])

  const clonePositions = useMemo(
    () =>
      cloneOffsets.flatMap((yOffset) =>
        cloneOffsets.map((xOffset) => ({
          xOffset,
          yOffset,
        }))
      ),
    []
  )

  return (
    <section className="px-3 md:px-4" style={{ background: 'var(--color-cream)' }} aria-label={`${client} case study image gallery`}>
        <div
          ref={containerRef}
          className="relative min-h-[68vh] overflow-hidden rounded-(--radius-bento) border md:min-h-[68vh]"
          style={{
            background: 'var(--color-card)',
            borderColor: 'rgba(7,47,52,0.10)',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'pan-y pinch-zoom',
            userSelect: 'none',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onWheel={handleWheel}
        >
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 24%, rgba(7,47,52,0.20) 100%)',
            }}
          />

          {clonePositions.map(({ xOffset, yOffset }, cloneIndex) => {
            const isCenterClone = cloneIndex === centerCloneIndex

            return (
              <div
                key={`${xOffset}-${yOffset}`}
                ref={(node) => {
                  gridRefs.current[cloneIndex] = node
                }}
                className="absolute top-1/2 left-1/2 will-change-transform"
                style={{
                  width: masonry.gridSize.width,
                  height: masonry.gridSize.height,
                  transform: `translate3d(calc(-50% + ${xOffset * masonry.gridSize.width}px), calc(-50% + ${yOffset * masonry.gridSize.height}px), 0)`,
                }}
                aria-hidden={!isCenterClone}
              >
                {masonry.items.map((item, index) => {
                  const isPrimaryOccurrence = isCenterClone && index < sourceImages.length
                  const hasFailed = failedSources.has(item.image.src)

                  return (
                    <div
                      key={item.id}
                      className="absolute overflow-hidden rounded-[var(--radius-float)] border bg-[var(--color-off-white)] shadow-[0_18px_48px_rgba(7,47,52,0.12)]"
                      style={{
                        left: item.x,
                        top: item.y,
                        width: item.width,
                        height: item.height,
                        borderColor: 'rgba(7,47,52,0.08)',
                      }}
                    >
                      {hasFailed ? (
                        <div className="flex items-end p-3 h-full text-xs " style={{ color: 'var(--color-dark)' }}>
                          {client}
                        </div>
                      ) : (
                        // biome-ignore lint/performance/noImgElement: Case media can come from arbitrary client asset URLs, while next/image requires a controlled remote allowlist.
                        <img
                          src={item.image.src}
                          srcSet={item.image.srcSet}
                          sizes={item.image.sizes ?? '(max-width: 640px) 42vw, 18vw'}
                          alt={isPrimaryOccurrence ? resolveAlt(item.image, client) : ''}
                          className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.04]"
                          draggable={false}
                          loading={isCenterClone && index < 8 ? 'eager' : 'lazy'}
                          decoding="async"
                          fetchPriority={isCenterClone && index < 2 ? 'high' : 'low'}
                          onError={() => {
                            setFailedSources((current) => {
                              const next = new Set(current)
                              next.add(item.image.src)
                              return next
                            })
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
    </section>
  )
}
