import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

// Production URL — set NEXT_PUBLIC_APP_URL in Vercel env vars
const BASE_URL = 'https://biznity.vercel.app'

// NOTE: When entity counts exceed 1000, implement paginated sitemaps:
// export async function generateSitemaps() { return [{ id: 0 }, { id: 1 }] }
// Then create app/sitemap/[id]/route.ts fetching PAGE_SIZE rows with .range()
const LIMIT = 1000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(supabaseUrl, supabaseKey)

  const [
    { data: businesses },
    { data: products },
    { data: jobs },
    { data: events },
    { data: offers },
  ] = await Promise.all([
    supabase.from('businesses').select('slug, updated_at').eq('is_active', true).limit(LIMIT),
    supabase.from('products').select('slug, updated_at').eq('status', 'active').limit(LIMIT),
    supabase.from('jobs').select('slug, updated_at').eq('status', 'active').limit(LIMIT),
    supabase.from('events').select('slug, updated_at').eq('status', 'upcoming').limit(LIMIT),
    supabase.from('offers').select('id, updated_at').eq('status', 'active').limit(LIMIT),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,              lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
    { url: `${BASE_URL}/businesses`, lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/products`,   lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
    { url: `${BASE_URL}/jobs`,        lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE_URL}/events`,      lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE_URL}/offers`,      lastModified: new Date(), changeFrequency: 'daily',  priority: 0.8 },
    { url: `${BASE_URL}/privacy`,     lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`,       lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...(businesses ?? []).map(b => ({
      url: `${BASE_URL}/businesses/${b.slug}`,
      lastModified: new Date(b.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...(products ?? []).filter(p => p.slug).map(p => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: new Date(p.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...(jobs ?? []).filter(j => j.slug).map(j => ({
      url: `${BASE_URL}/jobs/${j.slug}`,
      lastModified: new Date(j.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...(events ?? []).filter(e => e.slug).map(e => ({
      url: `${BASE_URL}/events/${e.slug}`,
      lastModified: new Date(e.updated_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...(offers ?? []).map(o => ({
      url: `${BASE_URL}/offers/${o.id}`,
      lastModified: new Date(o.updated_at || new Date()),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  ]

  return [...staticRoutes, ...dynamicRoutes]
}

