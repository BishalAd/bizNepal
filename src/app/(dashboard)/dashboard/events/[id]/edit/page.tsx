import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import EventFormClient from '../../EventFormClient'

export const metadata = { title: 'Edit Event | Dashboard' }

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, name').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  const { data: event } = await supabase.from('events').select('*').eq('id', id).eq('business_id', business.id).single()
  if (!event) notFound()

  const { data: districts } = await supabase.from('districts').select('id, name_en, province').order('name_en')

  return (
    <div className="animate-in fade-in duration-500">
      <EventFormClient
        districts={districts || []}
        business={business}
        event={event}
      />
    </div>
  )
}
