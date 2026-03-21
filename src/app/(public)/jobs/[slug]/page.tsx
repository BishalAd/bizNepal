import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import JobDetailClient from './JobDetailClient'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createClient()
  const { data } = await supabase.from('jobs').select('title, business:businesses(name)').eq('slug', params.slug).single()
  
  if (!data) return { title: 'Job Not Found | BizNepal' }

  const bizName = Array.isArray(data.business) ? data.business[0]?.name : (data.business as any)?.name

  return {
    title: `${data.title} at ${bizName || 'BizNepal'} | BizNepal Jobs`,
    description: `Apply for ${data.title} at ${bizName || 'BizNepal'} on BizNepal Job Board.`,
  }
}

export default async function JobDetailPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: job, error } = await supabase
    .from('jobs')
    .select(`
      *,
      business:businesses(id, name, slug, logo_url, city, district_id, website),
      category:categories(id, name_en),
      district:districts(id, name_en)
    `)
    .eq('slug', params.slug)
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

  return (
    <div className="bg-gray-50 min-h-screen pb-20 md:pb-8">
      <JobDetailClient 
        job={{...job, district_name: job.district?.name_en}} 
        companyJobs={companyJobs || []} 
        relatedJobs={relatedJobs || []} 
      />
    </div>
  )
}
