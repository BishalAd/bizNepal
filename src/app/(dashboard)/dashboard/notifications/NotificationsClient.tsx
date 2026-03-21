'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import { 
  Bell, Package, Briefcase, CalendarDays, MessageSquareQuote, 
  AlertTriangle, CheckCircle2, Filter, Settings
} from 'lucide-react'
import Link from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

export default function NotificationsClient({ initialSet, userId }: any) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState(initialSet)
  const [activeFilter, setActiveFilter] = useState('ALL')

  const displayNotifs = activeFilter === 'ALL' ? notifications : notifications.filter((n:any) => n.type === activeFilter)

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n:any) => !n.is_read).map((n:any) => n.id)
    if (unreadIds.length === 0) return toast.success('All caught up!')
    
    setNotifications((prev: any[]) => prev.map((n:any) => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
    toast.success('All marked as read')
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <Package className="w-5 h-5 text-blue-500"/>
      case 'APPLICATION': return <Briefcase className="w-5 h-5 text-purple-500"/>
      case 'BOOKING': return <CalendarDays className="w-5 h-5 text-orange-500"/>
      case 'REVIEW': return <MessageSquareQuote className="w-5 h-5 text-yellow-500"/>
      default: return <AlertTriangle className="w-5 h-5 text-gray-500"/>
    }
  }

  const getUrl = (type: string) => {
    switch (type) {
      case 'ORDER': return `/dashboard/orders`
      case 'APPLICATION': return `/dashboard/applications`
      case 'REVIEW': return `/dashboard/reviews`
      case 'BOOKING': return `/dashboard/events`
      default: return '#'
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-20 max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notification History</h1>
            <p className="text-gray-500 mt-1 flex items-center gap-2">Keep track of all account activities.</p>
          </div>
          <div className="flex gap-3">
             <Link href="/dashboard/notification-settings" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm">
                <Settings className="w-4 h-4 mr-2" /> Settings
             </Link>
             <button onClick={handleMarkAllRead} className="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark All as Read
             </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] flex flex-col md:flex-row">
           
           {/* Sidebar Filters */}
           <div className="w-full md:w-64 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 p-6 shrink-0">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Filter className="w-3.5 h-3.5"/> Filter Traffic</h3>
             <div className="flex flex-col gap-2">
                {[
                  { id: 'ALL', label: 'All Notifications', icon: <Bell className="w-4 h-4"/> },
                  { id: 'ORDER', label: 'Orders & Sales', icon: <Package className="w-4 h-4"/> },
                  { id: 'APPLICATION', label: 'Job Applicants', icon: <Briefcase className="w-4 h-4"/> },
                  { id: 'BOOKING', label: 'Event Bookings', icon: <CalendarDays className="w-4 h-4"/> },
                  { id: 'REVIEW', label: 'Customer Reviews', icon: <MessageSquareQuote className="w-4 h-4"/> },
                ].map(f => (
                  <button 
                    key={f.id} onClick={()=>setActiveFilter(f.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition text-sm ${activeFilter === f.id ? 'bg-white shadow-sm border border-gray-200 text-red-600' : 'text-gray-600 hover:bg-gray-100 border border-transparent'}`}
                  >
                    {f.icon} {f.label}
                  </button>
                ))}
             </div>
           </div>

           {/* Feeds */}
           <div className="flex-1 p-0 sm:p-4">
              {displayNotifs.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center py-24 text-gray-400">
                    <Bell className="w-12 h-12 text-gray-200 mb-4" />
                    <p className="font-bold text-lg text-gray-500">Inbox Zero</p>
                    <p className="text-sm">No activity found under this category.</p>
                 </div>
              ) : (
                 <div className="divide-y divide-gray-50">
                   {displayNotifs.map((n:any) => (
                      <Link 
                        href={getUrl(n.type)} 
                        key={n.id} 
                        className={`flex gap-5 p-4 sm:p-5 rounded-2xl transition hover:bg-gray-50 group border border-transparent hover:border-gray-100 ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                      >
                         <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                            {getIcon(n.type)}
                         </div>
                         <div className="flex-1">
                            <h4 className={`text-base tracking-tight mb-1 ${!n.is_read ? 'font-black text-gray-900' : 'font-bold text-gray-800'}`}>{n.title}</h4>
                            <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-2xl">{n.message}</p>
                            <div className="flex items-center gap-4 mt-3">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDistanceToNow(new Date(n.created_at))} ago</span>
                              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">•</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{format(new Date(n.created_at), 'PPP')}</span>
                            </div>
                         </div>
                         {n.is_read ? (
                            <CheckCircle2 className="w-5 h-5 text-gray-200 shrink-0" />
                         ) : (
                            <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
                         )}
                      </Link>
                   ))}
                 </div>
              )}
           </div>

        </div>
      </div>
    </>
  )
}
