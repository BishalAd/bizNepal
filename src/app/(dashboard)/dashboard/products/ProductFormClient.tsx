'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import RichTextEditor from '@/components/dashboard/RichTextEditor'
import { Plus, X, UploadCloud, Save, ArrowLeft, Wand2, Image as ImageIcon, CheckCircle2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

export default function ProductFormClient({ initialData, categories, businessId }: any) {
  const isEditing = !!initialData
  const supabase = createClient()
  const router = useRouter()

  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    name_np: initialData?.name_np || '',
    slug: initialData?.slug || '',
    category_id: initialData?.category_id || '',
    description: initialData?.description || '',
    price: initialData?.price?.toString() || '',
    discount_price: initialData?.discount_price?.toString() || '',
    stock_quantity: initialData?.stock_quantity?.toString() || '10',
    low_stock_threshold: initialData?.low_stock_threshold?.toString() || '5',
    sku: initialData?.sku || '',
    status: initialData?.status || 'active',
    // Options
    cod_available: initialData?.cod_available ?? true,
    esewa_available: initialData?.esewa_available ?? true,
    khalti_available: initialData?.khalti_available ?? true,
    pickup_available: initialData?.pickup_available ?? true
  })

  // Images state
  const [imageKeys, setImageKeys] = useState<string[]>(initialData?.image_keys || [])
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})

  // Auto generate slug
  useEffect(() => {
    if (!isEditing && formData.name) {
      const gSlug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      setFormData(prev => ({ ...prev, slug: gSlug }))
    }
  }, [formData.name, isEditing])

  // Local storage auto-save draft every 60s
  useEffect(() => {
    if (isEditing) return
    const interval = setInterval(() => {
       localStorage.setItem('draft_product', JSON.stringify(formData))
    }, 60000)
    return () => clearInterval(interval)
  }, [formData, isEditing])

  // Multi Image Dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const totalFiles = imageKeys.length + acceptedFiles.length
    if (totalFiles > 8) {
      toast.error('Maximum 8 images allowed')
      return
    }

    const newKeys = [...imageKeys]

    for (const file of acceptedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`)
        continue
      }
      
      const fileId = Math.random().toString(36).substring(7)
      setUploadProgress(prev => ({ ...prev, [fileId]: 10 }))

      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${businessId}/${Date.now()}_${fileId}.${fileExt}`

        const { error } = await supabase.storage.from('products').upload(fileName, file, { upsert: false })
        if (error) {
           if (error.message.includes('not found')) {
              await supabase.storage.createBucket('products', { public: true })
              await supabase.storage.from('products').upload(fileName, file)
           } else throw error
        }

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
        newKeys.push(publicUrl)
        setUploadProgress(prev => { const n = {...prev}; delete n[fileId]; return n; })
        setImageKeys([...newKeys]) // trigger update

      } catch (err) {
        toast.error(`Failed to upload ${file.name}`)
        setUploadProgress(prev => { const n = {...prev}; delete n[fileId]; return n; })
      }
    }
  }, [imageKeys, businessId, supabase])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] }, disabled: imageKeys.length >= 8
  })

  const handleRemoveImage = (index: number) => {
    const newKeys = [...imageKeys]
    newKeys.splice(index, 1)
    setImageKeys(newKeys)
  }

  // Generate AI
  const handleGenerateAI = async () => {
    if (!formData.name) {
       toast.error('Please enter a product name first')
       return
    }
    setIsGeneratingAI(true)
    try {
       // Mocking the AI call timeout
       await new Promise(r => setTimeout(r, 2000))
       const mocked = `<h2>Overview</h2><p>Introducing the <strong>${formData.name}</strong>, expertly crafted for quality and reliability. Perfect for daily use across Nepal.</p><h3>Key Features</h3><ul><li>Premium durable materials</li><li>100% genuine and verified</li><li>Easy to use mechanics</li></ul>`
       setFormData(prev => ({ ...prev, description: mocked }))
       toast.success("AI description generated!")
    } catch {
       toast.error("AI generation failed.")
    } finally {
       setIsGeneratingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent, statusOverride?: string) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (!formData.price) throw new Error("Price is required")
      
      const payload = {
        business_id: businessId,
        name: formData.name,
        name_np: formData.name_np,
        slug: formData.slug,
        category_id: formData.category_id,
        description: formData.description,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : null,
        stock_quantity: Number(formData.stock_quantity),
        low_stock_threshold: Number(formData.low_stock_threshold),
        sku: formData.sku,
        status: statusOverride || formData.status,
        image_keys: imageKeys,
        cod_available: formData.cod_available,
        esewa_available: formData.esewa_available,
        khalti_available: formData.khalti_available,
        pickup_available: formData.pickup_available
      }

      if (isEditing) {
        const { error } = await supabase.from('products').update(payload).eq('id', initialData.id)
        if (error) throw error
        toast.success("Product updated!")
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        localStorage.removeItem('draft_product')
        toast.success("Product published!")
      }

      router.push('/dashboard/products')

    } catch (err: any) {
      toast.error(err.message || "Failed to save product")
    } finally {
      setIsSaving(false)
    }
  }

  const calculateDiscount = () => {
    if (!formData.price || !formData.discount_price) return null
    const p = Number(formData.price)
    const d = Number(formData.discount_price)
    if (d >= p) return null
    return Math.round(((p - d) / p) * 100)
  }
  const discountPercent = calculateDiscount()

  // --- UI Components ---
  const InputGroup = ({ label, children, description }: any) => (
    <div className="mb-6">
      <label className="block text-sm font-bold text-gray-900 mb-1.5">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
      {children}
    </div>
  )

  const CheckOption = ({ label, checked, onChange }: any) => (
    <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
      <span className="font-bold text-gray-900 flex items-center gap-1.5">{label}</span>
    </label>
  )

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white"><ArrowLeft className="w-5 h-5"/></button>
             <div>
               <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
               <div className="flex gap-2 text-sm text-gray-500 font-medium">Dashboard / Products / {isEditing ? 'Edit' : 'New'}</div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button onClick={(e) => handleSubmit(e, 'draft')} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50">
               Save Draft
             </button>
             <button onClick={(e) => handleSubmit(e, 'active')} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center justify-center min-w-[120px]">
               {isSaving ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/> : 'Publish Item'}
             </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
               <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Basic Information</h2>
               
               <InputGroup label="Product Name (English) *">
                 <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
               </InputGroup>

               <div className="grid sm:grid-cols-2 gap-6">
                 <InputGroup label="Product Name (Nepali, Optional)">
                   <input type="text" value={formData.name_np} onChange={e=>setFormData({...formData, name_np: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="नेपालीमा नाम" />
                 </InputGroup>

                 <InputGroup label="Product Slug (URL)">
                   <input type="text" value={formData.slug} onChange={e=>setFormData({...formData, slug: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-gray-500" />
                 </InputGroup>
               </div>

               <InputGroup label="Category *">
                 <select required value={formData.category_id} onChange={e=>setFormData({...formData, category_id: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none">
                   <option value="" disabled>Select a category</option>
                   {categories.map((c:any) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                 </select>
               </InputGroup>

               <div className="mb-6">
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-sm font-bold text-gray-900">Description</label>
                    <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                      {isGeneratingAI ? <span className="animate-spin w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full"/> : <Wand2 className="w-3.5 h-3.5"/>} AI Writer
                    </button>
                  </div>
                  <RichTextEditor value={formData.description} onChange={val => setFormData({...formData, description: val})} />
               </div>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
               <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                 <h2 className="text-lg font-bold text-gray-900">Media Library</h2>
                 <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{imageKeys.length}/8 Images</span>
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                 {imageKeys.map((url, i) => (
                   <div key={url} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${i===0 ? 'border-blue-500 shadow-sm' : 'border-gray-200'} group`}>
                      <img src={url} className="w-full h-full object-cover" />
                      {i === 0 && <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">COVER</span>}
                      <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition shadow">
                        <X className="w-4 h-4"/>
                      </button>
                   </div>
                 ))}

                 {/* Uploading placeholders */}
                 {Object.keys(uploadProgress).map(id => (
                   <div key={id} className="relative aspect-square rounded-xl border border-gray-200 bg-gray-50 flex flex-col items-center justify-center p-4">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden"><div className="bg-blue-500 h-1.5" style={{width:`${uploadProgress[id]}%`}}></div></div>
                      <span className="text-xs text-gray-400 font-bold">Uploading...</span>
                   </div>
                 ))}

                 {imageKeys.length < 8 && (
                   <div {...getRootProps()} className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
                      <input {...getInputProps()} />
                      <UploadCloud className="w-6 h-6 text-gray-400 mb-2"/>
                      <span className="text-xs font-bold text-gray-500 px-4 text-center">Add Image</span>
                   </div>
                 )}
               </div>
               <p className="text-xs text-gray-500 text-center font-medium">Drag images to reorder (Feature coming soon). The first image will be used as the product cover.</p>
            </div>

          </div>

          {/* Right Column (Pricing, Inventory, Options) */}
          <div className="lg:col-span-1 space-y-6">
             
             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Pricing</h2>
               
               <InputGroup label="Compare at Price (Original)">
                 <div className="relative">
                   <span className="absolute left-4 top-3.5 text-gray-500 font-bold">₨</span>
                   <input type="number" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
               </InputGroup>

               <InputGroup label="Sale Price (Current)">
                 <div className="relative">
                   <span className="absolute left-4 top-3.5 text-blue-600 font-bold">₨</span>
                   <input required type="number" value={formData.discount_price} onChange={e=>setFormData({...formData, discount_price: e.target.value})} className="w-full bg-blue-50/50 border border-blue-200 rounded-xl pl-9 pr-4 py-3 font-extrabold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
               </InputGroup>

               {discountPercent && discountPercent > 0 && (
                 <div className="bg-green-50 text-green-700 font-bold px-4 py-2 rounded-lg text-sm flex justify-between items-center shadow-sm">
                   Preview Discount Badge
                   <span className="bg-green-600 text-white px-2 py-0.5 rounded text-xs leading-tight">{discountPercent}% OFF</span>
                 </div>
               )}
             </div>

             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Inventory</h2>
               
               <div className="grid grid-cols-2 gap-4">
                 <InputGroup label="Stock Qty">
                   <input required type="number" value={formData.stock_quantity} onChange={e=>setFormData({...formData, stock_quantity: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-center" />
                 </InputGroup>

                 <InputGroup label="Low Alert">
                   <input required type="number" value={formData.low_stock_threshold} onChange={e=>setFormData({...formData, low_stock_threshold: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-center" />
                 </InputGroup>
               </div>

               <InputGroup label="SKU (Barcode)">
                 <input type="text" value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. SHIRT-BL-M" />
               </InputGroup>
             </div>

             <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
               <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Delivery Options</h2>
               <div className="space-y-3">
                 <CheckOption label="Cash on Delivery" checked={formData.cod_available} onChange={(e:any) => setFormData({...formData, cod_available: e.target.checked})} />
                 <CheckOption label="Pay via eSewa" checked={formData.esewa_available} onChange={(e:any) => setFormData({...formData, esewa_available: e.target.checked})} />
                 <CheckOption label="Pay via Khalti" checked={formData.khalti_available} onChange={(e:any) => setFormData({...formData, khalti_available: e.target.checked})} />
                 <CheckOption label="Store Pickup" checked={formData.pickup_available} onChange={(e:any) => setFormData({...formData, pickup_available: e.target.checked})} />
               </div>
             </div>

          </div>

        </div>
      </div>
    </>
  )
}
