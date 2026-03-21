import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'

export const metadata = { title: 'Business Profile Editor | Dashboard' }

export default async function ProfileEditorPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: business },
    { data: categories },
    { data: districts }
  ] = await Promise.all([
    supabase.from('businesses').select('*').eq('owner_id', user.id).single(),
    supabase.from('categories').select('id, name_en').eq('type', 'business').order('name_en'),
    supabase.from('districts').select('id, name_en, province').order('name_en')
  ])

  if (!business) {
    redirect('/setup-profile') // They must exist via onboarding wizard first
  }

  // Verification Docs mapping (if available in a separate table, otherwise assumed attached to business, but we haven't defined a docs table. We will just upload to bucket and maintain statuses on business table: document_urls[])

  return (
    <div className="animate-in fade-in duration-500">
       <ProfileClient 
         business={business} 
         categories={categories || []} 
         districts={districts || []} 
         userId={user.id} 
       />
    </div>
  )
}
