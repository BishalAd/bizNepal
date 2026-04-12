import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import FavouritesClient from './FavouritesClient'

export const metadata: Metadata = {
  title: 'My Favourites — Saved Products | BizNepal',
  description: 'View and manage your favourite products saved on BizNepal. Buy directly or contact businesses via WhatsApp.',
  robots: { index: false, follow: false },
}

export default async function FavouritesPage() {
  const supabase = await createClient()

  // Server-side auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?callbackUrl=/favourites')

  // Fetch favourites with full product + business payment info
  const { data: favourites } = await supabase
    .from('favourites')
    .select(`
      id,
      created_at,
      product:products(
        id, name, slug, price, discount_price, image_keys, stock_quantity, status,
        business:businesses(id, name, slug, logo_url, whatsapp, khalti_merchant_id, esewa_merchant_id, fonepay_merchant_code)
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Flatten & group by business_id
  type FavItem = {
    favouriteId: string
    product: any
    business: any
  }

  const items: FavItem[] = (favourites ?? []).flatMap(f => {
    const product = f.product as any
    if (!product) return []
    const business = product.business
    return [{ favouriteId: f.id, product, business }]
  })

  // Group by business id
  const grouped = items.reduce<Record<string, { business: any; items: FavItem[] }>>((acc, item) => {
    const bizId = item.business?.id ?? 'unknown'
    if (!acc[bizId]) acc[bizId] = { business: item.business, items: [] }
    acc[bizId].items.push(item)
    return acc
  }, {})

  return (
    <div className="bg-gray-50 min-h-screen">
      <FavouritesClient grouped={grouped} userId={user.id} />
    </div>
  )
}
