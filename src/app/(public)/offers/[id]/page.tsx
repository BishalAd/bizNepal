import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import OfferDetailClient from './OfferDetailClient'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('offers')
    .select('title, description, banner_url, offer_price, original_price, discount_percent, ends_at, business:businesses(name, city)')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Offer Not Found | Biznity' }

  const bizName = (data.business as any)?.name
  const city = (data.business as any)?.city
  const discount = data.discount_percent ? `${Math.round(data.discount_percent)}% OFF` : ''
  const title = `${discount ? discount + ' — ' : ''}${data.title}${ bizName ? ` | ${bizName}` : '' } | Nepal Deals`
  const priceSnippet = data.offer_price ? `NPR ${data.offer_price}` : ''
  const originalSnippet = data.original_price ? ` (was NPR ${data.original_price})` : ''
  const description = data.description
    ? data.description.substring(0, 157) + (data.description.length > 157 ? '…' : '')
    : `${ discount ? discount + ' on ' : '' }${data.title}${ bizName ? ` from ${bizName}` : '' }${ city ? ` in ${city}` : '' }, Nepal. ${ priceSnippet }${ originalSnippet }. Grab this deal on Biznity!`
  const image = data.banner_url || 'https://biznity.vercel.app/og-default.png'
  const url = `https://biznity.vercel.app/offers/${id}`

  return {
    title,
    description,
    keywords: [
      data.title, bizName, city, discount, 'nepal deals', 'nepal offers', 'nepal discounts', 'biznity deals',
    ].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Biznity',
      images: [{ url: image, width: 1200, height: 630, alt: data.title }],
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

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: offer, error } = await supabase
    .from('offers')
    .select(`
      *,
      business:businesses(id, name, slug, logo_url, address, city, phone, whatsapp, latitude, longitude, khalti_merchant_id, esewa_merchant_id, fonepay_merchant_code),
      product:products(id, name, slug)
    `)
    .eq('id', id)
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

  const canonicalUrl = `https://biznity.vercel.app/offers/${id}`
  const bizName = (offer.business as any)?.name
  const bizSlug = (offer.business as any)?.slug

  const offerJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SpecialAnnouncement',
    name: offer.title,
    text: offer.description ?? undefined,
    datePosted: offer.created_at ? new Date(offer.created_at).toISOString() : new Date().toISOString(),
    expires: offer.ends_at ? new Date(offer.ends_at).toISOString() : undefined,
    url: canonicalUrl,
    ...(offer.banner_url ? { image: offer.banner_url } : {}),
    announcementLocation: { '@type': 'LocalBusiness', name: bizName || 'Biznity' },
  }

  const productOfferJsonLd = offer.offer_price ? {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    name: offer.title,
    description: offer.description ?? undefined,
    priceCurrency: 'NPR',
    price: offer.offer_price,
    ...(offer.original_price ? { priceSpecification: { '@type': 'PriceSpecification', price: offer.original_price, priceCurrency: 'NPR' } } : {}),
    ...(offer.ends_at ? { priceValidUntil: new Date(offer.ends_at).toISOString().split('T')[0] } : {}),
    availability: 'https://schema.org/LimitedAvailability',
    url: canonicalUrl,
    seller: bizName ? { '@type': 'Organization', name: bizName } : undefined,
  } : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://biznity.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Deals & Offers', item: 'https://biznity.vercel.app/offers' },
      ...(bizSlug ? [{ '@type': 'ListItem', position: 3, name: bizName, item: `https://biznity.vercel.app/${bizSlug}` }] : []),
      { '@type': 'ListItem', position: bizSlug ? 4 : 3, name: offer.title, item: canonicalUrl },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(offerJsonLd) }} />
      {productOfferJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productOfferJsonLd) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <OfferDetailClient offer={offer} similarOffers={similarOffers || []} />
    </div>
  )
}
