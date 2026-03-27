import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Basic role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Strict admin check - Redirect to login if not authorized
  if (profile?.role !== 'admin') {
    redirect('/admin/login')
  }

  // 1. Fetch Platform Stats (using actual counts)
  const [{ count: cBiz }, { count: cUsers }, { count: cProds }, { count: cOrders }] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true })
  ])

  // 2. Fetch Moderation Queues
  const [
    { data: pendingProducts }, 
    { data: pendingJobs }, 
    { data: pendingOffers }
  ] = await Promise.all([
    supabase.from('products').select('*, businesses(name)').eq('is_verified', false).order('created_at', { ascending: false }),
    supabase.from('jobs').select('*, businesses(name)').eq('is_verified', false).order('created_at', { ascending: false }),
    supabase.from('offers').select('*, businesses(name)').eq('is_verified', false).order('created_at', { ascending: false })
  ])

  // 3. Fetch All Businesses (join districts to get name_en)
  const { data: allBusinesses } = await supabase
    .from('businesses')
    .select('*, districts(name_en)')
    .order('created_at', { ascending: false })

  // 4. Fetch All Users
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  // 5. Fetch Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name_en', { ascending: true })

  // 6. Fetch Flagged Reviews
  const { data: flaggedReviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, business:businesses(name)')
    .lte('rating', 2)
    .order('created_at', { ascending: false })
    .limit(10)

  // 7. Mock Growth Data (In a real app, you'd aggregate this from Supabase)
  const chartData = [
    { name: 'Oct', users: Math.floor((cUsers || 0) * 0.4), business: Math.floor((cBiz || 0) * 0.3) },
    { name: 'Nov', users: Math.floor((cUsers || 0) * 0.5), business: Math.floor((cBiz || 0) * 0.5) },
    { name: 'Dec', users: Math.floor((cUsers || 0) * 0.7), business: Math.floor((cBiz || 0) * 0.6) },
    { name: 'Jan', users: Math.floor((cUsers || 0) * 0.8), business: Math.floor((cBiz || 0) * 0.7) },
    { name: 'Feb', users: Math.floor((cUsers || 0) * 0.9), business: Math.floor((cBiz || 0) * 0.8) },
    { name: 'Mar', users: cUsers || 0, business: cBiz || 0 },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
       <AdminClient 
         stats={{
           businesses: cBiz || 0,
           users: cUsers || 0,
           products: cProds || 0,
           orders: cOrders || 0,
           chartData
         }}
         allBusinesses={allBusinesses || []}
         allUsers={allUsers || []}
         categories={categories || []}
         flaggedReviews={flaggedReviews || []}
         moderation={{
           products: pendingProducts || [],
           jobs: pendingJobs || [],
           offers: pendingOffers || []
         }}
       />
    </div>
  )
}
