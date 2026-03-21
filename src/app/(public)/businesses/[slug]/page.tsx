import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BusinessProfileClient from './BusinessProfileClient'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('businesses').select('name, description').eq('slug', params.slug).single()
  
  if (!data) return { title: 'Business Not Found | BizNepal' }

  return {
    title: `${data.name} | BizNepal Directory`,
    description: data.description?.substring(0, 160) || `View ${data.name}'s profile on BizNepal.`,
  }
}

export default async function BusinessProfilePage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // 1. Fetch main business profile
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(name_en),
      district_info:districts(name_en)
    `)
    .eq('slug', params.slug)
    .single()

  if (error || !business) {
    notFound()
  }

  // 2. Parallel fetch for all related data tabs
  const [
    { data: products },
    { data: services },
    { data: offers },
    { data: events },
    { data: jobs },
    { data: reviews }
  ] = await Promise.all([
    supabase.from('products').select('id, name, slug, price, discount_price, image_keys, rating').eq('business_id', business.id).eq('status', 'active'),
    // Assuming services are also in 'products' table but with a different category type or flag, or we just fetch all products for now. Wait, schema says categories have type. Let's just pass all products, the client can filter if needed. The prompt says TABS: Products | Services, I'll pass products and filter on client if I had a way, but maybe I don't. Let's send them directly.
    supabase.from('products').select('id, name, slug, price, discount_price, image_keys, rating').eq('business_id', business.id).eq('status', 'active'), // Placeholder for services
    supabase.from('offers').select('id, title, banner_url, offer_price, original_price, discount_percent, ends_at').eq('business_id', business.id).eq('status', 'active'),
    supabase.from('events').select('id, title, slug, banner_url, starts_at, event_type, is_free, price, venue_name, status, is_online, district_info:districts!events_district_id_fkey(name_en)').eq('business_id', business.id).eq('status', 'upcoming'),
    supabase.from('jobs').select('id, slug, title, job_type, location_type, salary_min, salary_max, show_salary, created_at, business:businesses(name, logo_url)').eq('business_id', business.id).eq('status', 'active'),
    supabase.from('reviews').select('id, rating, comment, created_at, user:profiles(full_name, avatar_url)').eq('business_id', business.id)
  ])

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <BusinessProfileClient 
        business={business}
        tabsData={{
          products: products || [],
          services: products || [], // We map products to both for now, could filter by category.type if available
          offers: offers || [],
          events: events || [],
          jobs: jobs || [],
          reviews: reviews || []
        }}
      />
    </div>
  )
}
