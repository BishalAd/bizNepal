import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import StatsCard from '@/components/dashboard/StatsCard'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import { StatusBadge, PaymentBadge } from '@/components/dashboard/shared/DashboardShared'
import { 
  DollarSign, Package, ShoppingBag, Briefcase, 
  CalendarCheck, Star, PlusCircle, ArrowRight, Send
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export const metadata = { title: 'Dashboard | BizNepal' }

export default async function DashboardOverviewPage() {
  const supabase = await createClient()

  // 1. Get Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Get Business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, telegram_chat_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (bizError) {
    console.error('Error fetching business for dashboard:', bizError)
  }

  if (!business) {
    redirect('/setup-profile')
  }

  // 3. Fetch Stats Data
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayISO = todayStart.toISOString()

  const [
    { data: todayOrders },
    { count: activeListings },
    { data: jobsWithApps },
    { data: todayEvents },
    { count: unreadReviews },
    { data: recentOrders },
    { data: lifetimeOrders }
  ] = await Promise.all([
    // Today's Revenue & Orders
    supabase.from('orders').select('total, created_at').eq('business_id', business.id).gte('created_at', todayISO),
    // Active Listings
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('business_id', business.id).eq('status', 'active'),
    // New Job Applications — fetch jobs with their applications via join
    supabase.from('jobs').select('id, job_applications(id, status)').eq('business_id', business.id),
    // Today's Bookings
    supabase.from('events').select('id, event_bookings(id, created_at)').eq('business_id', business.id),
    // Total Reviews
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    // Recent Orders Table
    supabase.from('orders').select('id, customer_name, total, payment_method, order_status, created_at, items').eq('business_id', business.id).order('created_at', { ascending: false }).limit(5),
    // Lifetime Revenue
    supabase.from('orders').select('total').eq('business_id', business.id)
  ])

  // Process manual counts
  const todaysRevenue = todayOrders?.reduce((acc, curr) => acc + Number(curr.total || 0), 0) || 0
  const todaysOrdersCount = todayOrders?.length || 0
  const lifetimeRevenue = lifetimeOrders?.reduce((acc, curr) => acc + Number(curr.total || 0), 0) || 0

  // Count new (unread) job applications via the jobs join
  let unreadJobs = 0
  jobsWithApps?.forEach((job: any) => {
    job.job_applications?.forEach((app: any) => {
      if (app.status === 'new') unreadJobs++
    })
  })
  
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
      
      {/* Telegram Prompt Banner — shown when not yet connected */}
      {!business.telegram_chat_id && (
        <a
          href="/dashboard/notification-settings"
          className="flex items-center gap-4 bg-gradient-to-r from-[#0088cc]/10 to-[#0088cc]/5 border border-[#0088cc]/20 rounded-2xl p-4 hover:bg-[#0088cc]/15 transition-all group"
        >
          <div className="w-10 h-10 bg-[#0088cc]/15 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition">
            <Send className="w-5 h-5 text-[#0077b5]" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[#006699] text-sm">Connect Telegram for instant alerts</p>
            <p className="text-xs text-[#0077b5]/80 font-medium">Get notified the moment a new order, application, or review arrives.</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[#0077b5] shrink-0 group-hover:translate-x-1 transition" />
        </a>
      )}
      {/* Header */}
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
          Welcome back, <span className="text-blue-600">{business.name}</span>
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Monitoring your business performance for today.</p>
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
              color="green" trend="up" trendValue="Live"
            />
            <StatsCard 
              title="Active Inventory" 
              value={activeListings || 0} 
              icon={<Package className="w-6 h-6" />}
              color="blue" trend="neutral" trendValue="Products"
            />
            <StatsCard 
              title="New Orders" 
              value={todaysOrdersCount} 
              icon={<ShoppingBag className="w-6 h-6" />}
              color="purple" trend="up" trendValue="Today"
            />
            <StatsCard 
              title="Unread Apps" 
              value={unreadJobs || 0} 
              icon={<Briefcase className="w-6 h-6" />}
              color="orange" trend="neutral" trendValue="Jobs"
            />
            <StatsCard 
              title="Today's Bookings" 
              value={todaysBookingsCount} 
              icon={<CalendarCheck className="w-6 h-6" />}
              color="red" trend="up" trendValue="Events"
            />
            <StatsCard 
              title="Total Reviews" 
              value={unreadReviews || 0} 
              icon={<Star className="w-6 h-6 text-yellow-500" />}
              color="gray"
            />
          </div>

          {/* QUICK ACTIONS */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/dashboard/products/new" className="bg-white border text-center border-gray-100 hover:border-blue-200 hover:shadow-md p-4 rounded-2xl transition group">
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
