'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Clock, Ticket, Share2, Users, AlertTriangle, ExternalLink, MessageCircle } from 'lucide-react'
import EventCard from '@/components/events/EventCard'
import dynamic from 'next/dynamic'
import { format, differenceInMinutes } from 'date-fns'

const SimpleMap = dynamic(() => import('@/components/ui/SimpleMap'), { 
  ssr: false, 
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" /> 
})

export default function EventDetailClient({ event, similarEvents }: any) {

  const startDate = new Date(event.starts_at)
  const endDate = event.ends_at ? new Date(event.ends_at) : null
  const durationMinutes = endDate ? differenceInMinutes(endDate, startDate) : null
  const durationHours = durationMinutes ? (durationMinutes / 60).toFixed(1) : null

  const seatPercentage = event.total_seats ? Math.round(((event.booked_seats || 0) / event.total_seats) * 100) : null
  const seatsLeft = event.total_seats ? event.total_seats - (event.booked_seats || 0) : null
  const isAlmostFull = seatsLeft !== null && seatsLeft <= 10

  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : startDate
  const isDeadlineClose = new Date().getTime() > deadline.getTime() - (48 * 60 * 60 * 1000)

  const shareEvent = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=Check out this event: ${url}`)
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`)
  }

  return (
    <>
      {/* Hero Banner */}
      <div className="w-full h-[40vh] md:h-[50vh] bg-purple-900 relative">
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill className="object-cover opacity-80" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 text-2xl font-bold bg-purple-900">
             <Calendar className="w-16 h-16 mb-4 opacity-50" />
             Event Banner
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-transparent to-transparent"></div>
        
        <div className="absolute top-6 left-6 flex gap-3">
          <span className="bg-white text-purple-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider">{event.event_type || 'Event'}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-20 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100">
               <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">{event.title}</h1>
               
               <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                       {event.organizer?.avatar_url || event.business?.logo_url ? <img src={event.organizer?.avatar_url || event.business?.logo_url} className="w-full h-full object-cover" /> : <Users className="w-6 h-6 text-gray-400" />}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Organized by</p>
                      <p className="font-bold text-gray-900">{event.business?.name || event.organizer?.full_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                       <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{format(startDate, 'MMM d, yyyy')}</p>
                      <p className="text-sm text-gray-500 font-medium">{format(startDate, 'h:mm a')} {durationHours && `(${durationHours} hrs)`}</p>
                    </div>
                  </div>
               </div>

               <h2 className="text-2xl font-bold text-gray-900 mb-4">About this Event</h2>
               <div className="prose max-w-none text-gray-600 leading-relaxed mb-8">
                 {event.description || 'No detailed description provided.'}
               </div>

               {/* Location Section */}
               <h2 className="text-2xl font-bold text-gray-900 mb-4">Location</h2>
               {event.is_online ? (
                 <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-start gap-4 mb-8">
                    <ExternalLink className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-bold text-blue-900 text-lg">Online Event</h3>
                      <p className="text-blue-800 mt-1">Links will be provided to registered attendees.</p>
                    </div>
                 </div>
               ) : (
                 <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl mb-8">
                    <div className="flex items-start gap-4 mb-4">
                      <MapPin className="w-6 h-6 text-gray-600 mt-1" />
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{event.venue_name}</h3>
                        <p className="text-gray-600 mt-1">{event.venue_address || 'Address not provided'}</p>
                      </div>
                    </div>
                    
                    {event.latitude && event.longitude && (
                      <div className="h-64 rounded-xl overflow-hidden border border-gray-200 z-0 mt-4">
                        <SimpleMap 
                          center={[event.latitude, event.longitude]} 
                          markerPosition={[event.latitude, event.longitude]} 
                        />
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>

          {/* Right Column (Sticky Booking Card) */}
          <div className="lg:col-span-1">
             <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl shadow-purple-900/5 border border-purple-100 sticky top-24">
                
                <div className="text-center mb-6 pb-6 border-b border-gray-100">
                   <div className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Ticket Price</div>
                   {event.is_free ? (
                     <div className="text-5xl font-extrabold text-green-600">FREE</div>
                   ) : (
                     <div className="text-5xl font-extrabold text-gray-900">₨ {event.price?.toLocaleString()}</div>
                   )}
                </div>

                {seatPercentage !== null && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm font-semibold mb-2 text-gray-700">
                      <span>{event.booked_seats || 0} booked</span>
                      {isAlmostFull ? <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> {seatsLeft} left!</span> : <span>{seatsLeft} left</span>}
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isAlmostFull ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(seatPercentage, 100)}%` }}></div>
                    </div>
                  </div>
                )}

                {isDeadlineClose && (
                  <div className="flex items-start gap-3 bg-red-50 p-3 rounded-xl border border-red-100 mb-6">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm font-semibold text-red-800">
                      Registration closes soon! ({format(deadline, 'MMM d, h:mm a')})
                    </p>
                  </div>
                )}

                <Link href={`/events/${event.slug}/book`} className="flex bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl text-lg transition shadow-md w-full items-center justify-center gap-2 mb-6">
                   <Ticket className="w-5 h-5" />
                   {event.is_free ? 'RSVP Now' : 'Book Seat'}
                </Link>

                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-500 mb-3">Share this event</p>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => shareEvent('facebook')} className="p-3 bg-gray-50 hover:bg-[#1877F2]/10 text-gray-600 hover:text-[#1877F2] rounded-full transition">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => shareEvent('whatsapp')} className="p-3 bg-gray-50 hover:bg-[#25D366]/10 text-gray-600 hover:text-[#25D366] rounded-full transition">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>

             </div>
          </div>
        </div>

        {/* Similar Events */}
        {similarEvents?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More like this</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarEvents.map((sim: any) => (
                <EventCard key={sim.id} event={{...sim, district: sim.district_info?.name_en}} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
