import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, Calendar, Users, ShieldCheck, Mail, Globe, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import EventTicketValidator from '@/components/dashboard/events/EventTicketValidator'

export default async function EventAttendeesPage({ params }: { params: Promise<any> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Get Event Details
  const { data: event } = await supabase.from('events').select('*').eq('id', id).single()
  if (!event) redirect('/dashboard/events')

  // 2. Fetch Attendees
  const { data: attendees } = await supabase
    .from('event_bookings')
    .select('*')
    .eq('event_id', id)
    .order('created_at', { ascending: false })

  const totalRevenue = attendees?.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0) || 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events" className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-900">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900">Event Attendees</h1>
          <p className="text-gray-500 font-medium">Tracking registrations for "<span className="text-orange-600 underline font-bold">{event.title}</span>"</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 mb-6">
               <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                 <Users className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Confirmed Guests</p>
                  <p className="text-2xl font-black text-gray-900 leading-none">{attendees?.length || 0}</p>
               </div>
             </div>
             
             <div className="space-y-4">
               <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Capacity</p>
                 <p className="text-xl font-black text-gray-700">{event.total_seats || 'Unlimited'}</p>
               </div>
               <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                 <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Revenue Earned</p>
                 <p className="text-2xl font-black text-green-700">₨ {totalRevenue.toLocaleString()}</p>
               </div>
             </div>
           </div>

           <div className="bg-orange-600 p-8 rounded-[2.5rem] shadow-xl text-white">
              <h3 className="text-xl font-black mb-2 flex items-center gap-2"><Globe className="w-6 h-6" /> Event Info</h3>
              <div className="space-y-4 mt-6">
                 <div className="flex items-start gap-3">
                   <Calendar className="w-5 h-5 text-orange-200 shrink-0 mt-0.5" />
                   <div>
                     <p className="text-xs font-bold text-orange-100 uppercase tracking-wider">Date & Time</p>
                     <p className="font-bold">{format(new Date(event.starts_at), 'MMMM d, yyyy')}</p>
                     <p className="text-sm text-orange-100">{format(new Date(event.starts_at), 'h:mm a')} onwards</p>
                   </div>
                 </div>
                 <div className="flex items-start gap-3">
                   <MapPin className="w-5 h-5 text-orange-200 shrink-0 mt-0.5" />
                   <div>
                     <p className="text-xs font-bold text-orange-100 uppercase tracking-wider">Venue</p>
                     <p className="font-bold">{event.is_online ? 'Online Event' : event.venue_name}</p>
                   </div>
                 </div>
              </div>
           </div>

           {/* Add QR Ticket Scanner */}
           <EventTicketValidator eventId={event.id} />
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2">
           <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-8 border-b border-gray-100">
               <h3 className="text-xl font-black text-gray-900">Registration List</h3>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-black text-[10px] tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Attendee</th>
                      <th className="px-8 py-4">Contact</th>
                      <th className="px-8 py-4">Tickets</th>
                      <th className="px-8 py-4">Payment</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {attendees?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-gray-400">
                           <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                           <p className="font-bold">No registrations yet.</p>
                        </td>
                      </tr>
                    ) : (
                      attendees?.map((att: any) => (
                        <tr key={att.id} className="hover:bg-gray-50 transition group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                                {att.attendee_name?.[0]}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-gray-900">{att.attendee_name}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">ID: {att.id.slice(0,8)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-gray-900 font-bold">
                                <Phone className="w-3.5 h-3.5 text-gray-400" /> {att.attendee_phone}
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-500 font-medium">
                                <Mail className="w-3.5 h-3.5 text-gray-400" /> {att.attendee_email}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                             <span className="font-black text-gray-900">{att.ticket_count || 1} Tickets</span>
                          </td>
                          <td className="px-8 py-5">
                            <span className="px-2.5 py-1 bg-gray-100 rounded-lg font-black text-[10px] uppercase tracking-wider text-gray-600">
                              {att.payment_method || 'Online'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                               att.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                             }`}>
                               {att.payment_status || 'Pending'}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
           </div>
        </div>

      </div>
    </div>
  )
}
