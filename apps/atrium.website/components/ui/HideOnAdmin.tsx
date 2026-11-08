'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// The dashboard at /admin is a full-screen app: the public site's navbar and footer stay out of it.
export default function HideOnAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  if (pathname && /^\/admin(\/|$)/.test(pathname)) return null
  return <>{children}</>
}
