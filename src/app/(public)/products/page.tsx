import { createClient } from '@/lib/supabase/server'
import ProductsClientListing from './ProductsClientListing'
import { Metadata } from 'next'

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }): Promise<Metadata> {
  const resolvedParams = await searchParams
  const categoryId = typeof resolvedParams.category === 'string' ? resolvedParams.category : undefined
  const districtId = typeof resolvedParams.district === 'string' ? resolvedParams.district : undefined

  let title = 'Products in Nepal — Buy from Local Businesses | Biznity'
  let description = 'Browse the best products from verified businesses across Nepal. Shop local, find deals, and discover unique products on Biznity.'

  if (categoryId || districtId) {
    const supabase = await createClient()
    const [catRes, distRes] = await Promise.all([
      categoryId ? supabase.from('categories').select('name_en').eq('id', categoryId).single() : Promise.resolve({ data: null }),
      districtId ? supabase.from('districts').select('name_en').eq('id', districtId).single() : Promise.resolve({ data: null }),
    ])
    const catName = (catRes.data as any)?.name_en
    const distName = (distRes.data as any)?.name_en
    const parts: string[] = []
    if (catName) parts.push(catName)
    parts.push('Products')
    if (distName) parts.push(`in ${distName}`)
    parts.push('Nepal')
    title = `${parts.join(' ')} | Biznity`
    description = `Shop ${ catName ?? 'all' } products${ distName ? ` in ${distName}` : ' across Nepal' } from verified local businesses. Biznity.`
  }

  const url = 'https://biznity.vercel.app/products'
  return {
    title,
    description,
    keywords: ['nepal products', 'buy nepal', 'shop nepal', 'nepal online shopping', 'local products nepal', 'biznity products'],
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'Biznity', type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient()
  const resolvedParams = await searchParams
  
  // Parallel fetch for filters
  const [
    { data: categories },
    { data: districts }
  ] = await Promise.all([
    supabase.from('categories').select('*'),
    supabase.from('districts').select('*').order('name_en')
  ])

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://biznity.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Products in Nepal', item: 'https://biznity.vercel.app/products' },
    ],
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      {/* We pass searchParams directly as initialFilters */}
      <ProductsClientListing 
        initialFilters={resolvedParams} 
        categories={categories} 
        districts={districts} 
      />
    </div>
  )
}
