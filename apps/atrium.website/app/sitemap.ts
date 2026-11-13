import type { MetadataRoute } from 'next'
import { services } from '@/lib/services'
import { caseStudies } from '@/lib/work'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.atriumad.com'

const STATIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/insights',
  '/pricing',
  '/resources',
  '/services',
  '/work',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }))

  const serviceEntries: MetadataRoute.Sitemap = services.map((svc) => ({
    url: `${SITE_URL}/services/${svc.slug}`,
    lastModified: new Date(),
  }))

  const caseStudyEntries: MetadataRoute.Sitemap = [...caseStudies]
    .sort((a, b) => a.order - b.order)
    .map((study) => ({
      url: `${SITE_URL}/work/${study.slug}`,
      lastModified: new Date(),
    }))

  return [...staticEntries, ...serviceEntries, ...caseStudyEntries]
}

export const dynamic = "force-static"
