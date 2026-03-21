import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StatsCard from '@/components/dashboard/StatsCard'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import { 
  DollarSign, Package, ShoppingBag, Briefcase, 
  CalendarCheck, Star, PlusCircle, ArrowRight
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata = { title: 'Dashboard | BizNepal' }

export default async function DashboardOverviewPage() {
  const supabase = await createClient()

  // 1. Get Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Get Business
  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  // 3. Fetch Stats Data
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  const [
    { data: todayOrders },
    { count: activeListings },
    { count: unreadJobs },
    { data: todayEvents },
    { count: unreadReviews },
    { data: recentOrders }
  ] = await Promise.all([
    // Today's Revenue & Orders
    supabase.from('orders').select('total, created_at').eq('business_id', business.id).gte('created_at', todayISO),
    // Active Listings
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'active'),
    // Unread Jobs
    supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'new'),
    // Today's Bookings
    // Note: Bookings link to event_id, wait, let's just get count where created_at >= today by fetching events for this business first
    supabase.from('events').select('id, event_bookings(id, created_at)').eq('business_id', business.id),
    // Unread Reviews
    // Assume reviews without reply are 'unread'. We'll just count all for this demo or where reply is null if that column existed.
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    // Recent Orders Table
    supabase.from('orders').select('id, customer_name, total, payment_method, order_status, created_at, items').eq('business_id', business.id).order('created_at', { ascending: false }).limit(5)
  ])

  // Process manual counts
  const todaysRevenue = todayOrders?.reduce((acc, curr) => acc + Number(curr.total || 0), 0) || 0
  const todaysOrdersCount = todayOrders?.length || 0
  
  // Calculate today's event bookings
  let todaysBookingsCount = 0
  todayEvents?.forEach((ev: any) => {
    ev.event_bookings?.forEach((b: any) => {
      if (new Date(b.created_at) >= todayStart) {
        todaysBookingsCount++
      }
    })
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, {business.name}</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your business today.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column (Stats + Table) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* STATS ROW */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatsCard 
              title="Today's Revenue" 
              value={`₨ ${todaysRevenue.toLocaleString()}`} 
              icon={<DollarSign className="w-6 h-6" />}
              color="green" trend="up" trendValue="12%"
            />
            <StatsCard 
              title="Active Listings" 
              value={activeListings || 0} 
              icon={<Package className="w-6 h-6" />}
              color="blue" trend="up" trendValue="2"
            />
            <StatsCard 
              title="New Orders" 
              value={todaysOrdersCount} 
              icon={<ShoppingBag className="w-6 h-6" />}
              color="purple" trend="up" trendValue="5%"
            />
            <StatsCard 
              title="Unread Job Apps" 
              value={unreadJobs || 0} 
              icon={<Briefcase className="w-6 h-6" />}
              color="orange" trend="neutral" trendValue="0"
            />
            <StatsCard 
              title="Today's Bookings" 
              value={todaysBookingsCount} 
              icon={<CalendarCheck className="w-6 h-6" />}
              color="red" trend="up" trendValue="10%"
            />
            <StatsCard 
              title="New Reviews" 
              value={unreadReviews || 0} 
              icon={<Star className="w-6 h-6 text-yellow-500" />}
              color="gray"
            />
          </div>

          {/* QUICK ACTIONS */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/dashboard/listings/new" className="bg-white border text-center border-gray-100 hover:border-blue-200 hover:shadow-md p-4 rounded-2xl transition group">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition"><PlusCircle className="w-5 h-5"/></div>
                <span className="font-semibold text-gray-700 text-sm">Add Product</span>
              </Link>
              <Link href="/dashboard/offers/new" className="bg-white border text-center border-gray-100 hover:border-red-200 hover:shadow-md p-4 rounded-2xl transition group">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition"><PlusCircle className="w-5 h-5"/></div>
                <span className="font-semibold text-gray-700 text-sm">Create Offer</span>
              </Link>
              <Link href="/dashboard/jobs/new" className="bg-white border text-center border-gray-100 hover:border-purple-200 hover:shadow-md p-4 rounded-2xl transition group">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition"><PlusCircle className="w-5 h-5"/></div>
                <span className="font-semibold text-gray-700 text-sm">Post Job</span>
              </Link>
              <Link href="/dashboard/events/new" className="bg-white border text-center border-gray-100 hover:border-orange-200 hover:shadow-md p-4 rounded-2xl transition group">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition"><PlusCircle className="w-5 h-5"/></div>
                <span className="font-semibold text-gray-700 text-sm">Create Event</span>
              </Link>
            </div>
          </div>

          {/* RECENT ORDERS TABLE */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center">
               <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
               <Link href="/dashboard/orders" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">View All <ArrowRight className="w-4 h-4"/></Link>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-600 truncate whitespace-nowrap">
                 <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500">
                   <tr>
                     <th className="px-6 py-4">Customer</th>
                     <th className="px-6 py-4">Product/Item</th>
                     <th className="px-6 py-4">Amount</th>
                     <th className="px-6 py-4">Payment</th>
                     <th className="px-6 py-4">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {recentOrders?.length === 0 ? (
                     <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No recent orders.</td></tr>
                   ) : (
                     recentOrders?.map(order => (
                       <tr key={order.id} className="hover:bg-gray-50 transition">
                         <td className="px-6 py-4 font-bold text-gray-900">{order.customer_name}</td>
                         <td className="px-6 py-4">{order.items?.[0]?.title || 'Package (Various)'}</td>
                         <td className="px-6 py-4 font-extrabold text-gray-900">₨ {order.total?.toLocaleString()}</td>
                         <td className="px-6 py-4">
                           <span className="uppercase text-xs font-bold tracking-wider">{order.payment_method}</span>
                         </td>
                         <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                             order.order_status === 'pending' ? 'bg-yellow-50 text-yellow-700' :
                             order.order_status === 'completed' ? 'bg-green-50 text-green-700' :
                             'bg-gray-100 text-gray-700'
                           }`}>
                             {order.order_status}
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

        {/* Right Column (Activity Feed) */}
        <div className="lg:col-span-1 h-[600px] lg:h-auto">
           <ActivityFeed businessId={business.id} />
        </div>

      </div>
    </div>
  )
}
