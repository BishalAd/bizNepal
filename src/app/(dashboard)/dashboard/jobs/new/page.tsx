import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobFormClient from '../JobFormClient'

export const metadata = { title: 'Post Job | Dashboard' }

export default async function NewJobPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const [
    { data: districts },
    { data: categories }
  ] = await Promise.all([
    supabase.from('districts').select('id, name_en, province').order('name_en'),
    supabase.from('categories').select('id, name_en').eq('type', 'job').order('name_en')
  ])

  return (
    <div className="animate-in fade-in duration-500">
      <JobFormClient 
        districts={districts || []} 
        categories={categories || []}
        businessId={business.id}
      />
    </div>
  )
}
