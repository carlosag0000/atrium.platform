'use client'

import { useEffect, useState } from 'react'
import { countryName, downloadUrl, flag, fmtDay, fmtDuration, fmtNum, get, type Range } from './api'
import { AreaChart, BarList, Card, Empty, Heatmap, Kpi, Legend, Segmented, Spinner } from './ui'

type Totals = {
  visitors: number
  new_visitors: number
  sessions: number
  pageviews: number
  avg_duration: number
  bounce_rate: number
  pages_per_session: number
  conversions: number
  conversion_rate: number
  leads: number
  applications: number
}
type Day = { day: string; visitors: number; pageviews: number; sessions: number; conversions: number }
type Row = { name: string; visitors: number; count: number; title?: string | undefined; conversions?: number | undefined }
export type OverviewData = {
  range: { from: string; to: string; prev_from: string; prev_to: string }
  totals: Totals
  previous: Totals
  series: Day[]
  previous_series: Day[]
  pages: Row[]
  entries: Row[]
  channels: Row[]
  referrers: Row[]
  campaigns: { source: string; medium: string; campaign: string; sessions: number; visitors: number }[]
  countries: Row[]
  devices: Row[]
  browsers: Row[]
  os: Row[]
  languages: Row[]
  heatmap: { dow: number; hour: number; count: number }[]
  goals: { key: string; label: string; count: number; sessions: number }[]
}

type Metric = 'visitors' | 'pageviews' | 'sessions' | 'conversions'
const METRIC_NAMES: Record<Metric, string> = { visitors: 'Visitors', pageviews: 'Page views', sessions: 'Visits', conversions: 'Conversions' }

const CHANNEL_HELP: Record<string, string> = {
  Direct: 'Typed the address, used a bookmark, or the source was hidden',
  Search: 'Google, Bing and other search engines',
  Social: 'Instagram, Facebook, LinkedIn, TikTok and other social apps',
  Referral: 'A link on another website',
  Paid: 'Ads (utm_medium=cpc/paid or Google Ads clicks)',
  Email: 'Email or SMS campaigns',
  AI: 'ChatGPT, Perplexity, Claude, Gemini and other AI assistants',
  Campaign: 'Tagged links (utm_source) without a referrer',
}

