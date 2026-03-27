import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(supabaseUrl, supabaseKey)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://biznepal.com'

  const [{ data: businesses }, { data: products }, { data: jobs }, { data: events }] = await Promise.all([
    supabase.from('businesses').select('slug, updated_at').eq('is_verified', true).limit(500),
    supabase.from('products').select('id, updated_at').limit(500),
    supabase.from('jobs').select('id, updated_at').limit(500),
    supabase.from('events').select('slug, updated_at').limit(500)
  ])

  const sitemapData: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/businesses`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/jobs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/offers`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ]

  businesses?.forEach(biz => {
    sitemapData.push({
      url: `${baseUrl}/businesses/${biz.slug}`,
      lastModified: new Date(biz.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.7
    })
  })

  products?.forEach(item => {
    sitemapData.push({
      url: `${baseUrl}/products/${item.id}`,
      lastModified: new Date(item.updated_at || new Date()),
      changeFrequency: 'weekly',
      priority: 0.6
    })
  })

  // Append up to limit...
  // In a real huge app, we'd use pagination routes for sitemap generation
  
  return sitemapData
}
