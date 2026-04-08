import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

// Legacy route: redirect to locale-aware path
export default async function LegacyPortfolioPage({ params }: Props) {
  const { slug } = await params
  redirect(`/ko/portfolio/${slug}`)
}
