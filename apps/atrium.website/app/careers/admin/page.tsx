import type { Metadata } from 'next'
import CareersAdmin from '@/components/careers/CareersAdmin'

// Password-protected list of job applications. The password is checked by /careers-api/admin.php.
export const metadata: Metadata = {
  title: 'Aplicaciones — Atrium',
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: null },
}

export default function CareersAdminPage() {
  return <CareersAdmin />
}
