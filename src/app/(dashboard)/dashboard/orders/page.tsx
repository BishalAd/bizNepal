import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrdersClient from './OrdersClient'

export const metadata = { title: 'Orders Inbox | Dashboard' }

export default async function OrdersDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  // Fetch Orders
  const { data: orders } = await supabase.from('orders').select(`
    id, customer_name, customer_email, customer_phone, customer_address, 
    total, payment_method, payment_status, order_status, notes, items, created_at
  `).eq('business_id', business.id).order('created_at', { ascending: false })

  return (
    <div className="animate-in fade-in duration-500">
      <OrdersClient initialOrders={orders || []} business={business} />
    </div>
  )
}
