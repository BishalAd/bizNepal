import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewsClient from './ReviewsClient'

export const metadata = { title: 'Reviews Manager | Dashboard' }

export default async function ReviewsDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: reviews } = await supabase.from('reviews').select(`
    id, rating, comment, owner_reply, is_flagged, created_at,
    profiles(full_name, avatar_url)
  `).eq('business_id', business.id).order('created_at', { ascending: false })

  return (
    <div className="animate-in fade-in duration-500">
      <ReviewsClient initialReviews={reviews || []} business={business} />
    </div>
  )
}
