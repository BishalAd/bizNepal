import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EventDetailClient from './EventDetailClient'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('events')
    .select('title, description, banner_url, starts_at, event_type, is_free, price, venue_name, is_online, district_info:districts!events_district_id_fkey(name_en)')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Event Not Found | Biznity' }

  const district = (data.district_info as any)?.name_en
  const eventDate = data.starts_at
    ? new Date(data.starts_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''
  const venue = data.is_online ? 'Online' : data.venue_name || district || 'Nepal'
  const priceSnippet = data.is_free ? 'Free Entry' : data.price ? `NPR ${data.price}` : ''
  const eventType = data.event_type ? data.event_type.replace(/_/g, ' ') : 'Event'
  const title = `${data.title} — ${eventType} in ${venue}${ eventDate ? ` | ${eventDate}` : '' }`
  const description = data.description
    ? data.description.substring(0, 157) + (data.description.length > 157 ? '…' : '')
    : `Join ${data.title} — a ${eventType} ${ data.is_online ? 'online' : `in ${venue}` }${ eventDate ? ` on ${eventDate}` : '' }. ${ priceSnippet }. Register on Biznity.`
  const image = data.banner_url || 'https://biznity.vercel.app/og-default.png'
  const url = `https://biznity.vercel.app/events/${slug}`

  return {
    title,
    description,
    keywords: [
      data.title, eventType, district, venue, 'nepal events', 'events in nepal', 'nepal workshops', priceSnippet,
    ].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Biznity',
      images: [{ url: image, width: 1200, height: 630, alt: data.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:profiles!events_organizer_id_fkey(full_name, avatar_url),
      business:businesses(name, slug, logo_url, whatsapp, khalti_merchant_id, esewa_merchant_id, fonepay_merchant_code)
    `)
    .eq('slug', slug)
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

  const canonicalUrl = `https://biznity.vercel.app/events/${slug}`
  const organizerName = (event.organizer as any)?.full_name || (event.business as any)?.name
  const bizSlug = (event.business as any)?.slug

  const attendanceMode = event.is_online
    ? 'https://schema.org/OnlineEventAttendanceMode'
    : 'https://schema.org/OfflineEventAttendanceMode'

  const eventJsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description ?? undefined,
    startDate: event.starts_at,
    endDate: event.ends_at ?? undefined,
    eventStatus: event.status === 'upcoming'
      ? 'https://schema.org/EventScheduled'
      : event.status === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: attendanceMode,
    location: event.is_online
      ? { '@type': 'VirtualLocation', url: canonicalUrl }
      : {
          '@type': 'Place',
          name: event.venue_name ?? undefined,
          address: {
            '@type': 'PostalAddress',
            addressLocality: event.district_id ?? undefined,
            addressCountry: 'NP',
          },
        },
    image: event.banner_url ?? undefined,
    url: canonicalUrl,
    organizer: organizerName
      ? { '@type': 'Organization', name: organizerName }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: event.is_free ? 0 : (event.price ?? 0),
      priceCurrency: 'NPR',
      availability: (event.total_seats && event.booked_seats >= event.total_seats)
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
      url: canonicalUrl,
      ...(event.ends_at ? { validThrough: event.ends_at } : {}),
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://biznity.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Events', item: 'https://biznity.vercel.app/events' },
      ...(bizSlug ? [{ '@type': 'ListItem', position: 3, name: (event.business as any)?.name, item: `https://biznity.vercel.app/businesses/${bizSlug}` }] : []),
      { '@type': 'ListItem', position: bizSlug ? 4 : 3, name: event.title, item: canonicalUrl },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <EventDetailClient event={event} similarEvents={similarEvents || []} />
    </div>
  )
}
