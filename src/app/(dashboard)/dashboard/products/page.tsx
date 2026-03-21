import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProductsClient from './ProductsClient'

export const metadata = { title: 'Products Management | Dashboard' }

export default async function ProductsDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const [
    { data: ptCategories },
    { data: products }
  ] = await Promise.all([
    supabase.from('categories').select('id, name_en').eq('type', 'product').order('name_en'),
    supabase.from('products').select(`
      id, name, slug, price, discount_price, stock_quantity, status, rating, review_count, view_count, created_at, image_keys,
      category:categories(name_en)
    `).eq('business_id', business.id).order('created_at', { ascending: false })
  ])

  return (
    <div className="animate-in fade-in duration-500">
      <ProductsClient 
        initialProducts={products || []} 
        categories={ptCategories || []} 
        businessId={business.id}
      />
    </div>
  )
}
