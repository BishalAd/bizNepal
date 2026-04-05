'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ShoppingBag, Briefcase, CalendarCheck, Star, Activity } from 'lucide-react'
import Link from 'next/link'

interface ActivityItem {
  id: string
  type: 'order' | 'job_application' | 'event_booking' | 'review'
  title: string
  description: string
  amount?: number
  created_at: string
}

export default function ActivityFeed({ businessId }: { businessId: string }) {
  const supabase = createClient()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial activity data
  const fetchInitialData = async () => {
    try {
      const [
        { data: orders },
        { data: jobs },
        { data: events },
        { data: reviews }
      ] = await Promise.all([
        supabase.from('orders').select('id, customer_name, total, created_at, items').eq('business_id', businessId).order('created_at', { ascending: false }).limit(5),
        supabase.from('job_applications').select('id, applicant_name, created_at, job:jobs!inner(title, business_id)').eq('job.business_id', businessId).order('created_at', { ascending: false }).limit(5),
        supabase.from('event_bookings').select('id, attendee_name, total_amount, created_at, event:events!inner(title, business_id)').eq('event.business_id', businessId).order('created_at', { ascending: false }).limit(5),
        supabase.from('reviews').select('id, rating, created_at, user:profiles(full_name)').eq('business_id', businessId).order('created_at', { ascending: false }).limit(5)
      ])

      const combined: ActivityItem[] = []

      // Map Orders
      orders?.forEach((o: any) => combined.push({
        id: o.id,
        type: 'order',
        title: `New order from ${o.customer_name}`,
        description: `Purchased ${o.items?.[0]?.title || 'products'}`,
        amount: o.total,
        created_at: o.created_at
      }))

      // Map Jobs
      jobs?.forEach((j: any) => combined.push({
        id: j.id,
        type: 'job_application',
        title: `New application from ${j.applicant_name}`,
        description: `Applied for ${(j.job as any)?.title || 'Job'}`,
        created_at: j.created_at
      }))

      // Map Events
      events?.forEach((e: any) => combined.push({
        id: e.id,
        type: 'event_booking',
        title: `New booking from ${e.attendee_name}`,
        description: `Booked ${(e.event as any)?.title || 'Event'}`,
        amount: e.total_amount,
        created_at: e.created_at
      }))

      // Map Reviews
      reviews?.forEach((r: any) => combined.push({
        id: r.id,
        type: 'review',
        title: `New ${r.rating}-star review`,
        description: `From ${(r.user as any)?.full_name || 'Customer'}`,
        created_at: r.created_at
      }))

      // Sort combined array by date descending
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setActivities(combined.slice(0, 10)) // Keep top 10

    } catch (err) {
      console.error('Error fetching initial activity:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!businessId) return
    fetchInitialData()

    // Subscribe to realtime updates for this business
    const ordersSub = supabase.channel('dashboard-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` }, (payload: any) => {
        const o = payload.new
        setActivities(prev => [{
          id: o.id, type: 'order', title: `New order from ${o.customer_name || 'Customer'}`, description: `New purchase`, amount: o.total, created_at: o.created_at
        } as ActivityItem, ...prev].slice(0, 10))
      }).subscribe()

    const jobsSub = supabase.channel('dashboard-jobs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_applications' }, (payload: any) => {
        const j = payload.new
        setActivities(prev => [{
          id: j.id, type: 'job_application', title: `New application from ${j.applicant_name}`, description: `New job application`, created_at: j.created_at
        } as ActivityItem, ...prev].slice(0, 10))
      }).subscribe()

    const reviewsSub = supabase.channel('dashboard-reviews')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: `business_id=eq.${businessId}` }, (payload: any) => {
        const r = payload.new
        setActivities(prev => [{
          id: r.id, type: 'review', title: `New ${r.rating}-star review`, description: `Customer review added`, created_at: r.created_at
        } as ActivityItem, ...prev].slice(0, 10))
      }).subscribe()

    return () => {
      supabase.removeChannel(ordersSub)
      supabase.removeChannel(jobsSub)
      supabase.removeChannel(reviewsSub)
    }
  }, [businessId, supabase])

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-5 h-5 text-blue-600" />
      case 'job_application': return <Briefcase className="w-5 h-5 text-purple-600" />
      case 'event_booking': return <CalendarCheck className="w-5 h-5 text-orange-600" />
      case 'review': return <Star className="w-5 h-5 text-yellow-600" />
      default: return <Activity className="w-5 h-5 text-gray-600" />
    }
  }

  const getBg = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 border-blue-200'
      case 'job_application': return 'bg-purple-100 border-purple-200'
      case 'event_booking': return 'bg-orange-100 border-orange-200'
      case 'review': return 'bg-yellow-100 border-yellow-200'
      default: return 'bg-gray-100 border-gray-200'
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading activity feed...</div>
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
         <h3 className="font-bold text-gray-900 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600"/> Real-time Activity</h3>
         <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 px-2 py-1 bg-green-50 rounded-lg">
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Live
         </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {activities.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 px-6 text-center">
             <Activity className="w-10 h-10 mb-2 opacity-50" />
             <p className="text-sm">No recent activity detected.</p>
           </div>
        ) : (
          <ul className="divide-y divide-gray-50 px-2 pb-2">
            {activities.map((item, idx) => {
              const href = 
                item.type === 'order' ? `/dashboard/orders` :
                item.type === 'job_application' ? `/dashboard/applications` :
                item.type === 'event_booking' ? `/dashboard/events` :
                item.type === 'review' ? `/dashboard/reviews` : '/dashboard'

              return (
                <li key={item.id + idx}>
                  <Link href={href} className="p-4 hover:bg-gray-50 transition rounded-2xl flex items-start gap-4 group">
                    <div className={`p-2.5 rounded-xl border flex-shrink-0 transition group-hover:scale-110 ${getBg(item.type)}`}>
                      {getIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-gray-900 truncate pr-4 group-hover:text-blue-600 transition">{item.title}</p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatDistanceToNow(new Date(item.created_at))} ago</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 truncate mr-2">{item.description}</span>
                        {item.amount !== undefined && (
                          <span className="font-extrabold text-blue-600 flex-shrink-0">₨ {item.amount.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
