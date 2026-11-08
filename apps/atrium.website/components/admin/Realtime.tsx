'use client'

import { useEffect, useState } from 'react'
import { countryName, flag, fmtAgo, fmtNum, get } from './api'
import { BarList, C, Card, Empty, Pill, Spinner } from './ui'

type Data = {
  active: number
  pages: { path: string; visitors: number }[]
  minutes: { minute: string; count: number }[]
  feed: { ts: string; path: string; title: string; channel: string; ref_host: string; utm_source: string; country: string; device: string; browser: string; visitor: string; is_new: number }[]
  today: { pageviews: number; visitors: number }
  now: string
}

export default function Realtime({ onVisitor }: { onVisitor: (visitor: string) => void }) {
  const [data, setData] = useState<Data | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    let live = true
    const load = () =>
      get<Data>('realtime')
        .then((d) => live && setData(d))
        .catch(() => {})
    load()
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load()
    }, 10_000)
    const t = window.setInterval(() => tick((n) => n + 1), 5_000)
    return () => {
      live = false
      window.clearInterval(id)
      window.clearInterval(t)
    }
  }, [])

  if (!data) return <Spinner />

  // Last 30 minutes, oldest first.
  const now = new Date(data.now).getTime()
  const byMinute = new Map(data.minutes.map((m) => [new Date(m.minute).getTime(), m.count]))
  const bars = Array.from({ length: 30 }, (_, i) => {
    const t = Math.floor(now / 60000) * 60000 - (29 - i) * 60000
    return { t, n: byMinute.get(t) ?? 0 }
  })
  const max = Math.max(1, ...bars.map((b) => b.n))

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card>
          <div className="pt-5">
            <div className="flex items-center gap-2 text-[0.85rem] font-medium" style={{ color: C.muted }}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: C.series }} />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: C.series }} />
              </span>
              On the site right now
            </div>
            <div className="mt-2 text-[3.5rem] leading-none font-semibold tabular-nums" style={{ color: C.ink }}>
              {data.active}
            </div>
            <p className="m-0 mt-3 text-[0.85rem]" style={{ color: C.muted }}>
              Active in the last 5 minutes. Updates every 10 seconds.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: C.line }}>
              <div>
                <div className="text-[0.75rem]" style={{ color: C.muted }}>
                  Visitors today
                </div>
                <div className="text-[1.3rem] font-semibold tabular-nums" style={{ color: C.ink }}>
                  {fmtNum(data.today.visitors)}
                </div>
              </div>
              <div>
                <div className="text-[0.75rem]" style={{ color: C.muted }}>
                  Page views today
                </div>
                <div className="text-[1.3rem] font-semibold tabular-nums" style={{ color: C.ink }}>
                  {fmtNum(data.today.pageviews)}
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card title="Page views, last 30 minutes">
          <div className="flex h-[150px] items-end gap-[2px]" role="img" aria-label="Page views per minute for the last 30 minutes">
            {bars.map((b) => (
              <div
                key={b.t}
                title={`${new Date(b.t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · ${b.n} page view${b.n === 1 ? '' : 's'}`}
                className="flex-1 rounded-t-[4px]"
                style={{ height: `${Math.max(2, (b.n / max) * 100)}%`, background: b.n ? C.series : 'rgba(4,47,52,0.06)' }}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[0.7rem]" style={{ color: C.faint }}>
            <span>30 min ago</span>
            <span>now</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card title="Pages being viewed">
          <BarList valueLabel="People" items={data.pages.map((p) => ({ key: p.path, label: p.path, value: p.visitors }))} empty="Nobody on the site right now." />
        </Card>
        <Card title="Latest page views" pad={false}>
          {data.feed.length === 0 ? (
            <div className="px-5 pb-5">
              <Empty>No visits yet.</Empty>
            </div>
          ) : (
            <ul className="m-0 list-none p-0">
              {data.feed.map((f) => (
                <li key={f.ts + f.visitor + f.path} className="border-t" style={{ borderColor: C.line }}>
                  <button type="button" onClick={() => onVisitor(f.visitor)} className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-2.5 text-left hover:bg-[rgba(4,47,52,0.03)]">
                    <span className="text-[1.1rem]" title={countryName(f.country)}>
                      {flag(f.country)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.875rem] font-medium" style={{ color: C.ink }}>
                        {f.path}
                      </span>
                      <span className="block truncate text-[0.75rem]" style={{ color: C.muted }}>
                        {f.device} · {f.browser}
                        {f.ref_host ? ` · from ${f.ref_host}` : f.utm_source ? ` · ${f.utm_source}` : ''}
                      </span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-[0.75rem] tabular-nums" style={{ color: C.muted }}>
                        {fmtAgo(f.ts)}
                      </span>
                      {f.is_new ? <Pill bg="rgba(184,232,154,0.6)">new</Pill> : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
