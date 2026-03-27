import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Notification Settings | Dashboard' }

export default async function NotificationSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase.from('businesses').select('id, whatsapp_number, email_address, telegram_chat_id').eq('owner_id', user.id).single()
  if (!business) redirect('/setup-profile')

  return (
    <div className="animate-in fade-in duration-500">
      <SettingsClient business={business} />
    </div>
  )
}
