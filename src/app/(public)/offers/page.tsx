import { createClient } from '@/lib/supabase/server'
import OffersClient from './OffersClient'
import { Metadata } from 'next'

type SearchParams = Promise<{ category?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { category: cat } = await searchParams

  let title = 'Best Deals & Offers in Nepal — Discounts & Sales | Biznity'
  let description = 'Find the best deals, discounts, and exclusive offers from verified businesses across Nepal. Save more on Biznity.'

  if (cat) {
    const supabase = await createClient()
    const { data } = await supabase.from('categories').select('name_en').eq('id', cat).single()
    if (data?.name_en) {
      title = `${data.name_en} Deals & Offers in Nepal | Biznity`
      description = `Browse exclusive ${data.name_en} deals and discounts from businesses across Nepal on Biznity.`
    }
  }

  const url = 'https://biznity.vercel.app/offers'
  return {
    title,
    description,
    keywords: ['nepal deals', 'nepal offers', 'nepal discounts', 'nepal sales', 'best deals nepal', 'biznity offers'],
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Biznity', type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export const revalidate = 60 // revalidate every minute for offers

export default async function OffersPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const resolvedParams = await searchParams

  // Fetch initial active offers with business details
  const { data: offers } = await supabase
    .from('offers')
    .select('*, business:businesses(*)')
    .eq('status', 'active')
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })

  // Fetch categories that have type='product' or 'service' (since offers apply to these)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_en')
    .in('type', ['product', 'service'])

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://biznity.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Deals & Offers', item: 'https://biznity.vercel.app/offers' },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <OffersClient 
        initialOffers={offers || []} 
        categories={categories || []}
        searchParams={resolvedParams}
      />
    </div>
  )
}
