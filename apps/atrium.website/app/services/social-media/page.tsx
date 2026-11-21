import { Eyebrow } from '@atrium/ui'
import { ArrowUpRight, CalendarDays, Camera, Clapperboard, MessagesSquare, Rocket, Users } from 'lucide-react'
import type { Metadata } from 'next'
import E from '@/components/cms/Editable'
import LazyVideo from '@/components/media/LazyVideo'
import CTABanner from '@/components/sections/CTABanner'
import PurchaseFAQ, { type FAQItem } from '@/components/sections/PurchaseFAQ'
import LogoTicker from '@/components/ui/LogoTicker'
import { OutlineCTA, PillCTA } from '@/components/ui/PillCTA'
import TransitionLink from '@/components/ui/TransitionLink'
import { CAL_LINKS } from '@/lib/cal'
import { clients } from '@/lib/clients'
import { CTA } from '@/lib/cta'
import { findReel, reelDelivery } from '@/lib/reels'
import { caseStudies } from '@/lib/work'

// Social Media and Content (Attention engine). Section order follows a classic service page:
// hero with format strip → logos → why it matters → the work + proof → what we do → platforms →
// how a month works → FAQ → call. All media is Atrium's own client work from cdn.atriumad.com.

export const metadata: Metadata = {
  title: 'Restaurant Social Media and Content — Atrium',
  description:
    'Reels, photos and daily social media management for restaurants, planned around what you need to sell: weeknights, brunch, catering and events. Shot in your kitchen, posted on time, every comment answered.',
  alternates: { canonical: '/services/social-media' },
}

type Reel = { label: string; client: string; match: string }

const FORMATS: Reel[] = [
  { label: 'Food close-ups', client: 'Aahaa', match: 'chicken tikka' },
  { label: 'Chef POV', client: 'Chick-in-Waffle', match: 'chwf_ jul12 pov preparation - 01' },
  { label: 'Behind the line', client: 'Aahaa', match: 'bts-process' },
  { label: 'Skits and trends', client: 'Old Shawnee Pizza', match: 'rush order skit' },
  { label: 'Ambience', client: 'Don Chuy’s', match: 'compilation ambience 2' },
  { label: 'Drinks', client: 'Don Chuy’s', match: 'exotic drinks' },
  { label: 'Offers and events', client: 'T’ÄHÄ', match: 'oysters day' },
  { label: 'ASMR', client: 'Chick-in-Waffle', match: 'pov asmr 1' },
]

const GALLERY: Reel[] = [
  { label: 'Build a bowl', client: 'Jerusalem Cafe', match: 'build a bowl' },
  { label: 'Brunch', client: 'T’ÄHÄ', match: 'brunch coffee' },
  { label: 'Dinner on the patio', client: 'Aahaa', match: 'dinner on the patio' },
  { label: 'House or ranch?', client: 'Old Shawnee Pizza', match: 'house or ranch' },
  { label: 'Happy hour', client: 'Don Chuy’s', match: 'happy hour is waiting' },
  { label: 'Single item', client: 'Taco Naco KC', match: 'compilation single item' },
  { label: 'Trend', client: 'T’ÄHÄ', match: 'camera photos trend' },
  { label: 'Banquets', client: 'Aahaa', match: 'banquet general' },
]

function reel(r: Reel) {
  const src = findReel(r.match)
  return src ? { ...r, src, poster: reelDelivery(src).poster } : null
}

