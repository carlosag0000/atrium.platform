'use client'

import { useEffect, useState } from 'react'
import { countryName, flag, fmtDuration, fmtWhen, get, type Journey as J } from './api'
import { EVENT_NAMES } from './Reports'
import { C, Empty, Pill, Spinner } from './ui'

/** Every visit and click from one browser, oldest first. */
export function JourneyTimeline({ journey, tz }: { journey: J; tz?: string | undefined }) {
  if (!journey.summary) return <Empty>No browsing history for this person (they may have blocked tracking, or used a different device).</Empty>
  const s = journey.summary
  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Fact label="First visit" value={fmtWhen(s.first_seen, tz)} />
        <Fact label="Found us via" value={s.first_referrer || s.first_channel || '—'} />
        <Fact label="Visits · pages" value={`${s.visits} · ${s.pageviews}`} />
        <Fact label="Time on site" value={fmtDuration(s.time)} />
      </div>
      <ol className="m-0 grid list-none gap-4 p-0">
        {journey.visits.map((v, i) => (
          <li key={v.started + i} className="rounded-xl p-4" style={{ background: 'rgba(4,47,52,0.03)' }}>
            <div className="flex flex-wrap items-center gap-2 text-[0.8rem]" style={{ color: C.muted }}>
              <b style={{ color: C.ink }}>Visit {i + 1}</b>
              <span>{fmtWhen(v.started, tz)}</span>
              {v.channel && <Pill>{v.channel}</Pill>}
              {v.ref_host && <span>from {v.ref_host}</span>}
              {v.campaign && <span>· {v.campaign}</span>}
              <span>
                · {flag(v.country)} {countryName(v.country)} · {v.device} · {v.browser}
              </span>
            </div>
            <ul className="m-0 mt-3 grid list-none gap-1.5 border-l-2 p-0 pl-4" style={{ borderColor: 'rgba(30,140,124,0.35)' }}>
              {v.steps.map((st, j) => (
                <li key={st.ts + j} className="text-[0.85rem]" style={{ color: C.ink }}>
                  {st.type === 'page' ? (
                    <span>
                      <span className="font-medium">{st.path}</span>
                      <span style={{ color: C.muted }}>
                        {' '}
                        · {fmtDuration(st.duration)}
                        {st.scroll ? ` · scrolled ${st.scroll}%` : ''}
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: C.series }}>
                      ★ {EVENT_NAMES[st.name] ?? st.name}
                      {st.label ? <span style={{ color: C.muted }}> — {st.label}</span> : null}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl px-3 py-2" style={{ background: 'rgba(4,47,52,0.04)' }}>
      <div className="text-[0.7rem] font-medium tracking-wide uppercase" style={{ color: C.faint }}>
        {label}
      </div>
      <div className="truncate text-[0.875rem] font-semibold" style={{ color: C.ink }}>
        {value}
      </div>
    </div>
  )
}

/** Slide-over panel showing one visitor's journey. */
export function VisitorDrawer({ visitor, onClose, tz }: { visitor: string; onClose: () => void; tz?: string | undefined }) {
  const [data, setData] = useState<J | null>(null)
  useEffect(() => {
    setData(null)
    get<J>('journey', { visitor }).then(setData).catch(() => setData({ visits: [], summary: null }))
  }, [visitor])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Visitor journey">
      <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" style={{ background: 'rgba(4,47,52,0.35)' }} onClick={onClose} />
      <div className="relative h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="m-0 text-[1.2rem] font-semibold" style={{ color: C.ink }}>
            Visitor journey
          </h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-[0.85rem]" style={{ background: 'rgba(4,47,52,0.06)', color: C.ink }}>
            Close ✕
          </button>
        </div>
        <p className="m-0 mb-4 text-[0.8rem]" style={{ color: C.muted }}>
          Anonymous browser id <code>{visitor}</code>. If this person later sends a form, their name appears in the Inbox with this same history.
        </p>
        {data ? <JourneyTimeline journey={data} tz={tz} /> : <Spinner />}
      </div>
    </div>
  )
}
