'use client'

import { Play } from 'lucide-react'
import { useRef, useState } from 'react'

type Props = {
  /** Finished URL of the film. These are ingested straight as web variants, so
   *  there is no manifest lookup to do. */
  src: string
  poster?: string | undefined
  /** What the play button announces, e.g. "Christopher on Hotel Kansas City". */
  title: string
  /** Films are shot landscape; the social cuts off the same shoot are not. */
  ratio?: '16/9' | '9/16'
  className?: string | undefined
  /** WebVTT captions, once a film has them. The interviews ship with subtitles
   *  burned into the picture, which is what the edit delivered — a real track
   *  is still better, because burned-in text cannot be read by a screen reader
   *  or restyled, so this stays open for them. */
  captionsSrc?: string | undefined
  captionsLabel?: string | undefined
  /** The hero piece of a film-led study starts on its own, muted and looping,
   *  so the page opens on moving picture instead of a still. Sound stays the
   *  viewer's call: the controls are there from the first frame. */
  autoplay?: boolean
}

// A reel is decoration and plays itself, muted, the moment it scrolls into
// view. A film is not: these run half a minute to over a minute, they carry
// speech, and the interviews are the case study's argument. So this one waits
// to be asked. Nothing is fetched until the viewer presses play — the poster
// carries the frame — and when it starts it starts with sound, with controls,
// because someone who pressed play wants to watch it, not glance at it.
//
// `autoplay` is the one exception: the film that opens a study runs on load,
// muted and looping, because a page that opens on a frozen frame reads as a
// page that failed to load. Muted is not a preference there, it is what every
// autoplay policy allows.
export default function FeatureFilm({
  src,
  poster,
  title,
  ratio = '16/9',
  className,
  captionsSrc,
  captionsLabel,
  autoplay = false,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(autoplay)

  const start = () => {
    setStarted(true)
    // The element gets its source in the same commit, so playback is kicked off
    // on the next frame — after React has attached it.
    requestAnimationFrame(() => {
      const video = ref.current
      if (!video) return
      video.muted = false
      void video.play().catch(() => {
        // Autoplay policy refused the unmuted start (rare, since this is a real
        // click). Falling back to muted beats a play button that does nothing.
        video.muted = true
        void video.play().catch(() => undefined)
      })
    })
  }

  return (
    <div
      className={`relative isolate overflow-hidden rounded-card bg-dark ${className ?? ''}`}
      style={{ aspectRatio: ratio }}
    >
      {/* No caption track by default: the interviews carry subtitles burned into
          the picture and the ambience films have no dialogue to caption.
          `captionsSrc` renders a real track for any film that gets one. */}
      <video
        autoPlay={autoplay}
        className="h-full w-full object-cover"
        controls={started}
        loop={autoplay}
        muted={autoplay}
        playsInline
        poster={poster}
        preload={autoplay ? 'metadata' : 'none'}
        ref={ref}
        src={started ? src : undefined}
      >
        {captionsSrc ? (
          <track default kind="captions" label={captionsLabel ?? 'English'} src={captionsSrc} srcLang="en" />
        ) : null}
      </video>

      {started ? null : (
        <button
          className="group absolute inset-0 grid place-items-center bg-charcoal/20 transition-colors duration-500 ease-atrium hover:bg-charcoal/10"
          onClick={start}
          type="button"
        >
          <span className="sr-only">Play film: {title}</span>
          {/* The disc is the same cream-on-dark pairing the buttons use, so the
              control reads as part of the site rather than as a browser chrome
              artefact. */}
          <span
            aria-hidden="true"
            className="grid h-16 w-16 place-items-center rounded-full bg-cream/95 text-charcoal shadow-lg transition-transform duration-500 ease-atrium group-hover:scale-105 md:h-20 md:w-20"
          >
            <Play className="ml-1 h-6 w-6 md:h-7 md:w-7" fill="currentColor" strokeWidth={0} />
          </span>
        </button>
      )}
    </div>
  )
}
