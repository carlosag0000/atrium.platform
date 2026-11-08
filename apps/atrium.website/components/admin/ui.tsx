'use client'

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { fmtNum } from './api'

// Small building blocks for the dashboard: cards, KPI tiles, an area chart, bar lists and a heatmap.
// Series colour: --mint-500 (#1e8c7c). Comparison period: dashed --teal-300 (#8b9092).

export const C = {
  ink: '#042f34',
  muted: '#61686a',
  faint: '#8b9092',
  line: 'rgba(4,47,52,0.10)',
  series: '#1e8c7c',
  seriesFill: 'rgba(30,140,124,0.14)',
  bar: 'rgba(30,140,124,0.13)',
  mint: '#b8e89a',
  page: '#f3efe4',
  up: '#0e6e64',
  down: '#a3321f',
}

export function Card({ title, action, children, className = '', pad = true }: { title?: ReactNode | undefined; action?: ReactNode | undefined; children: ReactNode; className?: string | undefined; pad?: boolean | undefined }) {
  return (
    <section className={`min-w-0 rounded-2xl bg-white ${className}`} style={{ border: `1px solid ${C.line}` }}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
          {title && (
            <h2 className="m-0 text-[0.95rem] font-semibold" style={{ color: C.ink }}>
              {title}
            </h2>
          )}
          {action}
        </header>
      )}
      <div className={pad ? 'px-5 pb-5' : ''}>{children}</div>
    </section>
  )
}

export function Delta({ now, prev, invert = false, suffix = '%' }: { now: number; prev: number; invert?: boolean | undefined; suffix?: string | undefined }) {
  if (!prev && !now) return <span style={{ color: C.faint }}>—</span>
  if (!prev) return <span style={{ color: C.faint }}>new</span>
  const pct = ((now - prev) / prev) * 100
  if (Math.abs(pct) < 0.5) return <span style={{ color: C.faint }}>→ 0{suffix}</span>
  const good = invert ? pct < 0 : pct > 0
  return (
    <span style={{ color: good ? C.up : C.down }} title={`Previous period: ${fmtNum(Math.round(prev * 100) / 100)}`}>
      {pct > 0 ? '▲' : '▼'} {Math.abs(pct) >= 100 ? Math.round(Math.abs(pct)) : Math.abs(pct).toFixed(1)}
      {suffix}
    </span>
  )
}

