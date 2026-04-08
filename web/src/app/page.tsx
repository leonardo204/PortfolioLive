// This page should not be reached - next-intl middleware redirects / to /ko
// Kept as fallback only
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/ko')
}
