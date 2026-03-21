import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OfferDetailClient from './OfferDetailClient'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('offers').select('title, description').eq('id', params.id).single()
  
  if (!data) return { title: 'Offer Not Found | BizNepal' }

  return {
    title: `${data.title} | BizNepal Deals`,
    description: data.description?.substring(0, 160) || `Check out this amazing offer on BizNepal.`,
  }
}

export default async function OfferDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: offer, error } = await supabase
    .from('offers')
    .select(`
      *,
      business:businesses(*),
      product:products(id, name, slug)
    `)
    .eq('id', params.id)
    .single()

  if (error || !offer) {
    notFound()
  }

  // Fetch similar offers by same business
  const { data: similarOffers } = await supabase
    .from('offers')
    .select('id, title, banner_url, offer_price, original_price, discount_percent, ends_at, grabbed_count, max_quantity, business:businesses(name)')
    .eq('business_id', offer.business_id)
    .eq('status', 'active')
    .neq('id', offer.id)
    .limit(3)

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <OfferDetailClient offer={offer} similarOffers={similarOffers || []} />
    </div>
  )
}
