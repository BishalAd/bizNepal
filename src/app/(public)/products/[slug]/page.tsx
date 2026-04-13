import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import ProductDetailClient from './ProductDetailClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('name, description, image_keys, price, discount_price, category:categories(name_en), business:businesses(name, city)')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Product Not Found | Biznity' }

  const bizName = (data.business as any)?.name
  const category = (data.category as any)?.name_en
  const city = (data.business as any)?.city
  const price = data.discount_price || data.price
  const title = `${data.name}${ bizName ? ` by ${bizName}` : '' }${ category ? ` — ${category}` : '' } in Nepal`
  const description = data.description
    ? data.description.substring(0, 157) + (data.description.length > 157 ? '…' : '')
    : `Buy ${data.name}${ bizName ? ` from ${bizName}` : '' }${ city ? ` in ${city}` : '' }, Nepal.${ price ? ` Starting at NPR ${price}.` : '' } Shop on Biznity.`
  const imageKeys: string[] = Array.isArray(data.image_keys) ? data.image_keys : []
  const image = imageKeys[0] || 'https://biznity.vercel.app/og-default.png'
  const url = `https://biznity.vercel.app/products/${slug}`

  return {
    title,
    description,
    keywords: [
      data.name, category, bizName, city, 'nepal', 'buy nepal', 'nepal products',
    ].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Biznity',
      images: [{ url: image, width: 1200, height: 630, alt: data.name }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Fetch Product & Business
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      business:businesses(*)
    `)
    .eq('slug', slug)
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

  const canonicalUrl = `https://biznity.vercel.app/products/${slug}`
  const bizName = (product.business as any)?.name
  const bizSlug = (product.business as any)?.slug
  const imageKeys: string[] = Array.isArray(product.image_keys) ? product.image_keys : []
  const firstImage = imageKeys[0] || undefined

  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : product.rating ?? null

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    image: firstImage ?? undefined,
    sku: product.id,
    url: canonicalUrl,
    brand: bizName ? { '@type': 'Brand', name: bizName } : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NPR',
      price: product.discount_price ?? product.price ?? 0,
      ...(product.price && product.discount_price ? { priceValidUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] } : {}),
      availability: product.status === 'active'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
      seller: bizName ? { '@type': 'Organization', name: bizName } : undefined,
    },
    ...(avgRating && reviews && reviews.length > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating,
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    } : {}),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://biznity.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Products', item: 'https://biznity.vercel.app/products' },
      ...(bizSlug ? [{ '@type': 'ListItem', position: 3, name: bizName, item: `https://biznity.vercel.app/businesses/${bizSlug}` }] : []),
      { '@type': 'ListItem', position: bizSlug ? 4 : 3, name: product.name, item: canonicalUrl },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ProductDetailClient 
        product={product} 
        reviews={reviews || []} 
        relatedProducts={relatedProducts || []} 
      />
    </div>
  )
}
