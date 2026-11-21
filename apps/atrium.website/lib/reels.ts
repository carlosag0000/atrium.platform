// ─── Reel delivery ──────────────────────────────────────────────────────────
// The CDN holds the edit bay's delivery copies of every reel: 1080x1920 at
// ~19 Mbps, which is 17 MB for seven seconds. `apps/atrium.cdn` transcodes
// those into a `web/` folder beside each source and records what it produced
// in `reels.manifest.json`; this maps a source URL onto that variant.
//
// A reel only appears in the manifest once its variant is on disk, so anything
// not listed keeps its original URL — a partial encode run thins the savings,
// it never points the site at a 404.

import manifest from './reels.manifest.json'

export type ReelDelivery = {
  /** The URL to play: the web variant when one exists, else the source. */
  src: string
  /** Poster frame, when the variant was built with one. */
  poster?: string
}

type Entry = { source: string; web: string; poster: string }

const BASE: string = manifest.base
const entries = manifest.reels as Entry[]

/** Manifest keys are decoded paths. Call sites carry the CDN's own naming,
 *  which is %-escaped in some lists and literal in others, so both normalize
 *  to the same key before lookup. */
function key(url: string): string {
  const path = url.trim().startsWith(BASE) ? url.trim().slice(BASE.length) : url.trim()
  try {
    return decodeURIComponent(path)
  } catch {
    // A stray % that is not a valid escape — compare on the raw path instead of
    // throwing out of a render.
    return path
  }
}

const index = new Map(entries.map((entry) => [key(entry.source), entry]))

/** CDN paths carry spaces and non-breaking spaces; encode each segment the way
 *  a browser would so the request resolves. Variant paths are already slugs and
 *  come out of this unchanged. */
function toUrl(path: string): string {
  return `${BASE}/${path.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/')}`
}

/** Optimized source and poster for a reel URL. Non-CDN sources (Cloudinary
 *  public IDs, local files, third-party samples) pass through untouched. */
export function reelDelivery(src: string): ReelDelivery {
  const trimmed = src.trim()
  if (!trimmed.startsWith(BASE)) return { src: trimmed }

  const entry = index.get(key(trimmed))
  if (!entry) return { src: trimmed }

  return { src: toUrl(entry.web), poster: toUrl(entry.poster) }
}

/** How many of the CDN's reels currently have a web variant. Reported by the
 *  encode script and asserted in tests. */
export const optimizedReelCount = entries.length

/** Find a delivered reel by part of its file name (case and non-breaking spaces ignored).
 *  Returns the source URL to hand to <LazyVideo>, or undefined when no reel matches. */
export function findReel(match: string): string | undefined {
  const norm = (s: string) => s.replace(/ /g, ' ').toLowerCase()
  const want = norm(match)
  const entry = entries.find((e) => norm(e.source).includes(want))
  return entry ? `${BASE}${entry.source}` : undefined
}
