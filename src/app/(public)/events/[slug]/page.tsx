import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EventDetailClient from './EventDetailClient'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('events').select('title, description').eq('slug', params.slug).single()
  
  if (!data) return { title: 'Event Not Found | BizNepal' }

  return {
    title: `${data.title} | BizNepal Events`,
    description: data.description?.substring(0, 160) || `Register for ${data.title} on BizNepal.`,
  }
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:profiles!events_organizer_id_fkey(full_name, avatar_url),
      business:businesses(name, slug, logo_url)
    `)
    .eq('slug', params.slug)
    .single()

  if (error || !event) {
    notFound()
  }

  // Fetch similar events
  const { data: similarEvents } = await supabase
    .from('events')
    .select('id, title, slug, banner_url, starts_at, event_type, is_free, price, venue_name, status, is_online, booked_seats, total_seats, district_info:districts!events_district_id_fkey(name_en)')
    .eq('event_type', event.event_type)
    .eq('status', 'upcoming')
    .neq('id', event.id)
    .limit(3)

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <EventDetailClient event={event} similarEvents={similarEvents || []} />
    </div>
  )
}
