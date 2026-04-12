import { createClient } from '@/lib/supabase/server'
import EventsClient from './EventsClient'
import { Metadata } from 'next'

type SearchParams = Promise<{ district?: string; type?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { district: dist, type: eventType } = await searchParams
  const isFiltered = !!(dist || eventType)

  let title = 'Events & Workshops in Nepal — Upcoming Events | BizNepal'
  let description = 'Discover upcoming workshops, concerts, networking events, and community gatherings in Nepal. Register for free and paid events on BizNepal.'

  if (isFiltered) {
    const supabase = await createClient()
    const distRes = dist
      ? await supabase.from('districts').select('name_en').eq('id', dist).single()
      : { data: null }
    const distName = (distRes.data as any)?.name_en
    const typeName = eventType ? eventType.replace(/_/g, ' ') : ''

    const parts: string[] = []
    if (typeName) parts.push(typeName)
    parts.push('Events')
    if (distName) parts.push(`in ${distName}`)
    parts.push('Nepal')
    title = `${parts.join(' ')} | BizNepal`
    description = `Find upcoming ${ typeName || 'all' } events${ distName ? ` in ${distName}` : ' across Nepal' }. Register on BizNepal.`
  }

  const url = 'https://biz-nepal.vercel.app/events'
  return {
    title,
    description,
    keywords: ['nepal events', 'events in nepal', 'workshops nepal', 'concerts nepal', 'networking nepal', 'biznepal events'],
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'BizNepal', type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export const revalidate = 60

export default async function EventsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const resolvedParams = await searchParams

  const { data: events } = await supabase
    .from('events')
    .select('*, organizer:profiles!events_organizer_id_fkey(full_name, avatar_url), district_info:districts!events_district_id_fkey(name_en)')
    .eq('status', 'upcoming')
    .order('starts_at', { ascending: true })

  const { data: districts } = await supabase.from('districts').select('id, name_en')

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://biz-nepal.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Events in Nepal', item: 'https://biz-nepal.vercel.app/events' },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <EventsClient 
        initialEvents={events || []} 
        districts={districts || []}
        searchParams={resolvedParams}
      />
    </div>
  )
}
