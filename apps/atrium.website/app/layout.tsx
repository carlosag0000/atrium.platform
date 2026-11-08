import type { Metadata } from 'next'
import Tracker from '@/components/analytics/Tracker'
import CalEmbedProvider from '@/components/ui/CalEmbedProvider'
import Footer from '@/components/ui/Footer'
import GSAPProvider from '@/components/ui/GSAPProvider'
import HideOnAdmin from '@/components/ui/HideOnAdmin'
import Navbar from '@/components/ui/Navbar'
import PageTransitionProvider from '@/components/ui/PageTransitionProvider'
import TabTitleSwitcher from '@/components/ui/TabTitleSwitcher'
import { instrumentSerif, interTight, nothingYouCouldDo } from '@/lib/fonts'

import './globals.css'

const title = 'Atrium — Hospitality Marketing'
const description = 'Smart creative for restaurants, hotels, and food brands.'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.atriumad.com'),
  title,
  description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title,
    description,
    type: 'website',
    siteName: 'Atrium',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Atrium',
  description,
  areaServed: 'US',
  address: [
    { '@type': 'PostalAddress', addressLocality: 'Houston', addressRegion: 'TX', addressCountry: 'US' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${instrumentSerif.variable} ${nothingYouCouldDo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD, no user input */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <TabTitleSwitcher />
        <Tracker />
        <CalEmbedProvider>
          <PageTransitionProvider>
            <GSAPProvider>
              <HideOnAdmin>
                <Navbar />
              </HideOnAdmin>
              <main className="flex-1">{children}</main>
              <HideOnAdmin>
                <Footer />
              </HideOnAdmin>
            </GSAPProvider>
          </PageTransitionProvider>
        </CalEmbedProvider>
      </body>
    </html>
  )
}
