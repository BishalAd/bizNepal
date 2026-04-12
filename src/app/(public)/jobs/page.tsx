import { createClient } from '@/lib/supabase/server'
import JobsClientListing from './JobsClientListing'
import { Metadata } from 'next'

type SearchParams = Promise<{ category?: string; district?: string; type?: string }>

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { category: cat, district: dist, type: jobType } = await searchParams
  const isFiltered = !!(cat || dist || jobType)

  let title = 'Jobs in Nepal — Find Your Dream Job | BizNepal'
  let description = 'Browse verified job listings in Nepal. Find full-time, part-time, remote, and internship opportunities across all industries on BizNepal.'

  if (isFiltered) {
    const supabase = await createClient()
    const [catRes, distRes] = await Promise.all([
      cat ? supabase.from('categories').select('name_en').eq('id', cat).single() : Promise.resolve({ data: null }),
      dist ? supabase.from('districts').select('name_en').eq('id', dist).single() : Promise.resolve({ data: null }),
    ])
    const catName = (catRes.data as any)?.name_en
    const distName = (distRes.data as any)?.name_en
    const typeName = jobType ? jobType.replace(/_/g, ' ') : ''

    const parts: string[] = []
    if (catName) parts.push(catName)
    if (typeName) parts.push(typeName)
    parts.push('Jobs')
    if (distName) parts.push(`in ${distName}`)
    parts.push('Nepal')
    title = `${parts.join(' ')} | BizNepal`
    description = `Find ${ catName ?? 'all' }${ typeName ? ' ' + typeName : '' } jobs${ distName ? ` in ${distName}` : ' across Nepal' }. Apply today on BizNepal.`
  }

  const url = 'https://biz-nepal.vercel.app/jobs'
  return {
    title,
    description,
    keywords: ['nepal jobs', 'jobs in nepal', 'nepal hiring', 'kathmandu jobs', 'remote jobs nepal', 'biznepal jobs'],
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'BizNepal', type: 'website' },
    twitter: { card: 'summary', title, description },
  }
}

export default async function JobsPage() {
  const supabase = await createClient()

  // Parallel fetch for filters
  const [
    { data: categories },
    { data: districts }
  ] = await Promise.all([
    supabase.from('categories').select('id, name_en').eq('type', 'job'),
    supabase.from('districts').select('id, name_en').order('name_en')
  ])

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://biz-nepal.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Jobs in Nepal', item: 'https://biz-nepal.vercel.app/jobs' },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <JobsClientListing 
        categories={categories || []} 
        districts={districts || []} 
      />
    </div>
  )
}
