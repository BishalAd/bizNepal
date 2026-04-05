'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Calendar, MapPin, Globe, Users, DollarSign, Edit, Trash2, CheckCircle2, Camera, Search } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import { format, isPast } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import QRScanner from '@/components/dashboard/QRScanner'

export default function EventsClient({ initialEvents }: any) {
  const supabase = createClient()
  const [events, setEvents] = useState(initialEvents)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming')

  const stats = useMemo(() => {
    let totalAttendees = 0
    let totalRevenue = 0
    
    events.forEach((e:any) => {
      totalAttendees += (e.event_bookings?.length || 0)
      e.event_bookings?.forEach((b:any) => {
        totalRevenue += Number(b.total_amount || 0)
      })
    })

    const upcoming = events.filter((e:any) => !isPast(new Date(e.starts_at)))
    const past = events.filter((e:any) => isPast(new Date(e.starts_at)))

    return { totalAttendees, totalRevenue, upcoming, past }
  }, [events])

  const displayEvents = activeTab === 'upcoming' ? stats.upcoming : stats.past

  const [showScanner, setShowScanner] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event permanently? All RSVPs will be lost.")) return
    setLoadingAction(id)
    try {
      const { error } = await supabase.from('events').delete().eq('id', id)
      if (error) throw error
      setEvents(events.filter((e:any) => e.id !== id))
      toast.success("Event deleted")
    } catch {
      toast.error("Failed to delete event. Close it first if there are bookings.")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleScanSuccess = async (decodedText: string) => {
    // Basic logic to verify ticket (In a real app, this would call an API with the event_id and ticket_code)
    try {
      toast.loading("Validating ticket...", { id: 'validate' })
      // We assume decodedText contains the booking_id or a unique code
      const { data, error } = await supabase.from('event_bookings').select('*, status').eq('id', decodedText).maybeSingle()
      
      if (error) throw error
      if (!data) {
        toast.error("Invalid ticket code scanned from other source", { id: 'validate' })
        return
      }

      if (data.status === 'confirmed') {
        // Mark as checked-in? We'd ideally have a check_in column.
        toast.success(`Ticket Valid! Welcome ${data.attendee_name || 'Guest'}`, { id: 'validate' })
      } else {
        toast.error(`Ticket status: ${data.status}`, { id: 'validate' })
      }

    } catch (e: any) {
      toast.error(e.message || "Failed to validate", { id: 'validate' })
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Events Management</h1>
            <p className="text-gray-500 mt-1">Host webinars, workshops, and physical events.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
             <button 
               onClick={() => setShowScanner(true)}
               className="flex-1 sm:flex-none bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center justify-center shadow-lg shadow-gray-950/20"
             >
               <Camera className="w-5 h-5 mr-2 text-orange-400" /> Scan Tickets
             </button>
             <Link href="/dashboard/events/new" className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center justify-center shadow-sm whitespace-nowrap">
               <Plus className="w-5 h-5 mr-2" /> Create Event
             </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Upcoming Events" value={stats.upcoming.length} icon={<Calendar className="w-6 h-6" />} color="orange" />
          <StatsCard title="Total Attendees" value={stats.totalAttendees} icon={<Users className="w-6 h-6" />} color="blue" />
          <StatsCard title="Ticket Revenue" value={`₨ ${stats.totalRevenue.toLocaleString()}`} icon={<DollarSign className="w-6 h-6" />} color="green" trend="up" trendValue="15%" />
          <StatsCard title="Past Events" value={stats.past.length} icon={<CheckCircle2 className="w-6 h-6" />} color="gray" />
        </div>

        {/* Main List Box */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
          
          <div className="px-6 pt-6 border-b border-gray-100 flex gap-6">
             <button onClick={()=>setActiveTab('upcoming')} className={`pb-4 font-bold text-sm tracking-wide transition border-b-2 ${activeTab === 'upcoming' ? 'border-orange-600 text-orange-700' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
               Upcoming <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'upcoming' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>{stats.upcoming.length}</span>
             </button>
             <button onClick={()=>setActiveTab('past')} className={`pb-4 font-bold text-sm tracking-wide transition border-b-2 ${activeTab === 'past' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
               Past Events <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'past' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600'}`}>{stats.past.length}</span>
             </button>
          </div>

          <div className="p-6">
            {displayEvents.length === 0 ? (
               <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                 <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                 <h3 className="text-lg font-bold text-gray-900">No {activeTab} events</h3>
                 <p className="text-gray-500 mb-6">Start engaging your audience by hosting an event.</p>
                 <Link href="/dashboard/events/new" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 px-5 py-2 rounded-lg font-bold transition inline-flex items-center">
                   <Plus className="w-4 h-4 mr-2" /> Host Event
                 </Link>
               </div>
            ) : (
               <div className="grid lg:grid-cols-2 gap-6">
                 {displayEvents.map((e:any) => {
                   const attendeesCount = e.event_bookings?.length || 0
                   const revenue = e.event_bookings?.reduce((acc:any, curr:any) => acc + Number(curr.total_amount||0), 0) || 0
                   
                   return (
                     <div key={e.id} className={`flex flex-col sm:flex-row bg-white border rounded-2xl overflow-hidden transition group ${activeTab === 'past' ? 'border-gray-200 opacity-80' : 'border-orange-100 shadow-sm hover:shadow-md hover:border-orange-200'}`}>
                        
                        <div className="sm:w-48 h-48 sm:h-auto bg-gray-100 relative shrink-0">
                          {e.banner_url ? <img src={e.banner_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-orange-50"><Calendar className="w-10 h-10 text-orange-200"/></div>}
                          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur rounded-lg px-2.5 py-1 text-center shadow-sm">
                             <div className="text-xs font-bold text-red-600 uppercase">{format(new Date(e.starts_at), 'MMM')}</div>
                             <div className="text-lg font-black text-gray-900 leading-none">{format(new Date(e.starts_at), 'd')}</div>
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                           <div className="flex justify-between items-start gap-2 mb-2">
                             <h3 className="font-extrabold text-gray-900 text-lg leading-tight line-clamp-2">{e.title}</h3>
                             <span className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap ${e.is_free ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}>
                               {e.is_free ? 'FREE' : `₨ ${e.price?.toLocaleString()}`}
                             </span>
                           </div>
                           
                           <p className="text-sm font-bold text-gray-500 flex items-center gap-1.5 mb-1 text-orange-600">
                             <Calendar className="w-4 h-4"/> {format(new Date(e.starts_at), 'h:mm a')} — {format(new Date(e.ends_at), 'h:mm a')}
                           </p>
                           <p className="text-sm font-bold text-gray-500 flex items-center gap-1.5 mb-4 truncate text-blue-600">
                             {e.is_online ? <><Globe className="w-4 h-4"/> Online Event</> : <><MapPin className="w-4 h-4"/> {e.venue_name}</>}
                           </p>
                           
                           <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                              <div className="flex gap-4">
                                <div>
                                  <p className="text-xs font-bold text-gray-400 mb-0.5">Attendees</p>
                                  <p className="font-extrabold text-gray-900 text-base">{attendeesCount} <span className="text-sm text-gray-400 font-bold">/ {e.total_seats || '∞'}</span></p>
                                </div>
                                {!e.is_free && (
                                  <div>
                                    <p className="text-xs font-bold text-gray-400 mb-0.5">Revenue</p>
                                    <p className="font-extrabold text-green-600 text-base">₨ {revenue.toLocaleString()}</p>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <Link href={`/dashboard/events/${e.id}/attendees`} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition" title="View Attendees"><Search className="w-4 h-4"/></Link>
                                <Link href={`/dashboard/events/${e.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Event"><Edit className="w-4 h-4"/></Link>
                                <button onClick={() => handleDelete(e.id)} disabled={loadingAction===e.id} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete"><Trash2 className="w-4 h-4"/></button>
                              </div>
                           </div>
                        </div>
                     </div>
                   )
                 })}
               </div>
            )}
          </div>
        </div>
      </div>

      {showScanner && (
        <QRScanner 
          onClose={() => setShowScanner(false)}
          onScanSuccess={handleScanSuccess}
        />
      )}
    </>
  )
}
