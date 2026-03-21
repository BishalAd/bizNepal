import { createClient } from '@/lib/supabase/server'
import JobsClientListing from './JobsClientListing'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jobs | BizNepal',
  description: 'Find your dream job in Nepal. Browse thousands of tech, marketing, and hospitality jobs.',
}

export default async function JobsPage() {
  const supabase = await createClient()

  // Parallel fetch for filters
  const [
    { data: categories },
    { data: districts }
  ] = await Promise.all([
    supabase.from('categories').select('id, name_en').eq('type', 'job'),
    supabase.from('districts').select('id, name_en').order('name_en')
  ])

  return (
    <div className="bg-gray-50 min-h-screen">
      <JobsClientListing 
        categories={categories || []} 
        districts={districts || []} 
      />
    </div>
  )
}
