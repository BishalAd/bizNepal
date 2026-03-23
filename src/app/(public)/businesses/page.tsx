import { createClient } from '@/lib/supabase/server'
import BusinessDirectoryClient from './BusinessDirectoryClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Business Directory | BizNepal',
  description: 'Find verified businesses, services, and places across Nepal.',
}

export default async function BusinessDirectoryPage() {
  const supabase = await createClient()

  const [
    { data: categories },
    { data: districts },
    { data: initialBusinesses }
  ] = await Promise.all([
    supabase.from('categories').select('id, name_en, slug').eq('type', 'business'),
    supabase.from('districts').select('id, name_en').order('name_en'),
    supabase.from('businesses').select(`
      id, name, slug, logo_url, cover_url, rating, review_count, city, address, 
      latitude, longitude, is_verified, hours, whatsapp,
      category:categories(name_en),
      district_info:districts(name_en)
    `).eq('is_active', true).limit(50)
  ])

  return (
    <div className="bg-gray-50 min-h-screen">
      <BusinessDirectoryClient 
        categories={categories || []} 
        districts={districts || []} 
        initialBusinesses={initialBusinesses || []}
      />
    </div>
  )
}
