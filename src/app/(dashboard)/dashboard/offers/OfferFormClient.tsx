'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import RichTextEditor from '@/components/dashboard/RichTextEditor'
import ImageUpload from '@/components/dashboard/ImageUpload'
import { ArrowLeft, Tag, Calendar, Save, Eye, MousePointer2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// --- Helper Components (Defined outside to prevent focal lose on re-render) ---
const InputGroup = ({ label, children, description }: any) => (
  <div className="mb-5">
    <label className="block text-sm font-bold text-gray-900 mb-1.5">{label}</label>
    {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
    {children}
  </div>
)

export default function OfferFormClient({ products, business }: any) {
  const supabase = createClient()
  const router = useRouter()

  const [isSaving, setIsSaving] = useState(false)
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('percent')
  
  const [formData, setFormData] = useState({
    product_id: '',
    title: '',
    original_price: '',
    offer_price: '',
    discount_percent: '',
    max_quantity: '',
    start_date: '', // Keep for internal form handling if needed, or rename to matches
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: '',
    banner_url: '',
    terms: ''
  })

  // Autofill from product selection
  useEffect(() => {
    if (formData.product_id) {
       const p = products.find((x:any) => x.id === formData.product_id)
       if (p) {
          setFormData(prev => ({
            ...prev,
            title: prev.title || `${p.name} Special Deal`,
            original_price: p.price?.toString() || '',
            banner_url: prev.banner_url || (p.image_keys?.[0] || '')
          }))
       }
    }
  }, [formData.product_id, products])

  // Auto-calculate discount
  useEffect(() => {
    const orig = Number(formData.original_price)
    
    if (orig > 0) {
      if (discountMode === 'percent') {
        const pct = Number(formData.discount_percent)
        if (pct >= 0 && pct <= 100) {
          const offPrice = orig - (orig * pct / 100)
          if (formData.offer_price !== Math.round(offPrice).toString()) {
            setFormData(prev => ({ ...prev, offer_price: Math.round(offPrice).toString() }))
          }
        }
      } else {
        const offPrice = Number(formData.offer_price)
        if (offPrice >= 0 && offPrice < orig) {
          const pct = Math.round(((orig - offPrice) / orig) * 100)
          if (formData.discount_percent !== pct.toString()) {
            setFormData(prev => ({ ...prev, discount_percent: pct.toString() }))
          }
        }
      }
    }
  }, [formData.original_price, formData.offer_price, formData.discount_percent, discountMode])

  const handleSubmit = async (e: React.FormEvent, status: string = 'active') => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (!formData.title || !formData.offer_price || !formData.ends_at) {
        throw new Error("Please fill completely (Title, Offer Price, and End Date are required)")
      }

      if (new Date(formData.ends_at) <= new Date(formData.starts_at)) {
        throw new Error("End date must be after start date")
      }

      const payload = {
        business_id: business.id,
        product_id: formData.product_id || null,
        title: formData.title,
        original_price: Number(formData.original_price),
        offer_price: Number(formData.offer_price),
        discount_percent: Number(formData.discount_percent) || null,
        max_quantity: formData.max_quantity ? Number(formData.max_quantity) : null,
        starts_at: new Date(formData.starts_at).toISOString(),
        ends_at: new Date(formData.ends_at).toISOString(),
        banner_url: formData.banner_url,
        terms_html: formData.terms,
        status: status
      }

      const { error } = await supabase.from('offers').insert(payload)
      if (error) throw error
      
      toast.success("Offer published successfully!")
      router.push('/dashboard/offers')

    } catch (err: any) {
      toast.error(err.message || "Failed to create offer")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white"><ArrowLeft className="w-5 h-5"/></button>
             <div>
               <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Create Offer</h1>
               <div className="flex gap-2 text-sm text-gray-500 font-medium">Dashboard / Offers / New</div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button onClick={e => handleSubmit(e, 'draft')} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
               Save Draft
             </button>
             <button onClick={e => handleSubmit(e, 'active')} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center justify-center min-w-[140px] shadow-sm">
               {isSaving ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/> : <><Save className="w-4 h-4 mr-2"/> Publish Deal</>}
             </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
             <form className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
                
                <InputGroup label="Link to Product (Optional)" description="Select an existing product to automatically sync price and photo.">
                   <select value={formData.product_id} onChange={e=>setFormData({...formData, product_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none">
                     <option value="">Custom Offer (No specific product linked)</option>
                     {products.map((p:any) => <option key={p.id} value={p.id}>{p.name} — ₨ {p.price.toLocaleString()}</option>)}
                   </select>
                </InputGroup>

                <InputGroup label="Offer Title *">
                   <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 50% Off Summer Collection" />
                </InputGroup>

                <div className="grid sm:grid-cols-2 gap-6 bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                   <InputGroup label="Original Price (NPR) *">
                     <input type="number" value={formData.original_price} onChange={e=>setFormData({...formData, original_price: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
                   </InputGroup>

                   <div className="flex gap-4">
                     <div className="flex-1">
                       <InputGroup label={`Discount ${discountMode==='percent' ? '(%)' : 'Amount'}`}>
                         <div className="relative">
                           <input 
                             type="number" 
                             value={discountMode === 'percent' ? formData.discount_percent : formData.offer_price} 
                             onChange={e=>{
                               if(discountMode==='percent') setFormData({...formData, discount_percent: e.target.value})
                               else setFormData({...formData, offer_price: e.target.value})
                             }} 
                             className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-extrabold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none" 
                           />
                           <button type="button" onClick={() => setDiscountMode(discountMode === 'percent' ? 'amount' : 'percent')} className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 hover:text-blue-600 bg-gray-100 px-2 py-1 rounded">
                             Switch to {discountMode==='percent' ? 'NPR' : '%'}
                           </button>
                         </div>
                       </InputGroup>
                     </div>
                   </div>
                   
                   <div className="sm:col-span-2 pt-4 border-t border-blue-100 flex items-center justify-between">
                     <span className="font-bold text-gray-700">Final Customer Price:</span>
                     <span className="text-2xl font-extrabold text-red-600">₨ {Number(formData.offer_price || 0).toLocaleString()}</span>
                   </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                   <InputGroup label="Start Date & Time *">
                     <input required type="datetime-local" value={formData.starts_at} onChange={e=>setFormData({...formData, starts_at: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
                   </InputGroup>
                   <InputGroup label="End Date & Time *">
                     <input required type="datetime-local" value={formData.ends_at} onChange={e=>setFormData({...formData, ends_at: e.target.value})} className="w-full bg-red-50/50 border border-red-200 rounded-xl px-4 py-3 font-bold text-red-800 focus:ring-2 focus:ring-red-500 outline-none" />
                   </InputGroup>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                   <InputGroup label="Total Available Quantity" description="Leave blank for unlimited grabs.">
                     <input type="number" value={formData.max_quantity} onChange={e=>setFormData({...formData, max_quantity: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 50" />
                   </InputGroup>
                </div>

                <InputGroup label="Banner Image (16:9) *" description="Make it eye-catching. This shows on the Deals page.">
                   <ImageUpload 
                     aspectRatio="wide"
                     bucket="banners" 
                     folder={business.id}
                     currentImageUrl={formData.banner_url}
                     onUploadSuccess={url => setFormData({...formData, banner_url: url})} 
                   />
                </InputGroup>

                <div className="mb-6">
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Terms & Conditions</label>
                  <RichTextEditor value={formData.terms} onChange={val => setFormData({...formData, terms: val})} placeholder="List any restrictions, validity rules, etc." />
                </div>

             </form>
          </div>

          {/* Right Column (Live Preview) */}
          <div className="lg:col-span-1 space-y-6 sticky top-24">
             <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 shadow-xl text-white">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-6"><Eye className="w-5 h-5 text-blue-400"/> Live Preview</h3>
                
                <div className="bg-white rounded-2xl overflow-hidden shadow-lg transform transition-transform hover:-translate-y-1">
                   <div className="h-40 bg-gray-100 relative">
                     {formData.banner_url ? (
                       <img src={formData.banner_url} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-gray-300"><Tag className="w-10 h-10"/></div>
                     )}
                     
                     <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
                       {formData.discount_percent ? `${formData.discount_percent}% OFF` : 'DEAL'}
                     </div>
                     
                     {/* Preview Timer */}
                     <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-2">
                       {['02','14','30','59'].map((t,i) => (
                         <div key={i} className="bg-white/90 backdrop-blur text-gray-900 px-2 py-1 rounded text-center min-w-[36px] shadow-sm">
                           <div className="text-xs font-black">{t}</div>
                           <div className="text-[8px] font-bold uppercase text-gray-500 -mt-0.5">{['d','h','m','s'][i]}</div>
                         </div>
                       ))}
                     </div>
                   </div>

                   <div className="p-4 text-gray-900">
                     <div className="flex items-center gap-2 mb-2">
                       <div className="w-6 h-6 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                         {business.logo_url && <img src={supabase.storage.from('biznepal-images').getPublicUrl(business.logo_url).data.publicUrl} className="w-full h-full object-cover"/>}
                       </div>
                       <span className="text-xs font-bold text-gray-500 truncate">{business.name}</span>
                     </div>
                     
                     <h4 className="font-extrabold text-base leading-tight mb-3 line-clamp-2">{formData.title || 'Your Offer Title Here'}</h4>
                     
                     <div className="flex items-end gap-2 mb-4">
                       <span className="font-black text-red-600 text-xl">₨ {Number(formData.offer_price || 0).toLocaleString()}</span>
                       <span className="text-sm font-bold text-gray-400 line-through mb-0.5">₨ {Number(formData.original_price || 0).toLocaleString()}</span>
                     </div>

                     <div className="space-y-1.5 mb-4">
                       <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                         <span>Stock</span>
                         <span>0 / {formData.max_quantity || '∞'} grabbed</span>
                       </div>
                       <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                         <div className="h-full bg-red-500 w-[10%] opacity-50"></div>
                       </div>
                     </div>

                     <button disabled className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm pointer-events-none opacity-90">
                       <MousePointer2 className="w-4 h-4"/> Grab This Deal
                     </button>
                   </div>
                </div>

                <p className="text-xs text-center text-gray-400 mt-6 font-medium">This is how your deal will appear to customers on the Offers page.</p>
             </div>
          </div>

        </div>
      </div>
    </>
  )
}
