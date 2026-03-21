import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductFormClient from '../ProductFormClient'

export const metadata = { title: 'Add Product | Dashboard' }

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: categories } = await supabase.from('categories').select('id, name_en').eq('type', 'product').order('name_en')

  return (
    <div className="animate-in fade-in duration-500">
      <ProductFormClient 
        categories={categories || []} 
        businessId={business.id}
      />
    </div>
  )
}
