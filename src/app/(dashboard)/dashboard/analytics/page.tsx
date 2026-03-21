import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AnalyticsClient from './AnalyticsClient'

export const metadata = { title: 'Analytics | Dashboard' }

export default async function AnalyticsDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  // Parallel fetch all data for the charts
  const [
    { data: orders },
    { data: products },
    { data: jobs },
    { data: events }
  ] = await Promise.all([
    supabase.from('orders').select('id, total, created_at, order_status').eq('business_id', business.id).order('created_at', { ascending: true }),
    supabase.from('products').select('id, name, sales_count, view_count, created_at').eq('business_id', business.id).order('sales_count', { ascending: false }).limit(10),
    supabase.from('jobs').select('id, title, created_at, job_applications(id)').eq('business_id', business.id),
    supabase.from('events').select('id, title, date_time, created_at, event_bookings(id)').eq('business_id', business.id)
  ])

  return (
    <div className="animate-in fade-in duration-500">
      <AnalyticsClient 
        orders={orders || []} 
        products={products || []} 
        jobs={jobs || []} 
        events={events || []}
        businessName={business.name}
      />
    </div>
  )
}
