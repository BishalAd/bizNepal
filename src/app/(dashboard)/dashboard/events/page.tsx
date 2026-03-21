import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventsClient from './EventsClient'

export const metadata = { title: 'Events Management | Dashboard' }

export default async function EventsDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: events } = await supabase.from('events').select(`
    id, title, date_time, end_time, is_online, location, 
    is_free, price, total_seats, status, banner_url, created_at,
    event_bookings(id, total_amount)
  `).eq('business_id', business.id).order('date_time', { ascending: true })

  return (
    <div className="animate-in fade-in duration-500">
      <EventsClient initialEvents={events || []} />
    </div>
  )
}
