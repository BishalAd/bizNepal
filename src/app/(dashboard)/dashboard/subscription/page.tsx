import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionClient from './SubscriptionClient'

export const metadata = { title: 'Subscription Plans | Dashboard' }

export default async function SubscriptionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, subscription_plan, subscription_expires_at').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  // Calculate usage
  const [
    { count: productCount },
    { count: offerCount },
    { count: jobCount }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    supabase.from('offers').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('business_id', business.id)
  ])

  const usage = {
    products: productCount || 0,
    offers: offerCount || 0,
    jobs: jobCount || 0
  }

  return (
    <div className="animate-in fade-in duration-500">
      <SubscriptionClient business={business} usage={usage} />
    </div>
  )
}
