import { createClient } from '@/lib/supabase/server'
import BusinessDirectoryClient from './BusinessDirectoryClient'
import { Metadata } from 'next'

type SearchParams = Promise<{ category?: string; district?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { category: categoryId, district: districtId } = await searchParams
  const isFiltered = !!(categoryId || districtId)

  let title = 'Business Directory Nepal — Find Local Businesses | BizNepal'
  let description = 'Find verified businesses, services, and places across Nepal. Browse by category, district, and rating on BizNepal.'

  if (isFiltered) {
    const supabase = await createClient()
    const [categoryRes, districtRes] = await Promise.all([
      categoryId ? supabase.from('categories').select('name_en').eq('id', categoryId).single() : Promise.resolve({ data: null }),
      districtId ? supabase.from('districts').select('name_en').eq('id', districtId).single() : Promise.resolve({ data: null }),
    ])
    const categoryName = (categoryRes.data as any)?.name_en
    const districtName = (districtRes.data as any)?.name_en

    const parts: string[] = []
    if (categoryName) parts.push(categoryName)
    parts.push('Businesses in')
    if (districtName) parts.push(districtName)
    parts.push('Nepal')

    title = `${parts.join(' ')} | BizNepal`
    description = `Browse ${categoryName ?? 'all'} businesses${districtName ? ` in ${districtName}` : ' across Nepal'}. Find verified local businesses on BizNepal.`
  }

  const canonicalParts = ['https://biz-nepal.vercel.app/businesses']
  const paramParts: string[] = []
  if (categoryId) paramParts.push(`category=${categoryId}`)
  if (districtId) paramParts.push(`district=${districtId}`)
  const canonicalUrl = canonicalParts[0] + (paramParts.length ? `?${paramParts.join('&')}` : '')

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'BizNepal',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  }
}

export default async function BusinessDirectoryPage() {
  const supabase = await createClient()

  const [
    { data: categories },
    { data: districts },
    { data: initialBusinesses }
  ] = await Promise.all([
    supabase.from('categories').select('id, name_en, slug').in('type', ['product', 'service']),
    supabase.from('districts').select('id, name_en').order('name_en'),
    supabase.from('businesses').select(`
      id, name, slug, logo_url, cover_url, rating, review_count, city, address, 
      latitude, longitude, is_verified, hours, whatsapp, district_id, category_id,
      category:categories(name_en),
      district_info:districts(name_en)
    `).eq('is_active', true).limit(50)
  ])

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://biz-nepal.vercel.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Business Directory',
        item: 'https://biz-nepal.vercel.app/businesses',
      },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BusinessDirectoryClient 
        categories={categories || []} 
        districts={districts || []} 
        initialBusinesses={initialBusinesses || []}
      />
    </div>
  )
}
