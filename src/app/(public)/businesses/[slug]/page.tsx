import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BusinessProfileClient from './BusinessProfileClient'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('businesses')
    .select('name, description, logo_url, cover_url, category:categories(name_en), district_info:districts(name_en)')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Business Not Found | Biznity' }

  const category = (data.category as any)?.name_en ?? 'Business'
  const district = (data.district_info as any)?.name_en ?? 'Nepal'
  const title = `${data.name} — ${category} in ${district}, Nepal`
  const description = data.description
    ? data.description.substring(0, 157) + (data.description.length > 157 ? '…' : '')
    : `Explore ${data.name}, a ${category} located in ${district}, Nepal. View contact details, reviews, offers, and more on Biznity.`
  const image = data.logo_url || data.cover_url || 'https://biznity.vercel.app/og-default.png'
  const url = `https://biznity.vercel.app/businesses/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Biznity',
      images: [{ url: image, width: 1200, height: 630, alt: data.name }],
      type: 'website',
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function BusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Fetch main business profile
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(name_en),
      district_info:districts(name_en)
    `)
    .eq('slug', slug)
    .single()

  if (error || !business) {
    notFound()
  }

  // Track profile view (Soft-fail to prevent page crash)
  try {
    supabase.from('analytics_events').insert({
      business_id: business.id,
      entity_type: 'profile',
      entity_id: business.id,
      event_type: 'view',
    }).then(({ error }) => {
      if (error) console.warn('Analytics error:', error.message)
    })
  } catch (e) {
    console.warn('Analytics tracking failed')
  }

  // 2. Parallel fetch for all related data tabs
  // Products: categories with type='product'; Services: categories with type='service'
  const [
    { data: products },
    { data: services },
    { data: offers },
    { data: events },
    { data: jobs },
    { data: reviews }
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price, discount_price, image_keys, rating, category:categories(type)')
      .eq('business_id', business.id)
      .eq('status', 'active'),
    supabase
      .from('products')
      .select('id, name, slug, price, discount_price, image_keys, rating, category:categories(type)')
      .eq('business_id', business.id)
      .eq('status', 'active'),
    supabase.from('offers').select('id, title, banner_url, offer_price, original_price, discount_percent, ends_at').eq('business_id', business.id).eq('status', 'active'),
    supabase.from('events').select('id, title, slug, banner_url, starts_at, event_type, is_free, price, venue_name, status, is_online, district_info:districts!events_district_id_fkey(name_en)').eq('business_id', business.id).eq('status', 'upcoming'),
    supabase.from('jobs').select('id, slug, title, job_type, location_type, salary_min, salary_max, show_salary, created_at, business:businesses(name, logo_url)').eq('business_id', business.id).eq('status', 'active'),
    supabase.from('reviews').select('id, rating, comment, created_at, user:profiles(full_name, avatar_url)').eq('business_id', business.id)
  ])

  // Split products vs services by category.type
  const productItems = (products || []).filter((p: any) => p.category?.type !== 'service')
  const serviceItems = (services || []).filter((p: any) => p.category?.type === 'service')

  const canonicalUrl = `https://biznity.vercel.app/businesses/${slug}`
  const businessCategory = (business.category as any)?.name_en ?? 'LocalBusiness'
  const districtName = (business.district_info as any)?.name_en ?? ''
  const businessImage = business.logo_url || business.cover_url

  // Build opening hours spec array from stored hours object
  const openingHoursSpec: string[] = []
  if (business.hours && typeof business.hours === 'object') {
    const dayMap: Record<string, string> = {
      monday: 'Mo', tuesday: 'Tu', wednesday: 'We', thursday: 'Th',
      friday: 'Fr', saturday: 'Sa', sunday: 'Su',
    }
    for (const [day, val] of Object.entries(business.hours as Record<string, any>)) {
      if (val && val.open && val.close && !val.closed) {
        const dayCode = dayMap[day.toLowerCase()] ?? day
        openingHoursSpec.push(`${dayCode} ${val.open}-${val.close}`)
      }
    }
  }

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : business.rating ?? null

  const localBusinessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description ?? undefined,
    url: canonicalUrl,
    telephone: business.whatsapp ? `+977${business.whatsapp.replace(/^\+977/, '')}` : undefined,
    image: businessImage ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address ?? undefined,
      addressLocality: (districtName || business.city) ?? undefined,
      addressCountry: 'NP',
    },
    ...(business.latitude && business.longitude ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: business.latitude,
        longitude: business.longitude,
      },
    } : {}),
    ...(openingHoursSpec.length > 0 ? { openingHours: openingHoursSpec } : {}),
    ...(avgRating && reviews && reviews.length > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://biznity.vercel.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Business Directory',
        item: 'https://biznity.vercel.app/businesses',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: business.name,
        item: canonicalUrl,
      },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BusinessProfileClient 
        business={business}
        tabsData={{
          products: productItems,
          services: serviceItems,
          offers: offers || [],
          events: events || [],
          jobs: jobs || [],
          reviews: reviews || []
        }}
      />
    </div>
  )
}
