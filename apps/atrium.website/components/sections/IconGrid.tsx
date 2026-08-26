'use client'
import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import type { IconItem } from '@/lib/services'

type Props = { items: IconItem[]; bg?: string }

export default function IconGrid({ items, bg }: Props) {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!gridRef.current) return
    const cards = gridRef.current.querySelectorAll('.icon-card')
    const ctx = gsap.context(() => {
      gsap.fromTo(cards,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: gridRef.current, start: 'top 80%', once: true },
        }
      )
    })
    return () => ctx.revert()
  }, [])

  return (
    <section className="px-6 md:px-12 py-20 md:py-28" style={{ background: bg ?? 'var(--color-cream)' }}>
      <div className="max-w-6xl mx-auto">
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px"
          style={{ border: '1px solid var(--color-track)', borderRadius: '1.25rem', overflow: 'hidden' }}
        >
          {items.map((item, i) => (
            <div
              key={item.title}
              className="icon-card flex flex-col gap-3 px-8 py-8"
              style={{
                background: 'var(--color-cream)',
                borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--color-track)' : undefined,
                borderBottom: i < items.length - 3 ? '1px solid var(--color-track)' : undefined,
                opacity: 0,
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs "
                style={{ background: 'var(--color-ink)', color: 'var(--color-lime)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <p className="type-card-title" style={{ color: 'var(--color-ink)' }}>
                {item.title}
              </p>
              <p className="type-caption" style={{ color: 'var(--color-ink)', opacity: 0.72 }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
