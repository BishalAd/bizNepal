import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingFlowClient from './BookingFlowClient'

export default async function EventBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: event, error } = await supabase
    .from('events')
    .select(`
      id, title, starts_at, banner_url, venue_name, is_free, price, total_seats, booked_seats, is_online, business_id
    `)
    .eq('slug', slug)
    .single()

  if (error || !event) {
    notFound()
  }

  // Prevent booking if full
  const isFull = event.total_seats && event.booked_seats >= event.total_seats

  if (isFull) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Sold Out</h2>
          <p className="text-gray-600 mb-6">Sorry, there are no more seats available for {event.title}.</p>
          <a href={`/events/${slug}`} className="block w-full bg-gray-900 text-white font-bold py-3 rounded-xl">Go Back</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <BookingFlowClient event={event} />
    </div>
  )
}
