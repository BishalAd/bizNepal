import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Tag, Clock, TrendingUp, CheckCircle2, AlertCircle, Edit, Trash2 } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import OffersClient from './OffersClient'

export const metadata = { title: 'Offers Management | Dashboard' }

export default async function OffersDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  // Fetch Offers
  const { data: offers } = await supabase.from('offers').select(`
    id, title, original_price, offer_price, discount_percent, starts_at, ends_at, 
    max_quantity, grabbed_count, status, banner_url, created_at
  `).eq('business_id', business.id).order('created_at', { ascending: false })

  return (
    <div className="animate-in fade-in duration-500">
      <OffersClient initialOffers={offers || []} />
    </div>
  )
}
