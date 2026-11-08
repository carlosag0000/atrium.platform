import type { Metadata } from 'next'
import PublicForm from '@/components/forms/PublicForm'

// Forms made in the dashboard (Forms → New form) are shown here: /forms?f=<form-link-name>.
export const metadata: Metadata = {
  title: 'Form — Atrium',
  robots: { index: false, follow: false },
  alternates: { canonical: null },
}

export default function FormsPage() {
  return <PublicForm />
}
