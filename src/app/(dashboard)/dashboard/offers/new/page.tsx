import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OfferFormClient from '../OfferFormClient'

export const metadata = { title: 'Create Offer | Dashboard' }

export default async function NewOfferPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name, logo_url').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: products } = await supabase.from('products').select('id, name, price, image_keys').eq('business_id', business.id).eq('status', 'active')

  return (
    <div className="animate-in fade-in duration-500">
      <OfferFormClient 
        products={products || []} 
        business={business}
      />
    </div>
  )
}