export function Kpi({
  label,
  value,
  now,
  prev,
  invert,
  active,
  onClick,
  hint,
}: {
  label: string
  value: string
  now: number
  prev: number
  invert?: boolean | undefined
  active?: boolean | undefined
  onClick?: (() => unknown) | undefined
  hint?: string | undefined
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      title={hint}
      className="min-w-0 rounded-2xl bg-white px-4 py-4 text-left transition"
      style={{ border: `1px solid ${active ? C.series : C.line}`, boxShadow: active ? `inset 0 -3px 0 ${C.series}` : undefined }}
    >
      <div className="truncate text-[0.8rem] font-medium" style={{ color: C.muted }}>
        {label}
      </div>
      <div className="mt-1 text-[1.6rem] leading-tight font-semibold tabular-nums" style={{ color: C.ink }}>
        {value}
      </div>
      <div className="mt-1 text-[0.8rem] tabular-nums">
        <Delta now={now} prev={prev} invert={invert} />
      </div>
    </Tag>
  )
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => e && setW(Math.floor(e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

function niceMax(v: number) {
  if (v <= 4) return 4
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}

export type Point = { label: string; tip: string; value: number; prev?: number | undefined; prevTip?: string | undefined }

/** Area chart with a dashed comparison line and a hover crosshair + tooltip. */
export function AreaChart({ points, name, format = fmtNum, height = 240 }: { points: Point[]; name: string; format?: (n: number) => string | undefined; height?: number | undefined }) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const padL = 40
  const padR = 12
  const padT = 12
  const padB = 26
  const hasPrev = points.some((p) => p.prev !== undefined)
  const max = niceMax(Math.max(1, ...points.map((p) => Math.max(p.value, p.prev ?? 0))))
  const iw = Math.max(1, width - padL - padR)
  const ih = height - padT - padB
  const x = (i: number) => padL + (points.length <= 1 ? iw / 2 : (i / (points.length - 1)) * iw)
  const y = (v: number) => padT + ih - (v / max) * ih
  const line = (get: (p: Point) => number) => points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(get(p)).toFixed(1)}`).join('')
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(iw / 70))))

  function onMove(e: React.PointerEvent<SVGRectElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const rel = (e.clientX - r.left) / r.width
    setHover(Math.max(0, Math.min(points.length - 1, Math.round(rel * (points.length - 1)))))
  }

  const h = hover !== null ? points[hover] : null
  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${name} over time`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke={C.line} />
              <text x={padL - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={C.faint}>
                {fmtNum(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 ? (
              <text key={p.label + i} x={x(i)} y={height - 6} textAnchor="middle" fontSize="11" fill={C.faint}>
                {p.label}
              </text>
            ) : null,
          )}
          {hasPrev && <path d={line((p) => p.prev ?? 0)} fill="none" stroke={C.faint} strokeWidth={1.5} strokeDasharray="4 4" />}
          <path d={`${line((p) => p.value)}L${x(points.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={C.seriesFill} />
          <path d={line((p) => p.value)} fill="none" stroke={C.series} strokeWidth={2} strokeLinejoin="round" />
          {h && hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke={C.ink} strokeOpacity={0.25} />
              <circle cx={x(hover)} cy={y(h.value)} r={4.5} fill={C.series} stroke="#fff" strokeWidth={2} />
            </g>
          )}
          <rect
            x={padL}
            y={padT}
            width={iw}
            height={ih}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            style={{ cursor: 'crosshair' }}
          />
        </svg>
      )}
      {h && hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl bg-white px-3 py-2 text-[0.8rem] shadow-lg"
          style={{
            border: `1px solid ${C.line}`,
            left: Math.min(Math.max(x(hover) - 80, 0), Math.max(0, width - 170)),
            top: 0,
            width: 170,
          }}
        >
          <div className="font-semibold" style={{ color: C.ink }}>
            {h.tip}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2" style={{ color: C.ink }}>
            <span className="flex items-center gap-1.5">
              <i className="inline-block h-[3px] w-3 rounded" style={{ background: C.series }} /> {name}
            </span>
            <b className="tabular-nums">{format(h.value)}</b>
          </div>
          {h.prev !== undefined && (
            <div className="mt-0.5 flex items-center justify-between gap-2" style={{ color: C.muted }}>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-0 w-3 border-t-2 border-dashed" style={{ borderColor: C.faint }} /> {h.prevTip ?? 'Previous'}
              </span>
              <span className="tabular-nums">{format(h.prev)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Legend({ items }: { items: { label: string; dashed?: boolean | undefined }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[0.8rem]" style={{ color: C.muted }}>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          {it.dashed ? (
            <i className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: C.faint }} />
          ) : (
            <i className="inline-block h-[3px] w-4 rounded" style={{ background: C.series }} />
          )}
          {it.label}
        </span>
      ))}
    </div>
  )
}

export type BarItem = { key: string; label: ReactNode; value: number; extra?: ReactNode | undefined; title?: string | undefined; onClick?: (() => unknown) | undefined }

/** Ranked list with a proportional bar behind each row. */
export function BarList({ items, valueLabel, extraLabel, empty = 'No data yet for this period.', limit = 8 }: { items: BarItem[]; valueLabel: string; extraLabel?: string | undefined; empty?: string | undefined; limit?: number | undefined }) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, limit)
  const max = Math.max(1, ...items.map((i) => i.value))
  if (!items.length) return <Empty>{empty}</Empty>
  return (
    <div>
      <div className="mb-1 flex justify-between gap-3 px-1 text-[0.75rem] font-medium tracking-wide uppercase" style={{ color: C.faint }}>
        <span />
        <span className="flex gap-6">
          {extraLabel && <span className="w-14 text-right">{extraLabel}</span>}
          <span className="w-14 text-right">{valueLabel}</span>
        </span>
      </div>
      <ul className="m-0 grid list-none gap-1 p-0">
        {shown.map((it) => {
          const Row = it.onClick ? 'button' : 'div'
          return (
            <li key={it.key}>
              <Row
                type={it.onClick ? 'button' : undefined}
                onClick={it.onClick}
                title={it.title}
                className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg px-2 py-1.5 text-left text-[0.875rem]"
                style={{ color: C.ink }}
              >
                <span className="absolute inset-y-0 left-0 rounded-lg" style={{ width: `${(it.value / max) * 100}%`, background: C.bar }} aria-hidden="true" />
                <span className="relative min-w-0 truncate">{it.label}</span>
                <span className="relative flex shrink-0 gap-6 tabular-nums">
                  {extraLabel && (
                    <span className="w-14 text-right" style={{ color: C.muted }}>
                      {it.extra}
                    </span>
                  )}
                  <span className="w-14 text-right font-semibold">{fmtNum(it.value)}</span>
                </span>
              </Row>
            </li>
          )
        })}
      </ul>
      {items.length > limit && (
        <button type="button" onClick={() => setAll((a) => !a)} className="mt-2 px-2 text-[0.8rem] font-semibold underline" style={{ color: C.series }}>
          {all ? 'Show less' : `Show all ${items.length}`}
        </button>
      )}
    </div>
  )
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Day-of-week × hour heatmap, single-hue sequential scale. */
export function Heatmap({ cells }: { cells: { dow: number; hour: number; count: number }[] }) {
  const grid = useMemo<number[][]>(() => {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0) as number[])
    for (const c of cells) {
      const row = g[(c.dow - 1 + 7) % 7]
      if (row) row[c.hour] = c.count
    }
    return g
  }, [cells])
  const max = Math.max(1, ...grid.flat())
  const [tip, setTip] = useState('')
  if (!cells.length) return <Empty>No visits yet for this period.</Empty>
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: 2, minWidth: 520 }}>
          <tbody>
            {grid.map((row, d) => (
              <tr key={DOW[d]}>
                <th className="pr-2 text-right text-[0.75rem] font-medium" style={{ color: C.muted }}>
                  {DOW[d]}
                </th>
                {row.map((n, h) => {
                  const t = n / max
                  const label = `${DOW[d]} ${h}:00–${h + 1}:00 · ${n} page view${n === 1 ? '' : 's'}`
                  return (
                    <td
                      key={h}
                      title={label}
                      onPointerEnter={() => setTip(label)}
                      className="h-5 rounded-[3px]"
                      style={{ background: n ? `rgba(30,140,124,${0.12 + t * 0.88})` : 'rgba(4,47,52,0.04)' }}
                    />
                  )
                })}
              </tr>
            ))}
            <tr>
              <th />
              {Array.from({ length: 24 }, (_, h) => (
                <td key={h} className="text-center text-[0.65rem]" style={{ color: C.faint }}>
                  {h % 3 === 0 ? (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`) : ''}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[0.75rem]" style={{ color: C.muted }}>
        <span>{tip || 'Hover a square for details. Times are in the dashboard timezone.'}</span>
        <span className="flex items-center gap-1">
          Fewer
          {[0.12, 0.34, 0.56, 0.78, 1].map((a) => (
            <i key={a} className="inline-block h-3 w-3 rounded-[2px]" style={{ background: `rgba(30,140,124,${a})` }} />
          ))}
          More
        </span>
      </div>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 rounded-xl px-4 py-6 text-center text-[0.875rem]" style={{ color: C.muted, background: 'rgba(4,47,52,0.03)' }}>
      {children}
    </p>
  )
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex flex-wrap rounded-full p-1" role="tablist" aria-label={label} style={{ background: 'rgba(4,47,52,0.06)' }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className="rounded-full px-3 py-1 text-[0.8rem] font-medium transition"
          style={{ background: value === o.value ? '#fff' : 'transparent', color: C.ink, boxShadow: value === o.value ? '0 1px 2px rgba(0,0,0,0.08)' : undefined }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Pill({ children, bg = 'rgba(4,47,52,0.07)' }: { children: ReactNode; bg?: string | undefined }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.75rem] font-medium capitalize" style={{ background: bg, color: C.ink }}>
      {children}
    </span>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label="Loading">
      <span className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: `${C.line}`, borderTopColor: C.series }} />
    </div>
  )
}

export function Button({ children, onClick, href, variant = 'primary', disabled, type = 'button', download, target }: { children: ReactNode; onClick?: (() => unknown) | undefined; href?: string | undefined; variant?: 'primary' | 'ghost' | 'danger'; disabled?: boolean | undefined; type?: 'button' | 'submit'; download?: boolean | undefined; target?: string | undefined }) {
  const style =
    variant === 'primary'
      ? { background: C.ink, color: C.mint }
      : variant === 'danger'
        ? { background: 'transparent', color: C.down, border: `1px solid rgba(163,50,31,0.35)` }
        : { background: '#fff', color: C.ink, border: `1px solid ${C.line}` }
  const cls = 'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.85rem] font-semibold no-underline transition disabled:opacity-50'
  if (href)
    return (
      <a href={href} className={cls} style={style} download={download} target={target} rel={target ? 'noopener' : undefined}>
        {children}
      </a>
    )
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
      {children}
    </button>
  )
}

export const field = 'w-full rounded-xl border bg-white px-3.5 py-2.5 text-[0.95rem] outline-none focus:border-[#042f34] focus:ring-2 focus:ring-[#b8e89a]'
export const fieldStyle = { borderColor: 'rgba(4,47,52,0.18)', color: C.ink }
