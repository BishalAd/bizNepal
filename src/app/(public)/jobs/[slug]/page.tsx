import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JobDetailClient from './JobDetailClient'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('jobs')
    .select('title, description, job_type, location_type, salary_min, salary_max, show_salary, business:businesses(name, logo_url, city), district:districts(name_en), category:categories(name_en)')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Job Not Found | Biznity' }

  const bizName = (data.business as any)?.name
  const district = (data.district as any)?.name_en
  const category = (data.category as any)?.name_en
  const jobType = data.job_type ? data.job_type.replace(/_/g, ' ') : ''
  const locType = data.location_type === 'remote' ? 'Remote' : district || 'Nepal'
  const salarySnippet = data.show_salary && data.salary_min
    ? ` — NPR ${data.salary_min.toLocaleString()}${data.salary_max ? `–${data.salary_max.toLocaleString()}` : '+'}`
    : ''
  const title = `${data.title} at ${bizName || 'Biznity'} | ${jobType ? jobType + ' ' : ''}Job in ${locType}`
  const description = data.description
    ? data.description.substring(0, 157) + (data.description.length > 157 ? '…' : '')
    : `Hiring: ${data.title} at ${bizName || 'Biznity'} in ${locType}, Nepal.${salarySnippet} Apply now on Biznity Job Board.`
  const image = (data.business as any)?.logo_url || 'https://biznity.vercel.app/og-default.png'
  const url = `https://biznity.vercel.app/jobs/${slug}`

  return {
    title,
    description,
    keywords: [
      data.title, bizName, category, district, jobType, 'nepal jobs', 'jobs in nepal', 'nepal hiring',
    ].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Biznity',
      images: [{ url: image, width: 1200, height: 630, alt: `${data.title} — Biznity Jobs` }],
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

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      business:businesses(id, name, slug, logo_url, city, district_id, website, email),
      category:categories(id, name_en),
      district:districts(id, name_en)
    `)
    .eq('slug', slug)
    .single()

  if (error || !job) {
    notFound()
  }

  // Fetch other jobs from the same company
  const { data: companyJobs } = await supabase
    .from('jobs')
    .select('id, slug, title, job_type, location_type, salary_min, salary_max, show_salary, created_at, business:businesses(name, logo_url)')
    .eq('business_id', job.business_id)
    .eq('status', 'active')
    .neq('id', job.id)
    .limit(3)

  // Fetch related jobs by category
  const { data: relatedJobs } = await supabase
    .from('jobs')
    .select('id, slug, title, job_type, location_type, salary_min, salary_max, show_salary, created_at, business:businesses(name, logo_url)')
    .eq('category_id', job.category_id)
    .eq('status', 'active')
    .neq('business_id', job.business_id) // don't repeat company jobs
    .limit(3)

  const canonicalUrl = `https://biznity.vercel.app/jobs/${slug}`
  const bizName = (job.business as any)?.name
  const bizCity = (job.business as any)?.city
  const districtName = job.district?.name_en
  const bizLogo = (job.business as any)?.logo_url

  // Map job_type to schema.org employmentType
  const employmentTypeMap: Record<string, string> = {
    full_time: 'FULL_TIME', part_time: 'PART_TIME', contract: 'CONTRACTOR',
    internship: 'INTERN', freelance: 'OTHER', volunteer: 'VOLUNTEER',
  }

  const jobPostingJsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description ?? undefined,
    identifier: { '@type': 'PropertyValue', name: bizName || 'Biznity', value: job.id },
    datePosted: job.created_at ? new Date(job.created_at).toISOString().split('T')[0] : undefined,
    validThrough: job.expires_at ? new Date(job.expires_at).toISOString().split('T')[0] : undefined,
    employmentType: employmentTypeMap[job.job_type] ?? 'OTHER',
    hiringOrganization: {
      '@type': 'Organization',
      name: bizName || 'Biznity',
      ...(bizLogo ? { logo: bizLogo } : {}),
      sameAs: `https://biznity.vercel.app/businesses/${(job.business as any)?.slug ?? ''}`,
    },
    jobLocation: job.location_type === 'remote'
      ? { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'NP' } }
      : {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: districtName || bizCity || undefined,
            addressCountry: 'NP',
          },
        },
    ...(job.location_type === 'remote' ? { applicantLocationRequirements: { '@type': 'Country', name: 'Nepal' } } : {}),
    ...(job.show_salary && job.salary_min ? {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'NPR',
        value: {
          '@type': 'QuantitativeValue',
          minValue: job.salary_min,
          ...(job.salary_max ? { maxValue: job.salary_max } : {}),
          unitText: 'MONTH',
        },
      },
    } : {}),
    url: canonicalUrl,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://biznity.vercel.app' },
      { '@type': 'ListItem', position: 2, name: 'Jobs', item: 'https://biznity.vercel.app/jobs' },
      { '@type': 'ListItem', position: 3, name: job.title, item: canonicalUrl },
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <JobDetailClient 
        job={{...job, district_name: job.district?.name_en}} 
        companyJobs={companyJobs || []} 
        relatedJobs={relatedJobs || []} 
      />
    </div>
  )
}
