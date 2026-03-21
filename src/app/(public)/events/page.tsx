import { createClient } from '@/lib/supabase/server'
import EventsClient from './EventsClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events & Workshops | BizNepal',
  description: 'Discover upcoming workshops, concerts, networking events, and community gatherings in Nepal.',
}

export const revalidate = 60

export default async function EventsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const supabase = await createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*, organizer:profiles!events_organizer_id_fkey(full_name, avatar_url), district_info:districts!events_district_id_fkey(name_en)')
    .eq('status', 'upcoming')
    .order('starts_at', { ascending: true })

  const { data: districts } = await supabase.from('districts').select('id, name_en')

  return (
    <div className="bg-gray-50 min-h-screen">
      <EventsClient 
        initialEvents={events || []} 
        districts={districts || []}
        searchParams={searchParams}
      />
    </div>
  )
}
