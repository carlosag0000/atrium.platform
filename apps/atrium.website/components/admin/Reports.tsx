'use client'

import { useEffect, useMemo, useState } from 'react'
import { downloadUrl, fmtDuration, fmtNum, fmtWhen, get, type Range } from './api'
import { BarList, C, Card, Empty, field, fieldStyle, Spinner } from './ui'

// ── Pages report ─────────────────────────────────────────────────────────────

type PageRow = {
  path: string
  title: string
  views: number
  visitors: number
  avg_time: number
  avg_scroll: number
  entries: number
  exits: number
  bounce_rate: number | null
  conversions: number
}

const COLS: { key: keyof PageRow; label: string; fmt: (r: PageRow) => string; hint?: string | undefined }[] = [
  { key: 'views', label: 'Views', fmt: (r) => fmtNum(r.views) },
  { key: 'visitors', label: 'People', fmt: (r) => fmtNum(r.visitors) },
  { key: 'avg_time', label: 'Avg. time', fmt: (r) => fmtDuration(r.avg_time), hint: 'Time the page was open and visible' },
  { key: 'avg_scroll', label: 'Scroll', fmt: (r) => (r.avg_scroll ? `${r.avg_scroll}%` : '—'), hint: 'How far down people scroll, on average' },
  { key: 'entries', label: 'Landings', fmt: (r) => fmtNum(r.entries), hint: 'Visits that started on this page' },
  { key: 'bounce_rate', label: 'Bounce', fmt: (r) => (r.bounce_rate === null ? '—' : `${r.bounce_rate}%`), hint: 'Of visits that landed here, the share that left without seeing another page' },
  { key: 'exits', label: 'Exits', fmt: (r) => fmtNum(r.exits), hint: 'Visits that ended on this page' },
  { key: 'conversions', label: 'Conv.', fmt: (r) => fmtNum(r.conversions), hint: 'Forms, booking, email and phone clicks on this page' },
]

