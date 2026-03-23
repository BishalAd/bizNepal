import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import ProductFormClient from '../../ProductFormClient'

export const metadata = { title: 'Edit Product | Dashboard' }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const [
    { data: categories },
    { data: product }
  ] = await Promise.all([
    supabase.from('categories').select('id, name_en').eq('type', 'product').order('name_en'),
    supabase.from('products').select('*').eq('id', id).eq('business_id', business.id).single()
  ])

  if (!product) notFound()

  return (
    <div className="animate-in fade-in duration-500">
      <ProductFormClient 
        initialData={product}
        categories={categories || []} 
        businessId={business.id}
      />
    </div>
  )
}
