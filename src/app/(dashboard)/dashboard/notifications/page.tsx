import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NotificationsClient from './NotificationsClient'

export const metadata = { title: 'Notifications | Dashboard' }

export default async function NotificationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase.from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100) // Show last 100 for performance

  return (
    <div className="animate-in fade-in duration-500">
      <NotificationsClient initialSet={notifications || []} userId={user.id} />
    </div>
  )
}
