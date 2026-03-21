import { createClient } from '@/lib/supabase/server'
import OffersClient from './OffersClient'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Deals & Offers | BizNepal',
  description: 'Find the best deals, discounts, and exclusive offers across Nepal.',
}

export const revalidate = 60 // revalidate every minute for offers

export default async function OffersPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const supabase = await createClient()

  // Fetch initial active offers with business details
  // In a real app we'd paginate this on the server or client. We'll pass initial data to Client component.
  const { data: offers } = await supabase
    .from('offers')
    .select('*, business:businesses(*)')
    .eq('status', 'active')
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })

  // Fetch categories that have type='product' or 'service' (since offers apply to these)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_en')
    .in('type', ['product', 'service'])

  return (
    <div className="bg-gray-50 min-h-screen">
      <OffersClient 
        initialOffers={offers || []} 
        categories={categories || []}
        searchParams={searchParams}
      />
    </div>
  )
}
