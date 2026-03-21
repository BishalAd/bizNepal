'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCircle2, Package, Briefcase, CalendarDays, MessageSquareQuote, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function NotificationBell({ userId }: { userId: string }) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    
    // Initial fetch
    supabase.from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setNotifications(data) })

    // Realtime subscription
    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
         setNotifications(prev => [payload.new, ...prev].slice(0, 10))
         audioRef.current?.play().catch(()=>{})
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
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

  const getUrl = (n: any) => {
    switch (n.type) {
      case 'ORDER': return `/dashboard/orders`
      case 'APPLICATION': return `/dashboard/applications`
      case 'REVIEW': return `/dashboard/reviews`
      case 'BOOKING': return `/dashboard/events`
      default: return '#'
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`relative p-2 rounded-full transition ${isOpen ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 ring-2 ring-white animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl shadow-red-900/10 border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
           <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <h3 className="font-extrabold text-gray-900">Notifications</h3>
             {unreadCount > 0 && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{unreadCount} New</span>}
           </div>
           
           <div className="max-h-96 overflow-y-auto w-full">
             {notifications.length === 0 ? (
               <div className="p-8 text-center text-sm font-bold text-gray-400 flex flex-col items-center">
                 <Bell className="w-8 h-8 text-gray-200 mb-2"/>
                 You're all caught up!
               </div>
             ) : (
               <div className="divide-y divide-gray-50">
                 {notifications.map(n => (
                   <Link 
                     key={n.id} 
                     href={getUrl(n)} 
                     onClick={() => { setIsOpen(false); markAsRead(n.id); }}
                     className={`p-4 flex gap-3 hover:bg-gray-50 transition ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                   >
                      <div className="shrink-0 pt-1">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        <p className={`text-sm tracking-tight ${!n.is_read ? 'font-extrabold text-gray-900' : 'font-semibold text-gray-700'}`}>{n.title}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">{formatDistanceToNow(new Date(n.created_at))} ago</p>
                      </div>
                      {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></div>}
                   </Link>
                 ))}
               </div>
             )}
           </div>
           
           <div className="p-2 border-t border-gray-100 bg-gray-50/50">
             <Link href="/dashboard/notifications" onClick={()=>setIsOpen(false)} className="block w-full text-center text-sm font-bold text-gray-600 hover:text-red-600 transition py-2 rounded-xl hover:bg-white">
               View All Activity
             </Link>
           </div>
        </div>
      )}
    </div>
  )
}