const STACK = [
  {
    icon: Camera,
    eyebrow: 'Monthly shoots',
    title: 'Photo and video, *in your kitchen*',
    body: 'We shoot on location every month, with a shot list built from your calendar: the dishes you need to sell, the room on a busy night, the people behind the pass.',
    bg: 'bg-lime',
    match: 'chicken tikka',
  },
  {
    icon: Clapperboard,
    eyebrow: 'Reels and short video',
    title: 'Edited for how people *actually scroll*',
    body: 'Hooks in the first second, natural sound, captions that say where you are and what to order. Cut separately for Reels, TikTok and Stories.',
    bg: 'bg-cream',
    match: 'pov asmr 1',
  },
  {
    icon: CalendarDays,
    eyebrow: 'Content calendar',
    title: 'Planned around *what you need to sell*',
    body: 'Slow weeknights, brunch, catering, holidays, a new menu, a sold-out event. Every month starts from your goals, and every post has a job.',
    bg: 'bg-amber',
    match: 'oysters day',
  },
  {
    icon: MessagesSquare,
    eyebrow: 'Daily posting and community',
    title: 'Every comment and DM, *answered*',
    body: 'We publish on schedule and reply every day in your voice: questions about hours, compliments, complaints. Anything sensitive comes to you first.',
    bg: 'bg-dark',
    dark: true,
    match: 'compilation ambience 2',
  },
  {
    icon: Users,
    eyebrow: 'Local creators (UGC)',
    title: 'Food creators who *visit and post*',
    body: 'Through Fork & Film, local creators book a visit, film their meal and post it, so guests hear about you from people they already follow.',
    bg: 'bg-green',
    dark: true,
    match: 'camera photos trend',
    link: { label: 'About Fork & Film', href: 'https://forkandfilm.com', external: true },
  },
  {
    icon: Rocket,
    eyebrow: 'Boost what works',
    title: 'Money behind posts that *already proved it*',
    body: 'When a post earns saves and shares on its own, we put a small budget behind it, aimed at people near your door. No guessing with ad spend.',
    bg: 'bg-cream',
    match: 'happy hour is waiting',
    link: { label: 'Ads and Paid Media', href: '/services/paid-media', external: false },
  },
]

const PLATFORMS = [
  { name: 'Instagram', line: 'Reels, carousels and Stories: where most guests check you out before booking.' },
  { name: 'TikTok', line: 'Trends, skits and food close-ups that reach people who don’t follow you yet.' },
  { name: 'Facebook', line: 'Events, offers and the regulars who still live there.' },
  { name: 'Google Business', line: 'Weekly posts and fresh photos on the profile people see on Maps.' },
  { name: 'YouTube Shorts', line: 'The same reels, recut, for one more place to be found.' },
]

const MONTH = [
  { title: 'Strategy call', body: 'What you need to sell this month, and what worked last month.' },
  { title: 'Shot list', body: 'Dishes, moments and formats planned before anyone picks up a camera.' },
  { title: 'Shoot day', body: 'On location, with minimal disruption to service.' },
  { title: 'Edit and approve', body: 'You see the calendar and the posts before anything goes live.' },
  { title: 'Post and reply', body: 'Published on schedule; comments and DMs answered daily.' },
  { title: 'Report', body: 'Reach, saves, profile visits and booking clicks, in your Atrium dashboard.' },
]

const FAQ: FAQItem[] = [
  { signal: 'Rhythm', question: 'How often do you shoot?', answer: 'Every month, on location. The shot list comes from that month’s calendar, so the content always matches what you need to sell.' },
  { signal: 'Approval', question: 'Do I approve posts before they go live?', answer: 'Yes. You see the month’s calendar and the finished posts first. Nothing publishes without your OK.' },
  { signal: 'Community', question: 'Who answers comments and messages?', answer: 'We do, every day, in your brand’s voice. Questions we can’t answer, and anything sensitive, come straight to you.' },
  { signal: 'Creators', question: 'Do you work with influencers?', answer: 'Yes, through Fork & Film: local food creators book a visit, film their meal and post it. It’s an add-on you can turn on any month.' },
  { signal: 'Results', question: 'How do I know it’s working?', answer: 'Your Atrium dashboard shows reach, saves, profile visits and clicks to reserve or order, and each month’s report explains what changed and why.' },
]

