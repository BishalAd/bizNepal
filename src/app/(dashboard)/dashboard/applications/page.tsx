import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ApplicationsClient from './ApplicationsClient'

export const metadata = { title: 'Job Applications | Dashboard' }

export default async function ApplicationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: jobs } = await supabase.from('jobs').select(`
    id, title, status, deadline, 
    job_applications(id, applicant_name, applicant_email, applicant_phone, cover_letter, cv_url, status, notes, created_at)
  `).eq('business_id', business.id).order('created_at', { ascending: false })

  return (
    <div className="animate-in fade-in duration-500 h-full">
      <ApplicationsClient initialJobs={jobs || []} />
    </div>
  )
}
