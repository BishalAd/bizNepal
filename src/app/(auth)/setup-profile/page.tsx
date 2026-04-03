'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Upload, CheckCircle2, Briefcase } from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

export default function SetupProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Step 1 Data
  const [fullName, setFullName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [selectedRole, setSelectedRole] = useState<'user' | 'business'>('user')
  
  // Step 2 Data
  const [bizName, setBizName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [bizPhone, setBizPhone] = useState('')
  const [bizAddress, setBizAddress] = useState('')
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (prof) {
        setProfile(prof)
        setFullName(prof.full_name || '')
        setWhatsapp(prof.whatsapp || '')
        setSelectedRole(prof.role === 'admin' ? 'business' : (prof.role as any || 'user'))
        
        // If business, check if business exists
        if (prof.role === 'business') {
          const { data: biz, error: bizError } = await supabase
            .from('businesses')
            .select('id')
            .eq('owner_id', session.user.id)
            .maybeSingle()
            
          if (biz) {
            router.push('/dashboard')
            return
          }
          setStep(2) // Jump to business setup if role is already business but no biz record
        }
      }

      // Load categories for business step
      const { data: cats } = await supabase.from('categories').select('*').limit(50)
      if (cats) setCategories(cats)

      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      let avatarUrl = profile?.avatar_url
      
      // Upload avatar if exists
      if (avatar) {
        const fileExt = avatar.name.split('.').pop()
        const fileName = `${user.id}-${Math.random()}.${fileExt}`
        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatar)
          
        if (!uploadError && data) {
          const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(fileName)
          avatarUrl = pubData.publicUrl
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id, // NECESSARY for upsert
          full_name: fullName,
          whatsapp,
          avatar_url: avatarUrl,
          role: selectedRole, // SAVE THE SELECTED ROLE
          updated_at: new Date().toISOString()
        })

      if (updateError) throw updateError

      if (selectedRole === 'business') {
        setStep(2)
      } else {
        router.push('/')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const slug = bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)
      
      const { error: bizError } = await supabase
        .from('businesses')
        .insert({
          owner_id: user.id,
          name: bizName,
          slug,
          category_id: categoryId || null,
          phone: bizPhone,
          address: bizAddress,
        })

      if (bizError) throw bizError

      // Trigger n8n webhook in background
      fetch('/api/webhooks/new-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          accountType: 'business',
          businessName: bizName,
          userName: fullName,
          userEmail: user.email,
          userPhone: bizPhone
        })
      }).catch(err => console.error('Failed to trigger n8n onboarding webhook:', err))

      // 3. Final Redirect
      toast.success('Business profile created successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to create business profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  return (
    <div className="w-full">
      <Toaster position="top-right" />
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm font-medium mb-4">
          <span className={`flex items-center ${step >= 1 ? 'text-red-600' : 'text-gray-400'}`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-2 ${step >= 1 ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}>1</span>
            Personal Profile
          </span>
          <div className={`flex-1 mx-4 h-0.5 ${step >= 2 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
          <span className={`flex items-center ${step >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-2 ${step >= 2 ? 'border-red-600 bg-red-50' : 'border-gray-300'}`}>2</span>
            Business Setup
          </span>
        </div>
      </div>

      <div className="bg-white py-8 px-4 sm:rounded-lg sm:px-10 border border-gray-100 shadow-sm">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm font-bold">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form className="space-y-6" onSubmit={handleStep1Submit}>
            <div className="text-center mb-6">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Complete your profile</h3>
              <p className="text-sm font-medium text-gray-500 mt-1">Tell us a bit more about yourself before getting started.</p>
            </div>

            {/* ROLE SELECTION */}
            <div className="grid grid-cols-2 gap-4 mb-8">
               <button 
                 type="button"
                 onClick={() => setSelectedRole('user')}
                 className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedRole === 'user' ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-gray-200 opacity-60'}`}
               >
                 <UserIcon className={`w-8 h-8 ${selectedRole === 'user' ? 'text-red-600' : 'text-gray-400'}`} />
                 <span className={`text-xs font-black uppercase tracking-widest ${selectedRole === 'user' ? 'text-red-600' : 'text-gray-500'}`}>Individual</span>
               </button>
               <button 
                 type="button"
                 onClick={() => setSelectedRole('business')}
                 className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedRole === 'business' ? 'border-red-600 bg-red-50' : 'border-gray-100 hover:border-gray-200 opacity-60'}`}
               >
                 <Briefcase className={`w-8 h-8 ${selectedRole === 'business' ? 'text-red-600' : 'text-gray-400'}`} />
                 <span className={`text-xs font-black uppercase tracking-widest ${selectedRole === 'business' ? 'text-red-600' : 'text-gray-500'}`}>Business</span>
               </button>
            </div>

            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {avatar ? (
                    <img src={URL.createObjectURL(avatar)} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <label htmlFor="avatar" className="absolute bottom-0 right-0 bg-red-600 rounded-full p-2 cursor-pointer shadow-sm hover:bg-red-700 transition">
                  <Upload className="w-4 h-4 text-white" />
                  <input id="avatar" type="file" accept="image/*" className="hidden" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+977" required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-3 py-2 border" />
            </div>

            <button type="submit" disabled={isSaving}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Continue'}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleStep2Submit}>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Setup Business Profile</h3>
              <p className="text-sm text-gray-500 mt-1">Let customers know who you are.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Business Name</label>
              <input type="text" value={bizName} onChange={e => setBizName(e.target.value)} required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-3 py-2 border bg-white">
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Business Phone</label>
              <input type="text" value={bizPhone} onChange={e => setBizPhone(e.target.value)} required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Business Address</label>
              <input type="text" value={bizAddress} onChange={e => setBizAddress(e.target.value)} required
                placeholder="Street name, Area, City"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm px-3 py-2 border" />
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => router.push('/dashboard')} 
                className="w-1/3 flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                Skip for now
              </button>
              <button type="submit" disabled={isSaving}
                className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Complete Setup'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function UserIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