export function PagesReport({ range }: { range: Range }) {
  const [rows, setRows] = useState<PageRow[] | null>(null)
  const [sort, setSort] = useState<keyof PageRow>('views')
  const [q, setQ] = useState('')

  useEffect(() => {
    let live = true
    setRows(null)
    get<{ pages: PageRow[] }>('pages', range)
      .then((d) => live && setRows(d.pages))
      .catch(() => live && setRows([]))
    return () => {
      live = false
    }
  }, [range])

  const shown = useMemo(() => {
    const list = (rows ?? []).filter((r) => !q || r.path.toLowerCase().includes(q.toLowerCase()) || r.title.toLowerCase().includes(q.toLowerCase()))
    return [...list].sort((a, b) => Number(b[sort] ?? -1) - Number(a[sort] ?? -1))
  }, [rows, sort, q])

  if (!rows) return <Spinner />

  return (
    <Card
      title={`All pages (${rows.length})`}
      pad={false}
      action={
        <div className="flex flex-wrap items-center gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter pages…" className={`${field} !w-48 !py-1.5`} style={fieldStyle} aria-label="Filter pages" />
          <a className="text-[0.8rem] font-semibold underline" style={{ color: C.series }} href={downloadUrl('export_pages', range)}>
            Export CSV
          </a>
        </div>
      }
    >
      {shown.length === 0 ? (
        <div className="px-5 pb-5">
          <Empty>No page views in this period.</Empty>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[0.85rem]">
            <thead>
              <tr style={{ color: C.muted }}>
                <th className="px-5 py-2 text-left font-medium">Page</th>
                {COLS.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-right font-medium" title={c.hint}>
                    <button type="button" onClick={() => setSort(c.key)} className="font-medium" style={{ color: sort === c.key ? C.ink : C.muted }}>
                      {c.label}
                      {sort === c.key ? ' ↓' : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.path} className="border-t" style={{ borderColor: C.line, color: C.ink }}>
                  <td className="max-w-[320px] px-5 py-2.5">
                    <a href={r.path} target="_blank" rel="noopener" className="block truncate font-medium no-underline hover:underline" style={{ color: C.ink }}>
                      {r.path}
                    </a>
                    <span className="block truncate text-[0.75rem]" style={{ color: C.muted }}>
                      {r.title}
                    </span>
                  </td>
                  {COLS.map((c) => (
                    <td key={c.key} className="px-3 py-2.5 text-right tabular-nums" style={{ fontWeight: sort === c.key ? 600 : 400 }}>
                      {c.fmt(r)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

// ── Events report ────────────────────────────────────────────────────────────

type EventsData = {
  goals: Record<string, string>
  names: { name: string; count: number; visitors: number }[]
  labels: { name: string; label: string; count: number }[]
  recent: { ts: string; name: string; label: string; path: string; visitor: string }[]
}

export const EVENT_NAMES: Record<string, string> = {
  form_submit: 'Contact form sent',
  application_submit: 'Job application sent',
  cal_click: 'Booking button clicked',
  email_click: 'Email link clicked',
  phone_click: 'Phone link clicked',
  cta_click: 'Call-to-action clicked',
  outbound_click: 'Link to another site clicked',
}

export function EventsReport({ range, onVisitor, tz }: { range: Range; onVisitor: (v: string) => void; tz?: string | undefined }) {
  const [data, setData] = useState<EventsData | null>(null)
  const [pick, setPick] = useState('')

  useEffect(() => {
    let live = true
    setData(null)
    get<EventsData>('events', range)
      .then((d) => live && setData(d))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [range])

  if (!data) return <Spinner />
  const labels = data.labels.filter((l) => !pick || l.name === pick)

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Clicks & conversions">
          <BarList
            valueLabel="Count"
            extraLabel="People"
            items={data.names.map((n) => ({
              key: n.name,
              label: (
                <span>
                  {EVENT_NAMES[n.name] ?? n.name}
                  {data.goals[n.name] ? <span style={{ color: C.series }}> ●</span> : null}
                </span>
              ),
              value: n.count,
              extra: fmtNum(n.visitors),
              onClick: () => setPick((p) => (p === n.name ? '' : n.name)),
            }))}
            empty="No clicks or form submissions recorded in this period."
            limit={12}
          />
          <p className="m-0 mt-3 px-2 text-[0.75rem]" style={{ color: C.faint }}>
            <span style={{ color: C.series }}>●</span> counts as a conversion. Click a row to see its details.
          </p>
        </Card>
        <Card title={pick ? `Details: ${EVENT_NAMES[pick] ?? pick}` : 'Details (what was clicked)'}>
          <BarList valueLabel="Count" items={labels.map((l) => ({ key: l.name + l.label, label: l.label || '(no label)', title: EVENT_NAMES[l.name] ?? l.name, value: l.count }))} limit={12} />
        </Card>
      </div>
      <Card title="Latest events" pad={false}>
        {data.recent.length === 0 ? (
          <div className="px-5 pb-5">
            <Empty>Nothing yet.</Empty>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-[0.85rem]">
              <tbody>
                {data.recent.map((r, i) => (
                  <tr key={r.ts + i} className="border-t" style={{ borderColor: C.line, color: C.ink }}>
                    <td className="px-5 py-2 whitespace-nowrap tabular-nums" style={{ color: C.muted }}>
                      {fmtWhen(r.ts, tz)}
                    </td>
                    <td className="px-3 py-2 font-medium">{EVENT_NAMES[r.name] ?? r.name}</td>
                    <td className="max-w-[280px] truncate px-3 py-2">{r.label}</td>
                    <td className="px-3 py-2" style={{ color: C.muted }}>
                      {r.path}
                    </td>
                    <td className="px-5 py-2 text-right">
                      {r.visitor && (
                        <button type="button" onClick={() => onVisitor(r.visitor)} className="text-[0.8rem] font-semibold underline" style={{ color: C.series }}>
                          Visitor
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
