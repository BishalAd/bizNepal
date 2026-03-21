import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Basic role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  // Strict admin check (uncomment if needed)
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // 1. Fetch Platform Stats (using actual counts)
  const [{ count: cBiz }, { count: cUsers }, { count: cProds }, { count: cOrders }] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true })
  ])

  // 2. Fetch All Businesses (join districts to get name_en)
  const { data: allBusinesses } = await supabase
    .from('businesses')
    .select('id, name, district_id, phone, is_verified, is_featured, created_at, districts(name_en)')
    .order('created_at', { ascending: false })

  // 3. Fetch All Users (Profiles table now has email synced)
  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, avatar_url, created_at, is_banned')
    .order('created_at', { ascending: false })

  // 4. Fetch Categories (for management)
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name_en', { ascending: true })

  // 5. Fetch Flagged Reviews
  const { data: flaggedReviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, business:businesses(name)')
    .lte('rating', 2)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="bg-gray-50 min-h-screen">
       <AdminClient 
         stats={{
           businesses: cBiz || 0,
           users: cUsers || 0,
           products: cProds || 0,
           orders: cOrders || 0
         }}
         allBusinesses={allBusinesses || []}
         allUsers={allUsers || []}
         categories={categories || []}
         flaggedReviews={flaggedReviews || []}
       />
    </div>
  )
}