export default function SocialMediaPage() {
  const formats = FORMATS.map(reel).filter((r) => r !== null)
  const gallery = GALLERY.map(reel).filter((r) => r !== null)
  const tacoNaco = caseStudies.find((c) => c.slug === 'taco-naco')

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="bg-dark px-[var(--gutter)] pt-[7.5rem] pb-10 max-sm:pt-[6rem]">
        <div className="mx-auto max-w-[var(--container-max)]">
          <Eyebrow className="mb-6" tone="on-dark">
            <E>Social media and content · Attention</E>
          </Eyebrow>
          <h1 className="m-0 max-w-[16ch] text-[clamp(2.8rem,6vw,5rem)] font-normal leading-[1.02] tracking-[-0.02em] text-cream">
            <E>
              Posts that make people <em className="font-serif italic">hungry.</em>
            </E>
          </h1>
          <p className="mt-6 max-w-2xl text-[clamp(1.05rem,1.4vw,1.25rem)] leading-relaxed text-cream/[0.78]">
            <E>Reels, photos and daily posting, planned around what you need to sell: weeknights, brunch, catering, events. Shot in your kitchen, posted on time, every comment answered.</E>
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <PillCTA external href={CTA.primary.href} tone="on-dark">
              {CTA.primary.label}
            </PillCTA>
            <OutlineCTA href="/work" tone="on-dark">
              See the work
            </OutlineCTA>
          </div>
        </div>
        {/* Format strip: one short reel per format, scrolls sideways */}
        <div className="mx-auto mt-14 max-w-[var(--container-max)]">
          <ul className="-mx-[var(--gutter)] m-0 flex list-none gap-3 overflow-x-auto px-[var(--gutter)] pb-2 [scrollbar-width:none]">
            {formats.map((f) => (
              <li key={f.label} className="flex shrink-0 items-center gap-3 rounded-xl border border-cream/15 bg-cream/[0.06] py-2 pr-4 pl-2">
                <span className="block h-12 w-9 overflow-hidden rounded-md bg-cream/10">
                  {f.poster && <img src={f.poster} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </span>
                <span className="whitespace-nowrap text-cream text-sm">{f.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <LogoTicker clients={clients} label="Content for hospitality brands across Houston and Kansas City" size="compact" />

      {/* ── Why it matters ─────────────────────────────────────────────── */}
      <section className="px-[var(--gutter)] py-24 md:py-32" style={{ background: 'var(--surface-page)' }}>
        <div className="mx-auto grid max-w-[var(--container-max)] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <Eyebrow className="mb-6">
              <E>Why it matters</E>
            </Eyebrow>
            <h2 className="m-0 text-[clamp(2.4rem,4.5vw,3.8rem)] font-normal leading-[1.06] tracking-[-0.02em] text-charcoal">
              <E>
                Posting when there’s time <em className="font-serif italic">isn’t a plan.</em>
              </E>
            </h2>
            <p className="type-lead mt-6" style={{ color: 'var(--text-body)' }}>
              <E>Guests check your Instagram before they book. A feed that went quiet in March, or a reel that doesn’t look like your food, quietly costs you the table.</E>
            </p>
            <p className="type-body mt-4" style={{ color: 'var(--text-muted)' }}>
              <E>We keep a steady rhythm of content made for one job: getting people through the door. Planned, shot, posted and answered by one team that only works in hospitality.</E>
            </p>
          </div>
          <div className="grid grid-cols-3 items-end gap-3 md:gap-5">
            {formats.slice(0, 3).map((f, i) => (
              <div key={f.label} className={`overflow-hidden rounded-[1.4rem] border-[5px] border-charcoal bg-charcoal ${i === 1 ? '-translate-y-8' : ''}`}>
                <LazyVideo src={f.src} poster={f.poster} className="aspect-[9/16] w-full object-cover" decorative />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The work + proof ───────────────────────────────────────────── */}
      <section className="bg-dark px-[var(--gutter)] py-24 md:py-32">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <h2 className="m-0 max-w-[18ch] text-[clamp(2.4rem,4.5vw,3.8rem)] font-normal leading-[1.06] tracking-[-0.02em] text-cream">
              <E>
                Made in real kitchens, <em className="font-serif italic">for real menus.</em>
              </E>
            </h2>
            <OutlineCTA href="/work" tone="on-dark">
              All case studies
            </OutlineCTA>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {gallery.map((g) => (
              <figure key={g.label} className="m-0">
                <div className="overflow-hidden rounded-2xl bg-cream/5">
                  <LazyVideo src={g.src} poster={g.poster} className="aspect-[9/16] w-full object-cover" decorative />
                </div>
                <figcaption className="mt-2 flex justify-between gap-2 text-xs text-cream/60">
                  <span>{g.client}</span>
                  <span>{g.label}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          {tacoNaco?.testimonial && (
            <div className="mt-20 grid gap-10 border-cream/15 border-t pt-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
              <blockquote className="m-0">
                <p className="m-0 font-serif text-[clamp(1.6rem,2.6vw,2.3rem)] italic leading-[1.25] text-cream">
                  “<E>{tacoNaco.testimonial.quote}</E>”
                </p>
                <footer className="mt-6 text-sm text-cream/70">
                  {tacoNaco.testimonial.name} · {tacoNaco.testimonial.role}
                </footer>
              </blockquote>
              <dl className="m-0 grid grid-cols-3 gap-6 self-end">
                {[
                  { n: tacoNaco.metrics[1]?.number ?? '', l: 'followers across platforms' },
                  { n: tacoNaco.metrics[0]?.number ?? '', l: 'total impressions' },
                  { n: '1,000+', l: 'pieces of content published' },
                ].map((m) => (
                  <div key={m.l}>
                    <dt className="font-serif text-[clamp(1.8rem,3vw,2.6rem)] italic leading-none text-lime">{m.n}</dt>
                    <dd className="m-0 mt-2 text-xs text-cream/70">{m.l}</dd>
                  </div>
                ))}
              </dl>
              <TransitionLink href="/work/taco-naco" className="text-sm text-lime underline-offset-4 hover:underline lg:col-span-2">
                Read the Taco Naco KC story →
              </TransitionLink>
            </div>
          )}
        </div>
      </section>

      {/* ── What we do: stacked cards ──────────────────────────────────── */}
      <section className="px-[var(--gutter)] py-24 md:py-32" style={{ background: 'var(--surface-page)' }}>
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <Eyebrow className="mb-6">
              <E>What we do</E>
            </Eyebrow>
            <h2 className="m-0 text-[clamp(2.4rem,4.5vw,3.8rem)] font-normal leading-[1.06] tracking-[-0.02em] text-charcoal">
              <E>
                One team for <em className="font-serif italic">every part of social.</em>
              </E>
            </h2>
          </div>
          <div className="grid gap-6">
            {STACK.map((card, i) => {
              const r = reel({ label: card.eyebrow, client: '', match: card.match })
              const Icon = card.icon
              return (
                <article
                  key={card.eyebrow}
                  className={`sticky grid items-center gap-8 overflow-hidden rounded-[1.75rem] p-7 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] md:p-12 ${card.bg}`}
                  style={{ top: `calc(5rem + ${i * 1.25}rem)`, border: '1px solid rgba(4,47,52,0.08)', color: 'dark' in card ? 'var(--cloud-300)' : 'var(--teal-800)' }}
                >
                  <div>
                    <p className="m-0 flex items-center gap-2 text-sm opacity-80">
                      <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
                      <E>{card.eyebrow}</E>
                    </p>
                    <h3 className="m-0 mt-4 text-[clamp(1.9rem,3.2vw,2.8rem)] font-normal leading-[1.08] tracking-[-0.02em]" style={{ color: 'dark' in card ? 'var(--cloud-300)' : 'var(--teal-800)' }}>
                      <E>
                        {card.title.split('*').map((part, j) =>
                          j % 2 ? (
                            <em key={part} className="font-serif italic">
                              {part}
                            </em>
                          ) : (
                            part
                          ),
                        )}
                      </E>
                    </h3>
                    <p className="m-0 mt-5 max-w-xl text-base leading-relaxed opacity-80" style={{ color: 'inherit' }}>
                      <E>{card.body}</E>
                    </p>
                    {card.link &&
                      (card.link.external ? (
                        <a href={card.link.href} target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
                          {card.link.label} <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                        </a>
                      ) : (
                        <TransitionLink href={card.link.href} className="mt-6 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline">
                          {card.link.label} →
                        </TransitionLink>
                      ))}
                  </div>
                  {r && (
                    <div className="mx-auto w-full max-w-[15rem] overflow-hidden rounded-[1.4rem] border-[5px] border-charcoal bg-charcoal">
                      <LazyVideo src={r.src} poster={r.poster} className="aspect-[9/16] w-full object-cover" decorative />
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Platforms ──────────────────────────────────────────────────── */}
      <section className="bg-dark px-[var(--gutter)] py-24 md:py-32">
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <Eyebrow className="mb-6" tone="on-dark">
              <E>Platform-native</E>
            </Eyebrow>
            <h2 className="m-0 text-[clamp(2.4rem,4.5vw,3.8rem)] font-normal leading-[1.06] tracking-[-0.02em] text-cream">
              <E>
                Each channel, <em className="font-serif italic">its own way.</em>
              </E>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-cream/70">
              <E>The same shoot becomes different content for every place your guests look, because each one rewards something different.</E>
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-cream/10 bg-cream/10 sm:grid-cols-2 lg:grid-cols-5">
            {PLATFORMS.map((p) => (
              <div key={p.name} className="bg-dark p-7">
                <p className="m-0 font-serif text-[1.6rem] italic leading-none text-lime">{p.name}</p>
                <p className="m-0 mt-4 text-sm leading-relaxed text-cream/70">
                  <E>{p.line}</E>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How a month works ──────────────────────────────────────────── */}
      <section className="px-[var(--gutter)] py-24 md:py-32" style={{ background: 'var(--surface-page)' }}>
        <div className="mx-auto max-w-[var(--container-max)]">
          <div className="mb-14 max-w-3xl">
            <Eyebrow className="mb-6">
              <E>How a month works</E>
            </Eyebrow>
            <h2 className="m-0 text-[clamp(2.4rem,4.5vw,3.8rem)] font-normal leading-[1.06] tracking-[-0.02em] text-charcoal">
              <E>
                A 28-day cycle, <em className="font-serif italic">every month.</em>
              </E>
            </h2>
          </div>
          <ol className="m-0 grid list-none gap-px overflow-hidden rounded-2xl border border-line bg-[rgba(4,47,52,0.08)] p-0 sm:grid-cols-2 lg:grid-cols-3">
            {MONTH.map((s, i) => (
              <li key={s.title} className="bg-cream p-7">
                <span className="text-xs tracking-[0.14em] text-green">{String(i + 1).padStart(2, '0')}</span>
                <p className="m-0 mt-3 text-[1.35rem] leading-tight text-charcoal">
                  <E>{s.title}</E>
                </p>
                <p className="m-0 mt-2 text-sm leading-relaxed text-muted">
                  <E>{s.body}</E>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PurchaseFAQ heading="Questions owners ask about social." intro="If the answer depends on your restaurant, we’ll say so on the first call." items={FAQ} />

      <CTABanner
        eyebrow="LET’S TALK"
        headline={
          <>
            Make your feed <em>fill tables.</em>
          </>
        }
        body="Tell us what you need to sell this season. We’ll show you the content plan to get there."
        cta="Book a call"
        ctaHref="/contact"
        ctaCalLink={CAL_LINKS.intro}
      />
    </>
  )
}
