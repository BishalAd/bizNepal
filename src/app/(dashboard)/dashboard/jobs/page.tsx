import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobsClient from './JobsClient'

export const metadata = { title: 'Jobs Management | Dashboard' }

export default async function JobsDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: jobs } = await supabase.from('jobs').select(`
    id, title, job_type, location_type, district, deadline, 
    status, created_at,
    job_applications(id, status)
  `).eq('business_id', business.id).order('created_at', { ascending: false })

  return (
    <div className="animate-in fade-in duration-500">
      <JobsClient initialJobs={jobs || []} />
    </div>
  )
}
