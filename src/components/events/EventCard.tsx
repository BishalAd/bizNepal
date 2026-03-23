import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin } from 'lucide-react'

export default function EventCard({ event }: { event: any }) {
  const isOnline = event.is_online || !event.venue_name
  const dateStr = new Date(event.starts_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = new Date(event.starts_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  const seatPercentage = event.total_seats ? Math.round(((event.booked_seats || 0) / event.total_seats) * 100) : null
  const seatsLeft = event.total_seats ? event.total_seats - (event.booked_seats || 0) : null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full group hover:shadow-md transition">
      {/* Banner */}
      <div className="h-48 bg-gray-100 relative overflow-hidden">
        {event.banner_url ? (
          <Image src={event.banner_url} alt={event.title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition duration-500" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <Calendar className="w-10 h-10 mb-2 opacity-50" />
            <span className="text-sm font-medium">Event Banner</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
           <span className="bg-white/90 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-gray-900 shadow-sm">
             {event.event_type || 'Event'}
           </span>
           {isOnline && (
             <span className="bg-blue-600 px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
               Online
             </span>
           )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-3 leading-tight group-hover:text-purple-700 transition">
          {event.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
            <div className="w-8 h-8 rounded bg-white shadow-sm border border-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">{dateStr}</div>
              <div className="text-xs">{timeStr}</div>
            </div>
          </div>
          
          {!isOnline && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate">{event.venue_name}{event.district && `, ${event.district}`}</span>
            </div>
          )}
        </div>

        {/* Progress Bar for seats */}
        {seatPercentage !== null && (
          <div className="mt-auto mb-4">
            <div className="flex justify-between text-xs font-medium mb-1.5 text-gray-600">
              <span>{seatsLeft} seats left</span>
              <span>{seatPercentage}% booked</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
               <div className={`h-full rounded-full ${seatPercentage > 85 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${seatPercentage}%` }}></div>
            </div>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className={`px-2.5 py-1 rounded-md text-sm font-extrabold ${event.status === 'cancelled' ? 'bg-red-50 text-red-600' : event.is_free ? 'bg-green-50 text-green-700' : 'text-gray-900'}`}>
            {event.status === 'cancelled' ? 'CANCELLED' : event.is_free ? 'FREE' : `₨ ${event.price?.toLocaleString()}`}
          </span>
          <Link href={`/events/${event.slug}`} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
            {event.is_free ? 'Register' : 'Book Seat'}
          </Link>
        </div>
      </div>
    </div>
  )
}
