import type { Metadata } from 'next'
import Dashboard from '@/components/admin/Dashboard'

// Private website dashboard (traffic, forms, careers, team). Sign-in is checked by /api/admin.php.
export const metadata: Metadata = {
  title: 'Dashboard — Atrium',
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
}

export default function AdminPage() {
  return <Dashboard />
}
