import AudiencePaths from '@/components/sections/AudiencePaths'
import BentoGrid, { type BentoItem } from '@/components/sections/BentoGrid'
import ComparisonMatrix from '@/components/sections/ComparisonMatrix'
import CTABanner from '@/components/sections/CTABanner'
import DarkProcess, { type ProcessStep } from '@/components/sections/DarkProcess'
import GrowthEngineDiagram from '@/components/sections/GrowthEngineDiagram'
import HeroSection from '@/components/sections/HeroSection'
import PurchaseFAQ from '@/components/sections/PurchaseFAQ'
import SplitSection from '@/components/sections/SplitSection'
import StatsStrip, { type Stat } from '@/components/sections/StatsStrip'
import TestimonialMarquee from '@/components/sections/TestimonialMarquee'
import WorkGrid, { type Project } from '@/components/sections/WorkGrid'
import LogoTicker from '@/components/ui/LogoTicker'
import { clients } from '@/lib/clients'
import { CTA } from '@/lib/cta'
import { railTestimonials } from '@/lib/testimonials'
import { type CaseStudy, caseStudies } from '@/lib/work'

// Shot for the home bento and staged on our own CDN. Absolute URLs: next/image
// cannot take a bare public ID.
const BENTO_CDN = 'https://cdn.atriumad.com/clients/ATRM/photos/home_bento'

// `titlePosition` puts each heading at whichever end of its picture is darker,
// which is the only thing cream type cares about. Measured mean luminance of
// each image's top 30% vs its bottom 30% (0–255):
//
//   1 Content that…    77 / 34   -> bottom
//   2 Traffic (cutout) 15 / 20   -> top   (the cut-out owns the bottom)
//   3 Reviews caught  100 / 151  -> top
//   4 Found when…     108 / 97   -> bottom
//   5 A brand that…    78 / 59   -> bottom
//   6 The guest who…   56 / 73   -> top
const bentoItems: BentoItem[] = [
  { size: 'large', titlePosition: 'bottom', title: <>Content that <em>shows you at your best</em></>, body: 'Your food, your chef, your room, whatever makes people crave you. We shoot what you already have and make it the reason they came.', cover: 'BTS wide shot — camera, chef plating, warm restaurant lighting', image: `${BENTO_CDN}/hf_20260814_193524_bdfb6f8a-d155-47fa-85ba-78268bf599c5_min.webp` },
  // The only cut-out in the set: the phone is on transparency, so the tile's
  // lime is what it sits on rather than a photograph of its own.
  { size: 'small', fill: 'lime', cutout: true, title: <>Traffic that <em>turns into tables</em></>, body: 'We send people from Instagram and Google straight to your reservation and your online order, not just to your profile.', cover: 'Hands holding a phone open on a restaurant reservation page', image: `${BENTO_CDN}/hf_20260814_192712_bea1ee09-0c5a-489c-9c39-6e77f1621b9e_min.png` },
  { size: 'small', titlePosition: 'top', title: <>Reviews caught <em>before they go public</em></>, cover: 'Three plated dishes on a marble table against a green banquette', image: `${BENTO_CDN}/DSC06328.jpg` },
  { size: 'small', titlePosition: 'bottom', title: <>Found when they&apos;re <em>ready to decide</em></>, body: 'Forty six percent of Google searches are local. When someone three blocks away is hungry, you are what they find.', cover: 'A phone in an orange jacket pocket showing a restaurant story', image: `${BENTO_CDN}/hf_20260814_191805_04781e92-1d07-419d-907e-aec6490112c2_min.webp` },
  { size: 'large', titlePosition: 'bottom', title: <>A brand that sounds like <em>you</em></>, cover: 'A roadside billboard carrying the brand at dusk', image: `${BENTO_CDN}/hf_20260814_192354_2dcf196c-f797-434e-a9eb-3b64a9c68601_min.webp` },
  { size: 'small', titlePosition: 'top', title: <>The guest who returns <em>is the business</em></>, cover: 'A guest reading a win-back message on his phone at home', image: `${BENTO_CDN}/hf_20260813_164755_d9e5278d-7df6-4814-8113-08c1d2a474db.jpg` },
]

const selectedWorkDetails = [
  { slug: 'don-chuys', result: '7,200+ followers across social.' },
  { slug: 'hotel-kc', result: 'Two-part campaign storytelling.' },
  { slug: 'chick-in-waffle', result: '$74K+ in email-attributed sales.' },
] as const

const selectedWork: Project[] = selectedWorkDetails.flatMap(({ slug, ...details }) => {
  const study = caseStudies.find(item => item.slug === slug)
  return study ? [{ study: study satisfies CaseStudy, ...details }] : []
})

const processSteps: ProcessStep[] = [
  { eyebrow: 'STRATEGIC', title: 'Discovery & brand immersion', body: 'We learn your restaurant — the food, the culture, the numbers, the competition. Not a questionnaire. A real conversation.' },
  { eyebrow: 'CREATIVE', title: 'Strategy lock + first shoot', body: 'Brand direction, visual system, and content calendar defined. Then we walk into your kitchen with cameras.' },
  { eyebrow: 'SYSTEMATIC', title: 'Activate every channel', body: 'Content goes live. Google optimized. Email flows activated. Ads launched on proven creative.' },
]

const homeStats: Stat[] = [
  { number: '$42', label: 'return on every $1 spent on restaurant email. The highest-ROI channel in hospitality.' },
  { number: '70%', label: "of first-time diners never return. The problem isn't your food. It's the silence after they leave." },
  { number: '2.7x', label: 'more guests retained by brands using direct 1:1 engagement vs those relying on broad marketing.' },
]

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <LogoTicker
        clients={clients}
        label="Trusted by hospitality brands building demand"
        size="compact"
      />
      <BentoGrid
        items={bentoItems}
        eyebrow="One system, six leaks closed"
        headline={<>What changes when every channel <em>shares a job.</em></>}
      />
      <AudiencePaths />
      <GrowthEngineDiagram />
      <WorkGrid projects={selectedWork} />
      <ComparisonMatrix />
      <StatsStrip stats={homeStats} />
      <TestimonialMarquee
        body="Owners, chefs and operators across Kansas City — in their words, not ours."
        eyebrow="Evidence from the operators"
        headline={<>We could tell you it works. <em className="font-serif italic">They already did.</em></>}
        items={railTestimonials}
      />
      <DarkProcess
        eyebrow="How We Work"
        headline={<>A monthly engine. <em className="font-serif italic">Not random posts.</em></>}
        body="Strategy, content, and technology run as one system on a 28-day cycle — so marketing stops being guesswork and you can focus on the food."
        steps={processSteps}
      />
      <SplitSection
        eyebrow="One team, not five vendors"
        headline={<>You don&apos;t need five vendors. <em>You need one system.</em></>}
        body="Brand strategy to CRM, shoots to dashboards — 11 disciplines under one roof, run as a single system. No hand-offs. No briefing your business twice."
        cta="Explore services →"
        ctaHref="/services"
        coverAlt="Icons representing the 11 services flowing into one output"
      />
      <PurchaseFAQ limit={6} />
      <CTABanner
        eyebrow="Join 15+ Hospitality Brands"
        headline={<>Been burned by an agency <em>before?</em></>}
        body="If you've outgrown freelancers, been let down by generic agencies, or just want a team that reports revenue instead of vanity — we were built for you. See the system before you commit."
        cta={CTA.primary.label}
        ctaHref={CTA.primary.href}
        ctaExternal={CTA.primary.external}
      />
    </>
  )
}
