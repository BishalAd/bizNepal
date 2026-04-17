'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  Loader2, Upload, Store, User as UserIcon, 
  ShieldCheck, CreditCard, ChevronRight, 
  Sparkles, Phone, MapPin, Tag, ArrowRight
} from 'lucide-react'
import { Toaster, toast } from 'react-hot-toast'

export default function SetupProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Combined Form Data
  const [fullName, setFullName] = useState('')
  const [personalWhatsapp, setPersonalWhatsapp] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  
  const [bizName, setBizName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [bizPhone, setBizPhone] = useState('')
  const [bizAddress, setBizAddress] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  
  const [khaltiId, setKhaltiId] = useState('')
  const [esewaId, setEsewaId] = useState('')
  const [fonepayCode, setFonepayCode] = useState('')
  const [fonepaySecret, setFonepaySecret] = useState('')

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
        setFullName(prof.full_name || session.user.user_metadata?.full_name || '')
        setPersonalWhatsapp(prof.whatsapp || session.user.user_metadata?.phone || '')
        
        // If they already have a business, skip onboarding
        const { data: biz } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', session.user.id)
          .maybeSingle()
            
        if (biz) {
          router.push('/dashboard')
          return
        }
      }

      const { data: cats } = await supabase.from('categories').select('*').limit(50)
      if (cats) setCategories(cats)

      setIsLoading(false)
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      // 1. Upload avatar if exists
      let avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url
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

      // 2. Upsert Profile
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          whatsapp: personalWhatsapp,
          avatar_url: avatarUrl,
          role: 'business',
          updated_at: new Date().toISOString()
        })

      if (updateError) throw updateError

      // 3. Create Business
      const slug = bizName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)
      const { error: bizError } = await supabase
        .from('businesses')
        .insert({
          owner_id: user.id,
          name: bizName,
          slug,
          category_id: categoryId || null,
          phone: bizPhone,
          whatsapp: personalWhatsapp || null,
          address: bizAddress,
          khalti_merchant_id: khaltiId || null,
          esewa_merchant_id: esewaId || null,
          fonepay_merchant_code: fonepayCode || null,
          fonepay_secret_key: fonepaySecret || null,
        })

      if (bizError) throw bizError

      // 4. Trigger Webhook
      fetch('/api/webhooks/new-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          accountType: 'business',
          businessName: bizName,
          userName: fullName,
          userEmail: user.email,
          userPhone: bizPhone
        })
      }).catch(err => console.error('Webhook error:', err))

      // 5. Success
      toast.success('Business Profile Setup Complete!')
      window.dispatchEvent(new CustomEvent('profile-updated'))
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to complete setup')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 bg-white gap-6">
        <div className="relative">
           <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
        </div>
        <div className="text-center">
           <p className="text-sm font-black text-gray-900 tracking-tight">Loading Onboarding...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#FDFDFF] py-8 md:py-12 px-4 overflow-x-hidden">
      <Toaster position="top-right" />
      
      {/* HEADER HERO - Standardized Scale */}
      <div className="max-w-3xl mx-auto mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 mb-4">
           <Sparkles className="w-3.5 h-3.5 text-red-600" />
           <span className="text-[9px] font-black uppercase tracking-widest text-red-600">Merchant Hub Setup</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter mb-3 leading-tight">
           Welcome to the <span className="text-red-600">Biznity Network</span>
        </h1>
        <p className="max-w-xl mx-auto text-gray-400 font-bold text-sm md:text-base leading-relaxed">
           Provide your professional details to establish your business listing and reach customers across Nepal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-xs font-black flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 text-white rounded-xl flex items-center justify-center shrink-0 font-black">!</div>
            {error}
          </div>
        )}

        {/* SECTION 1: PERSONAL REPRESENTATIVE */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative group/avatar">
                <div className="w-28 h-28 rounded-[2rem] bg-gray-50 border-2 border-white shadow-md flex items-center justify-center overflow-hidden transition-all group-hover:scale-105">
                  {avatar ? (
                    <img src={URL.createObjectURL(avatar)} alt="Avatar" className="w-full h-full object-cover" />
                  ) : profile?.avatar_url || user.user_metadata?.avatar_url ? (
                    <img src={profile?.avatar_url || user.user_metadata?.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-gray-200" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-red-600 text-white w-9 h-9 rounded-xl cursor-pointer hover:bg-black transition-all shadow-lg border-2 border-white flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
                </label>
              </div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-4">Identity Photo</p>
            </div>

            <div className="flex-1 space-y-6 w-full">
               <div className="space-y-1">
                  <div className="flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4 text-red-600" />
                     <h3 className="text-lg font-black text-gray-900 tracking-tight">Account Holder</h3>
                  </div>
               </div>

               <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 group/input">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-red-600">Full Name</label>
                    <div className="relative">
                       <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-600 transition-colors" />
                       <input 
                         type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                         className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-red-600 transition-all outline-none font-bold text-gray-900 text-sm shadow-sm" 
                         placeholder="Ram Bahadur"
                       />
                    </div>
                  </div>
                  <div className="space-y-1.5 group/input">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-red-600">WhatsApp</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-red-600 transition-colors" />
                       <input 
                         type="text" required value={personalWhatsapp} onChange={e => setPersonalWhatsapp(e.target.value)}
                         className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-red-600 transition-all outline-none font-bold text-gray-900 text-sm shadow-sm" 
                         placeholder="+977"
                       />
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: BUSINESS PROFILE */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
           <div className="space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Business Profile</h3>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Visibility details for the marketplace</p>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <div className="md:col-span-2 space-y-1.5 group/input">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-600">Brand / Store Name</label>
                    <div className="relative">
                       <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                       <input 
                         type="text" required value={bizName} onChange={e => setBizName(e.target.value)}
                         className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-600 transition-all outline-none font-black text-gray-900 text-base shadow-sm" 
                         placeholder="The Coffee Hub"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5 group/input">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-600">Merchant Category</label>
                   <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                      <select 
                        required value={categoryId} onChange={e => setCategoryId(e.target.value)}
                        className="w-full pl-11 pr-10 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-600 transition-all outline-none font-bold text-gray-900 text-sm shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                      </select>
                   </div>
                 </div>

                 <div className="space-y-1.5 group/input">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-600">Official Mobile</label>
                   <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        type="text" required value={bizPhone} onChange={e => setBizPhone(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-600 transition-all outline-none font-bold text-gray-900 text-sm shadow-sm" 
                        placeholder="Public Phone Number"
                      />
                   </div>
                 </div>

                 <div className="md:col-span-2 space-y-1.5 group/input">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-blue-600">Physical Address</label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                      <input 
                        type="text" required value={bizAddress} onChange={e => setBizAddress(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-blue-600 transition-all outline-none font-bold text-gray-900 text-sm shadow-sm" 
                        placeholder="Street, City (e.g. Kathmandu)"
                      />
                   </div>
                 </div>
              </div>
           </div>
        </div>

        {/* SECTION 3: PAYMENTS */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
           <div className="space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                       <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black text-gray-900 tracking-tight">Payments</h3>
                    </div>
                 </div>
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Optional</span>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                 {[
                   { id: 'khalti', label: 'Khalti ID', val: khaltiId, set: setKhaltiId, ph: 'live_public_key_' },
                   { id: 'esewa', label: 'eSewa ID', val: esewaId, set: setEsewaId, ph: 'EPAYTEST' },
                   { id: 'fonepay-c', label: 'Fonepay Code', val: fonepayCode, set: setFonepayCode, ph: '' },
                   { id: 'fonepay-s', label: 'Fonepay Secret', val: fonepaySecret, set: setFonepaySecret, ph: '', secret: true },
                 ].map((box) => (
                   <div key={box.id} className="space-y-1.5 group/input">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-amber-600">{box.label}</label>
                      <input 
                        type={box.secret ? 'password' : 'text'} 
                        value={box.val} onChange={e => box.set(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-amber-500 transition-all outline-none font-bold text-gray-900 text-xs shadow-sm" 
                        placeholder={box.ph}
                      />
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* ACTION BUTTON */}
        <div className="pt-4 pb-12">
           <button 
             type="submit" 
             disabled={isSaving}
             className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
           >
             {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
               <>
                 Setup My Business <ArrowRight className="w-4 h-4" />
               </>
             )}
           </button>
        </div>
      </form>
    </div>
  )
}
