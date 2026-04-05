import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import OfferFormClient from '../../OfferFormClient'

export const metadata = { title: 'Edit Offer | Dashboard' }

export default async function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name, logo_url').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: offer } = await supabase.from('offers').select('*').eq('id', id).eq('business_id', business.id).single()
  if (!offer) notFound()

  const { data: products } = await supabase.from('products').select('id, name, price, image_keys').eq('business_id', business.id).eq('status', 'active')

  return (
    <div className="animate-in fade-in duration-500">
      <OfferFormClient
        products={products || []}
        business={business}
        offer={offer}
      />
    </div>
  )
}
