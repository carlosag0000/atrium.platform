/** Narrative blocks for the Work page.
 *
 *  These are not the case studies — a case study is the full record. A story
 *  is the short version told on the index: how the engagement ran and what
 *  came out of it, next to a handful of the actual pieces we made.
 *
 *  Only clients whose media is served from our own CDN belong here. A story
 *  block is mostly photographs; one pointed at the disabled Cloudinary account
 *  would render as a wall of empty frames. */

export type WorkStory = {
  /** Case study this story summarises and links to. */
  slug: string
  eyebrow: string
  headline: string
  /** Kicker above the images — what the pieces on the right actually are. */
  craft: string
  body: string[]
  metrics: { number: string; label: string }[]
}

export const workStories: WorkStory[] = []
