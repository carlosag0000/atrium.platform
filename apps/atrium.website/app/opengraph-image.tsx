import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 28,
          padding: 80,
          background: '#072f34',
        }}
      >
        <svg width="72" height="72" viewBox="0 0 186 186" fill="#B5F2DB" role="img" aria-label="Atrium">
          <path d="M140.47,51.19c0,14.05-2.3,30.16-7.54,44.89,4.1,11.48,9.35,29.13,9.35,40.78h-19.68c0-3.94-.98-9.77-2.62-16.45-9.35,12.17-21.98,20.39-38.86,20.39-25.42,0-37.39-23.3-37.39-47.12s14.59-48.49,39.52-48.49c15.42,0,27.39,10.45,36.24,23.99.82-5.82,1.31-11.99,1.31-17.99h19.68-.01ZM81.11,123.67c14.76,0,24.92-13.19,30.99-27.41-7.38-17.82-17.87-33.93-28.86-33.93-8.85,0-15.41,9.42-17.87,17.48-1.47,4.45-1.97,9.25-1.97,13.88,0,11.14,4.1,29.98,17.71,29.98Z" />
        </svg>
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 600, color: '#F7F9F2', letterSpacing: '-0.02em' }}>
          Hospitality Marketing
        </div>
        <div style={{ display: 'flex', fontSize: 32, color: '#B5F2DB', opacity: 0.8 }}>
          Smart creative for restaurants, hotels, and food brands.
        </div>
      </div>
    ),
    { ...size }
  )
}

export const dynamic = "force-static"
