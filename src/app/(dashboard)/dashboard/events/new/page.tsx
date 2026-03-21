import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EventFormClient from '../EventFormClient'

export const metadata = { title: 'Create Event | Dashboard' }

export default async function NewEventPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: districts } = await supabase.from('districts').select('id, name_en, province').order('name_en')

  return (
    <div className="animate-in fade-in duration-500">
      <EventFormClient 
        districts={districts || []} 
        business={business}
      />
    </div>
  )
}
