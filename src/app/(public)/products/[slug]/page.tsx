import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ProductDetailClient from './ProductDetailClient'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name, description').eq('slug', params.slug).single()
  
  if (!data) return { title: 'Product Not Found | BizNepal' }

  return {
    title: `${data.name} | BizNepal`,
    description: data.description?.substring(0, 160) || `Buy ${data.name} on BizNepal`,
  }
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  // 1. Fetch Product & Business
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      business:businesses(*)
    `)
    .eq('slug', params.slug)
    .single()

  if (error || !product) {
    notFound()
  }

  // 2. Fetch Reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, rating, title, content, owner_reply, created_at,
      user_id,
      profiles:user_id(full_name, avatar_url)
    `)
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })

  // 3. Fetch Related Products (same category, different product)
  const { data: relatedProducts } = await supabase
    .from('products')
    .select(`
      *,
      business:businesses(*)
    `)
    .eq('category_id', product.category_id)
    .neq('id', product.id)
    .eq('status', 'active')
    .eq('businesses.is_active', true)
    .limit(4)

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <ProductDetailClient 
        product={product} 
        reviews={reviews || []} 
        relatedProducts={relatedProducts || []} 
      />
    </div>
  )
}