export default function Overview({ range, onNavigate }: { range: Range; onNavigate: (hash: string) => void }) {
  const [data, setData] = useState<OverviewData | null>(null)
  const [error, setError] = useState('')
  const [metric, setMetric] = useState<Metric>('visitors')
  const [tech, setTech] = useState<'devices' | 'browsers' | 'os' | 'languages'>('devices')
  const [src, setSrc] = useState<'channels' | 'referrers' | 'campaigns'>('channels')
  const [pg, setPg] = useState<'pages' | 'entries'>('pages')

  useEffect(() => {
    let live = true
    setData(null)
    setError('')
    get<OverviewData>('overview', range)
      .then((d) => live && setData(d))
      .catch((e) => live && setError(e.message === 'auth' ? '' : 'Could not load stats. Refresh to try again.'))
    return () => {
      live = false
    }
  }, [range])

  if (error) return <Empty>{error}</Empty>
  if (!data) return <Spinner />

  const t = data.totals
  const p = data.previous
  const points = data.series.map((d, i) => ({
    label: fmtDay(d.day),
    tip: fmtDay(d.day, { weekday: 'short', month: 'short', day: 'numeric' }),
    value: d[metric],
    prev: data.previous_series[i]?.[metric],
    prevTip: data.previous_series[i] ? fmtDay(data.previous_series[i].day, { month: 'short', day: 'numeric' }) : undefined,
  }))
  const noData = t.pageviews === 0

  return (
    <div className="grid gap-4">
      {noData && (
        <div className="rounded-2xl px-5 py-4 text-[0.9rem]" style={{ background: 'rgba(184,232,154,0.35)', color: '#042f34' }}>
          <b>Tracking is on.</b> Visits show up here within seconds of someone opening the site. Your own visits aren&apos;t counted while you&apos;re signed in on this
          browser (you can change that in Settings).
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Visitors" value={fmtNum(t.visitors)} now={t.visitors} prev={p.visitors} active={metric === 'visitors'} onClick={() => setMetric('visitors')} hint="Unique people (per browser)" />
        <Kpi label="Visits" value={fmtNum(t.sessions)} now={t.sessions} prev={p.sessions} active={metric === 'sessions'} onClick={() => setMetric('sessions')} hint="A visit ends after 30 minutes of inactivity" />
        <Kpi label="Page views" value={fmtNum(t.pageviews)} now={t.pageviews} prev={p.pageviews} active={metric === 'pageviews'} onClick={() => setMetric('pageviews')} />
        <Kpi label="Avg. visit time" value={fmtDuration(t.avg_duration)} now={t.avg_duration} prev={p.avg_duration} hint="Time the page was actually open and visible" />
        <Kpi label="Bounce rate" value={`${t.bounce_rate}%`} now={t.bounce_rate} prev={p.bounce_rate} invert hint="Visits that saw only one page" />
        <Kpi label="Conversions" value={fmtNum(t.conversions)} now={t.conversions} prev={p.conversions} active={metric === 'conversions'} onClick={() => setMetric('conversions')} hint="Forms sent, booking, email and phone clicks" />
      </div>

      <Card
        title={`${METRIC_NAMES[metric]} per day`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Legend items={[{ label: 'This period' }, { label: `Previous ${data.series.length} days`, dashed: true }]} />
            <a className="text-[0.8rem] font-semibold underline" style={{ color: '#1e8c7c' }} href={downloadUrl('export_daily', range)}>
              Export CSV
            </a>
          </div>
        }
      >
        <AreaChart points={points} name={METRIC_NAMES[metric]} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat label="New visitors" value={fmtNum(t.new_visitors)} sub={t.visitors ? `${Math.round((100 * t.new_visitors) / t.visitors)}% of visitors` : '—'} />
        <MiniStat label="Pages per visit" value={String(t.pages_per_session)} sub={<>vs {p.pages_per_session} before</>} />
        <MiniStat label="Conversion rate" value={`${t.conversion_rate}%`} sub="Visits with at least one conversion" />
        <MiniStat
          label="Leads & applications"
          value={`${t.leads} · ${t.applications}`}
          sub={
            <span>
              <button type="button" className="underline" onClick={() => onNavigate('forms/contact')}>
                Messages
              </button>{' '}
              ·{' '}
              <button type="button" className="underline" onClick={() => onNavigate('forms/careers')}>
                Careers
              </button>
            </span>
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Pages"
          action={<Segmented label="Page list" value={pg} onChange={setPg} options={[{ value: 'pages', label: 'Top pages' }, { value: 'entries', label: 'Landing pages' }]} />}
        >
          <BarList
            valueLabel={pg === 'pages' ? 'Views' : 'Visits'}
            extraLabel="People"
            items={data[pg].map((r) => ({ key: r.name, label: r.name, title: r.title, value: r.count, extra: fmtNum(r.visitors) }))}
          />
          <button type="button" onClick={() => onNavigate('pages')} className="mt-3 px-2 text-[0.8rem] font-semibold underline" style={{ color: '#1e8c7c' }}>
            Full page report →
          </button>
        </Card>

        <Card
          title="Where visitors come from"
          action={
            <Segmented
              label="Source list"
              value={src}
              onChange={setSrc}
              options={[
                { value: 'channels', label: 'Channels' },
                { value: 'referrers', label: 'Websites' },
                { value: 'campaigns', label: 'Campaigns' },
              ]}
            />
          }
        >
          {src === 'channels' && (
            <BarList
              valueLabel="Visits"
              extraLabel="Conv."
              items={data.channels.map((r) => ({ key: r.name, label: r.name, title: CHANNEL_HELP[r.name], value: r.count, extra: fmtNum(r.conversions ?? 0) }))}
            />
          )}
          {src === 'referrers' && (
            <BarList
              valueLabel="Visits"
              empty="No other websites have sent visitors in this period."
              items={data.referrers.map((r) => ({
                key: r.name,
                label: r.name,
                value: r.count,
              }))}
            />
          )}
          {src === 'campaigns' &&
            (data.campaigns.length ? (
              <BarList
                valueLabel="Visits"
                items={data.campaigns.map((c) => ({
                  key: `${c.source}|${c.medium}|${c.campaign}`,
                  label: [c.campaign || '(no campaign)', [c.source, c.medium].filter(Boolean).join(' / ')].filter(Boolean).join(' — '),
                  value: c.sessions,
                }))}
              />
            ) : (
              <Empty>
                No tagged links yet. Add <code>?utm_source=instagram&amp;utm_campaign=spring</code> to links you share and they&apos;ll show up here.
              </Empty>
            ))}
        </Card>

        <Card title="Countries">
          <BarList
            valueLabel="People"
            items={data.countries.map((r) => ({ key: r.name, label: `${flag(r.name)}  ${countryName(r.name)}`, value: r.visitors }))}
          />
          <p className="m-0 mt-3 px-2 text-[0.75rem]" style={{ color: '#8b9092' }}>
            Estimated from each visitor&apos;s device timezone. No IP addresses are stored.
          </p>
        </Card>

        <Card
          title="Technology"
          action={
            <Segmented
              label="Technology list"
              value={tech}
              onChange={setTech}
              options={[
                { value: 'devices', label: 'Device' },
                { value: 'browsers', label: 'Browser' },
                { value: 'os', label: 'System' },
                { value: 'languages', label: 'Language' },
              ]}
            />
          }
        >
          <BarList valueLabel="People" items={data[tech].map((r) => ({ key: r.name, label: r.name, value: r.visitors }))} />
        </Card>

        <Card title="Conversions" action={<GoalLink onClick={() => onNavigate('events')} />}>
          <BarList valueLabel="Count" extraLabel="Visits" items={data.goals.map((g) => ({ key: g.key, label: g.label, value: g.count, extra: fmtNum(g.sessions) }))} empty="No conversions yet." limit={10} />
        </Card>

        <Card title="Busiest times">
          <Heatmap cells={data.heatmap} />
        </Card>
      </div>
    </div>
  )
}

function GoalLink({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-[0.8rem] font-semibold underline" style={{ color: '#1e8c7c' }}>
      All clicks & events →
    </button>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3" style={{ border: '1px solid rgba(4,47,52,0.10)' }}>
      <div className="text-[0.8rem] font-medium" style={{ color: '#61686a' }}>
        {label}
      </div>
      <div className="mt-0.5 text-[1.2rem] font-semibold tabular-nums" style={{ color: '#042f34' }}>
        {value}
      </div>
      <div className="text-[0.75rem]" style={{ color: '#8b9092' }}>
        {sub}
      </div>
    </div>
  )
}
