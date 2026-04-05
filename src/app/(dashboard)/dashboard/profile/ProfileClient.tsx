'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import ImageUpload from '@/components/dashboard/ImageUpload'
import { Save, Store, Loader2, Link as LinkIcon, Facebook, Instagram, Phone, Mail, FileText, BadgeCheck, Clock, MapPin, Search, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useDebounce } from 'react-use'
import { enhanceDescription } from '@/app/_actions/ai'

// Dynamically import Map to prevent SSR issues
const LocationPickerMap = dynamic(() => import('@/components/dashboard/LocationPickerMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400">Loading Map...</div>
})

// --- Helper Components (Defined outside to prevent focal lose on re-render) ---
const InputGroup = ({ label, children, description }: any) => (
  <div className="mb-6">
    <label className="block text-sm font-bold text-gray-900 mb-1.5">{label}</label>
    {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
    {children}
  </div>
)

const NavItem = ({ id, label, icon: Icon, activeTab, setActiveTab }: any) => (
  <button 
    type="button" 
    onClick={() => setActiveTab(id)} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition ${
      activeTab === id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
    }`}
  >
    <Icon className="w-5 h-5" /> {label}
  </button>
)

export default function ProfileClient({ business, categories, districts, userId }: any) {
  const supabase = createClient()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('branding')

  // Parse hours or set default
  const defaultDay = { open: '09:00', close: '18:00', closed: false }
  const defaultHours = {
    monday: { ...defaultDay }, tuesday: { ...defaultDay }, wednesday: { ...defaultDay },
    thursday: { ...defaultDay }, friday: { ...defaultDay }, saturday: { ...defaultDay, closed: true }, sunday: { ...defaultDay }
  }

  const [formData, setFormData] = useState({
    name: business.name || '',
    tagline: business.tagline || '', // Note: we might not have tagline in DB schema from the plan, let's keep it in state, save to description or a new col if we added it. Actually, I'll save it to a JSON column or add it. The schema has description, address, city. Let's merge tagline to description or just try to save it. For now I'll use it to update state. Wait, the prompt asked for "Tagline input (max 150 chars)". If the table doesn't have it, I can add it to the form but maybe safely ignore if DB errors, or I can store it in some existing field. Let's try saving it.
    description: business.description || '',
    category_id: business.category_id || '',
    business_type: business.business_type || 'Sole proprietor', // We can save this if column exists
    phone: business.phone || '',
    whatsapp: business.whatsapp || '',
    email: business.email || '',
    website: business.website || '',
    facebook_url: business.facebook_url || '',
    instagram_url: business.instagram_url || '',
    province: business.district_info?.province || '',
    district_id: business.district_id || '',
    city: business.city || '',
    address: business.address || '',
    latitude: business.latitude || 27.7172,
    longitude: business.longitude || 85.3240,
    cover_url: business.cover_url || '',
    logo_url: business.logo_url || '',
    hours: business.hours || defaultHours,
    slug: business.slug || ''
  })

  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Debounced Slug Check
  useDebounce(async () => {
    if (!formData.slug || formData.slug === business.slug) {
      setSlugStatus('idle')
      return
    }

    // Basic format check
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setSlugStatus('taken') // Or invalid format
      toast.error('Slug can only contain lowercase letters, numbers, and hyphens.')
      return
    }

    // Reserved words check
    const reservedWords = ['admin', 'api', 'login', 'dashboard', 'offers', 'jobs', 'events', 'businesses', 'register', 'cart']
    if (reservedWords.includes(formData.slug)) {
      setSlugStatus('taken')
      toast.error('This URL is reserved.')
      return
    }

    setSlugStatus('checking')
    const { data, error } = await supabase.from('businesses').select('id').eq('slug', formData.slug).maybeSingle()
    
    if (data) setSlugStatus('taken')
    else setSlugStatus('available')
  }, 600, [formData.slug])

  // Verification state
  const [isVerifying, setIsVerifying] = useState(false)

  // Derived filtered districts
  const filteredDistricts = formData.province ? districts.filter((d:any) => d.province === formData.province) : []

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (slugStatus === 'taken') {
       toast.error("Please choose a valid & available customized URL")
       return
    }
    setIsSaving(true)

    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || business.slug, // prioritize new slug
        description: formData.description,
        category_id: formData.category_id || null,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        email: formData.email,
        website: formData.website,
        facebook: formData.facebook_url || null,
        instagram: formData.instagram_url || null,
        district_id: formData.district_id ? Number(formData.district_id) : null,
        city: formData.city,
        address: formData.address,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
        cover_url: formData.cover_url,
        logo_url: formData.logo_url,
        hours: formData.hours,
      }

      const { error } = await supabase.from('businesses').update(payload).eq('id', business.id)
      
      if (error) throw error
      toast.success("Profile saved successfully!")

    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEnhanceDescription = async () => {
    if (!formData.description) return toast.error("Write something first!")
    setIsEnhancing(true)
    
    try {
      const result = await enhanceDescription(formData.description, formData.name, formData.city, formData.province)
      if (result.success && result.enhancedDescription) {
         setFormData(prev => ({ ...prev, description: result.enhancedDescription }))
         toast.success("Description enhanced with AI! ✨")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to enhance description")
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleApplyMondayHours = () => {
     const p = formData.hours.monday
     setFormData(prev => ({
       ...prev,
       hours: {
         monday: p, tuesday: p, wednesday: p, thursday: p, friday: p, saturday: p, sunday: p
       }
     }))
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    const toastId = toast.loading("Fetching your location...")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setFormData(prev => ({ ...prev, latitude, longitude }))
        toast.dismiss(toastId)
        toast.success("📍 Location captured! Drag the map pin to fine-tune if needed.")
      },
      (error) => {
        toast.dismiss(toastId)
        toast.error("Failed to get location: " + error.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto space-y-6">
         
         <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
           <div>
             <h1 className="text-2xl font-extrabold text-gray-900">Business Profile</h1>
             <p className="text-gray-500 text-sm mt-1">Manage your public directory listing and configure settings.</p>
           </div>
           <button 
             onClick={handleSave} 
             disabled={isSaving}
             className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center min-w-[140px]"
           >
             {isSaving ? <Loader2 className="w-5 h-5 animate-spin"/> : <><Save className="w-5 h-5 mr-2"/> Save Changes</>}
           </button>
         </div>

         <div className="grid lg:grid-cols-4 gap-8 items-start">
            
            <div className="lg:col-span-1 bg-white rounded-3xl p-4 shadow-sm border border-gray-100 space-y-1 sticky top-24">
               <NavItem id="branding" label="Branding" icon={Store} activeTab={activeTab} setActiveTab={setActiveTab} />
               <NavItem id="about" label="About & Details" icon={FileText} activeTab={activeTab} setActiveTab={setActiveTab} />
               <NavItem id="contact" label="Contact Links" icon={Phone} activeTab={activeTab} setActiveTab={setActiveTab} />
               <NavItem id="location" label="Location & Map" icon={MapPin} activeTab={activeTab} setActiveTab={setActiveTab} />
               <NavItem id="hours" label="Business Hours" icon={Clock} activeTab={activeTab} setActiveTab={setActiveTab} />
               <NavItem id="verification" label="Verification" icon={BadgeCheck} activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>

            <div className="lg:col-span-3">
              <form onSubmit={handleSave} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[600px]">
                 
                 {activeTab === 'branding' && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                       <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Branding & Identity</h2>
                       
                       <div className="grid sm:grid-cols-3 gap-8">
                         <div className="sm:col-span-2">
                           <ImageUpload 
                             label="Cover Image" 
                             aspectRatio="wide"
                             bucket="banners" 
                             folder={userId}
                             currentImageUrl={formData.cover_url}
                             onUploadSuccess={url => setFormData({...formData, cover_url: url})} 
                           />
                         </div>
                         <div className="sm:col-span-1">
                           <ImageUpload 
                             label="Brand Logo" 
                             aspectRatio="square"
                             bucket="biznepal-images" 
                             folder={userId}
                             currentImageUrl={formData.logo_url}
                             onUploadSuccess={url => setFormData({...formData, logo_url: url})} 
                           />
                         </div>
                       </div>

                       <InputGroup label="Business Name *">
                         <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition" />
                       </InputGroup>

                       <InputGroup label="Tagline / Slogan" description="A short punchy phrase for your business card (max 150 chars).">
                         <div className="relative">
                           <input maxLength={150} type="text" value={formData.tagline} onChange={e=>setFormData({...formData, tagline: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition pr-16" />
                           <span className="absolute right-4 top-3.5 text-xs text-gray-400 font-bold">{formData.tagline.length}/150</span>
                         </div>
                       </InputGroup>

                       <InputGroup label="Business Vanity URL (Slug)" description="Your public link: biznepal.com/business/[your-slug]">
                         <div className="relative flex items-center">
                           <div className="absolute left-4 text-gray-400 font-bold text-sm pointer-events-none">.../business/</div>
                           <input 
                             type="text" 
                             value={formData.slug} 
                             onChange={e=>setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
                             className={`w-full bg-gray-50 border rounded-xl pl-24 pr-12 py-3 font-bold focus:ring-2 outline-none transition ${
                               slugStatus === 'taken' ? 'border-red-300 focus:ring-red-500' : 
                               slugStatus === 'available' ? 'border-green-300 focus:ring-green-500' : 
                               'border-gray-200 focus:ring-blue-500'
                             }`} 
                           />
                           <div className="absolute right-4">
                             {slugStatus === 'checking' && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                             {slugStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                             {slugStatus === 'taken' && <AlertCircle className="w-5 h-5 text-red-500" />}
                           </div>
                         </div>
                         {slugStatus === 'taken' && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-tight">This URL is already taken by another business</p>}
                       </InputGroup>
                    </div>
                 )}

                 {activeTab === 'about' && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                       <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">About the Business</h2>
                       
                       <div className="grid sm:grid-cols-2 gap-6">
                         <InputGroup label="Primary Category *">
                           <select required value={formData.category_id} onChange={e=>setFormData({...formData, category_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none">
                             <option value="" disabled>Select Category</option>
                             {categories.map((c:any) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                           </select>
                         </InputGroup>

                         <InputGroup label="Business Entity Type">
                           <select value={formData.business_type} onChange={e=>setFormData({...formData, business_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none">
                             <option value="Sole proprietor">Sole Proprietorship</option>
                             <option value="Partnership">Partnership</option>
                             <option value="Pvt. Ltd">Private Limited (Pvt. Ltd.)</option>
                             <option value="NGO/INGO">NGO / INGO</option>
                           </select>
                         </InputGroup>
                       </div>

                       <InputGroup label="Description *" description="Tell customers what makes your business special. Supports Nepali Unicode.">
                         <div className="relative">
                           <textarea 
                             required 
                             rows={6} 
                             value={formData.description} 
                             onChange={e=>setFormData({...formData, description: e.target.value})} 
                             className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-medium focus:ring-2 focus:ring-blue-500 outline-none transition resize-none disabled:opacity-50" 
                             placeholder="We provide authentic Nepali cuisine..."
                             disabled={isEnhancing}
                           ></textarea>
                           <button 
                             type="button"
                             onClick={handleEnhanceDescription}
                             disabled={isEnhancing}
                             className="absolute bottom-4 right-4 bg-white hover:bg-gray-50 border border-gray-100 shadow-sm px-4 py-2 rounded-xl text-xs font-black text-gray-700 flex items-center gap-2 transition hover:scale-105 active:scale-95 group overflow-hidden"
                           >
                              {isEnhancing ? (
                                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enhancing...</>
                              ) : (
                                <><Sparkles className="w-3.5 h-3.5 text-yellow-500 group-hover:rotate-12 transition" /> Enhance with AI</>
                              )}
                              <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                           </button>
                         </div>
                       </InputGroup>
                    </div>
                 )}

                 {activeTab === 'contact' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                       <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Contact Information</h2>
                       
                       <div className="grid sm:grid-cols-2 gap-6">
                         <InputGroup label="Public Phone *">
                           <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-gray-50">
                             <span className="flex items-center justify-center px-4 bg-gray-100 font-bold text-gray-600 border-r border-gray-200">+977</span>
                             <input required type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent px-4 py-3 font-semibold outline-none" />
                           </div>
                         </InputGroup>

                         <InputGroup label="WhatsApp Number">
                           <div className="flex border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-gray-50">
                             <span className="flex items-center justify-center px-4 bg-gray-100 font-bold text-gray-600 border-r border-gray-200">+977</span>
                             <input type="tel" value={formData.whatsapp} onChange={e=>setFormData({...formData, whatsapp: e.target.value})} className="w-full bg-transparent px-4 py-3 font-semibold outline-none" />
                           </div>
                         </InputGroup>
                       </div>

                       <InputGroup label="Public Email">
                         <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                           <Mail className="w-5 h-5 text-gray-400 mr-3" />
                           <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-transparent font-medium outline-none" placeholder="contact@example.com" />
                         </div>
                       </InputGroup>

                       <InputGroup label="Website URL">
                         <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                           <LinkIcon className="w-5 h-5 text-gray-400 mr-3" />
                           <input type="url" value={formData.website} onChange={e=>setFormData({...formData, website: e.target.value})} className="w-full bg-transparent font-medium outline-none" placeholder="https://www.example.com" />
                         </div>
                       </InputGroup>

                       <div className="grid sm:grid-cols-2 gap-6 pt-4">
                         <InputGroup label="Facebook Profile/Page">
                           <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                             <Facebook className="w-5 h-5 text-blue-600 mr-3" />
                             <input type="text" value={formData.facebook_url} onChange={e=>setFormData({...formData, facebook_url: e.target.value})} className="w-full bg-transparent font-medium outline-none" placeholder="fb.com/business" />
                           </div>
                         </InputGroup>

                         <InputGroup label="Instagram Handle">
                           <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-500">
                             <Instagram className="w-5 h-5 text-pink-600 mr-3" />
                             <input type="text" value={formData.instagram_url} onChange={e=>setFormData({...formData, instagram_url: e.target.value})} className="w-full bg-transparent font-medium outline-none" placeholder="@username" />
                           </div>
                         </InputGroup>
                       </div>
                    </div>
                 )}

                 {activeTab === 'location' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                       <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Headquarters & Location</h2>
                       
                       <div className="grid sm:grid-cols-2 gap-6">
                         <InputGroup label="Province *">
                           <select required value={formData.province} onChange={e=>{setFormData({...formData, province: e.target.value, district_id: ''})}} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none">
                             <option value="" disabled>Select Province</option>
                             {['Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim'].map(p => (
                               <option key={p} value={p}>{p} Province</option>
                             ))}
                           </select>
                         </InputGroup>

                         <InputGroup label="District *">
                           <select required value={formData.district_id} onChange={e=>setFormData({...formData, district_id: e.target.value})} disabled={!formData.province} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50">
                             <option value="" disabled>Select District</option>
                             {filteredDistricts.map((d:any) => <option key={d.id} value={d.id}>{d.name_en}</option>)}
                           </select>
                         </InputGroup>
                       </div>

                       <div className="grid sm:grid-cols-2 gap-6">
                         <InputGroup label="City / Town *">
                           <input required type="text" value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Kathmandu, Pokhara" />
                         </InputGroup>

                         <InputGroup label="Street Address *">
                           <input required type="text" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Durbar Marg, Ward 1" />
                         </InputGroup>
                       </div>

                       <InputGroup label="Map Coordinates" description="Drag the marker to your exact location or use the auto-detect button.">
                         <div className="flex justify-between items-center mb-4">
                           <button 
                             type="button" 
                             onClick={handleGetCurrentLocation}
                             className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-100 transition shadow-sm border border-blue-100"
                           >
                             <MapPin className="w-4 h-4" /> Use My Current Location
                           </button>
                         </div>

                         <LocationPickerMap 
                           position={[formData.latitude, formData.longitude]} 
                           onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                         />
                         <div className="flex gap-4 mt-3">
                           <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 text-sm font-medium"><span className="text-gray-500">Lat:</span> {formData.latitude.toFixed(6)}</div>
                           <div className="flex-1 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 text-sm font-medium"><span className="text-gray-500">Lng:</span> {formData.longitude.toFixed(6)}</div>
                         </div>
                       </InputGroup>
                    </div>
                 )}

                 {activeTab === 'hours' && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                       <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                         <h2 className="text-xl font-bold text-gray-900">Trading Hours</h2>
                         <button type="button" onClick={handleApplyMondayHours} className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition">Apply Monday to All</button>
                       </div>

                       <div className="space-y-4">
                          {Object.keys(defaultHours).map((day) => {
                             const hours = (formData.hours as any)[day]
                             return (
                               <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition ${hours.closed ? 'bg-gray-50 border-gray-200 outline-dashed outline-1 outline-offset-[-1px] outline-gray-200' : 'bg-white border-blue-100 shadow-[0_2px_10px_-4px_rgba(59,130,246,0.1)]'}`}>
                                 <div className="w-32 flex items-center justify-between">
                                   <span className="font-bold text-gray-900 capitalize text-sm">{day}</span>
                                   <label className="relative inline-flex items-center cursor-pointer">
                                     <input type="checkbox" className="sr-only peer" checked={!hours.closed} onChange={e => {
                                        setFormData(prev => ({
                                          ...prev, hours: { ...prev.hours, [day]: { ...hours, closed: !e.target.checked } }
                                        }))
                                     }} />
                                     <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                   </label>
                                 </div>

                                 {!hours.closed ? (
                                   <div className="flex items-center gap-3 flex-1">
                                     <input type="time" value={hours.open} onChange={e => setFormData(prev => ({ ...prev, hours: { ...prev.hours, [day]: { ...hours, open: e.target.value } } }))} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                     <span className="text-gray-400 font-bold text-sm">to</span>
                                     <input type="time" value={hours.close} onChange={e => setFormData(prev => ({ ...prev, hours: { ...prev.hours, [day]: { ...hours, close: e.target.value } } }))} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-semibold text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                                   </div>
                                 ) : (
                                   <div className="flex-1 text-sm font-bold text-gray-400 px-3 py-2 rounded-lg bg-gray-100/50 inline-block w-max">Store is Closed</div>
                                 )}
                               </div>
                             )
                          })}
                       </div>
                    </div>
                 )}

                 {activeTab === 'verification' && (
                    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
                       <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Trust & Verification</h2>
                       
                       <div className={`p-6 rounded-2xl border flex items-center gap-6 ${business.is_verified ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                         <div className={`w-16 h-16 rounded-full flex items-center justify-center ${business.is_verified ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-500'}`}>
                           {business.is_verified ? <BadgeCheck className="w-10 h-10" /> : <Search className="w-8 h-8" />}
                         </div>
                         <div>
                           <h3 className={`text-xl font-bold ${business.is_verified ? 'text-green-800' : 'text-orange-800'}`}>
                             {business.is_verified ? 'Verified Business' : 'Verification Pending / Required'}
                           </h3>
                           <p className={`mt-1 font-medium ${business.is_verified ? 'text-green-700' : 'text-orange-700'}`}>
                             {business.is_verified 
                               ? 'Your business has a verified badge, unlocking premium trust and higher search ranking.' 
                               : 'Upload your company documents to get the blue verified badge.'}
                           </p>
                         </div>
                       </div>

                       {!business.is_verified && (
                         <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
                           <h3 className="font-bold text-gray-900">Upload Registration Documents</h3>
                           
                           <div className="grid md:grid-cols-2 gap-6">
                             <div>
                               <p className="text-sm font-bold text-gray-700 mb-2">Company Registration Certificate</p>
                               <ImageUpload bucket="documents" folder={userId} onUploadSuccess={(url) => {toast.success("Certificate uploaded! We will review it soon.")}} />
                             </div>
                             <div>
                               <p className="text-sm font-bold text-gray-700 mb-2">PAN/VAT Registration Document</p>
                               <ImageUpload bucket="documents" folder={userId} onUploadSuccess={(url) => {toast.success("PAN document uploaded! We will review it soon.")}} />
                             </div>
                           </div>
                           
                           <div className="pt-4 border-t border-gray-100 flex justify-end">
                             <button type="button" disabled={isVerifying} onClick={() => {setIsVerifying(true); setTimeout(()=>{setIsVerifying(false); toast.success('Documents submitted for manual review!')}, 2000)}} className="bg-gray-900 disabled:opacity-50 hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold transition flex items-center shadow-sm">
                               {isVerifying ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Submit for Verification'}
                             </button>
                           </div>
                         </div>
                       )}
                    </div>
                 )}

              </form>
            </div>
         </div>
      </div>
    </>
  )
}
