'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        if (profileData) {
          setProfile(profileData)
          
          if (profileData.role === 'business') {
            const { data: bizData } = await supabase
              .from('businesses')
              .select('*')
              .eq('owner_id', user.id)
              .single()
              
            setBusiness(bizData)
          }
        }
      }
      setLoading(false)
    }

    getUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          setUser(null)
          setProfile(null)
          setBusiness(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  return {
    user,
    profile,
    business,
    loading,
    isBusinessOwner: profile?.role === 'business',
    isAdmin: profile?.role === 'admin'
  }
}
