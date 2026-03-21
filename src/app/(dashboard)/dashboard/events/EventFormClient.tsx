'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import RichTextEditor from '@/components/dashboard/RichTextEditor'
import ImageUpload from '@/components/dashboard/ImageUpload'
import { ArrowLeft, Save, Plus, X, MapPin, Globe } from 'lucide-react'
import dynamic from 'next/dynamic'

const LocationPickerMap = dynamic(() => import('@/components/dashboard/LocationPickerMap'), {
  ssr: false, loading: () => <div className="h-[250px] bg-gray-100 animate-pulse rounded-xl"></div>
})

export default function EventFormClient({ business, districts }: any) {
  const supabase = createClient()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    event_type: 'Conference',
    description: '',
    is_online: false,
    online_link: '',
    venue_name: '',
    address: '',
    district: '',
    latitude: 27.7172,
    longitude: 85.3240,
    date_time: '',
    end_time: '',
    registration_deadline: '',
    is_free: true,
    price: '',
    total_seats: '', // empty = unlimited
    banner_url: ''
  })

  // Speakers
  const [speakers, setSpeakers] = useState<{name: string, role: string}[]>([])

  const addSpeaker = () => setSpeakers([...speakers, { name: '', role: '' }])
  const removeSpeaker = (idx: number) => setSpeakers(speakers.filter((_, i) => i !== idx))
  const updateSpeaker = (idx: number, field: string, value: string) => {
    const updated = [...speakers]
    updated[idx] = { ...updated[idx], [field]: value }
    setSpeakers(updated)
  }

  const handleSubmit = async (e: React.FormEvent, status: string = 'published') => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (!formData.title || !formData.date_time || !formData.end_time) {
        throw new Error("Title and dates are required")
      }

      if (formData.is_online && !formData.online_link) {
        throw new Error("Online meeting link is required for online events")
      }
      if (!formData.is_online && (!formData.venue_name || !formData.address || !formData.district)) {
        throw new Error("Venue name, address and district are required for physical events")
      }

      const payload = {
        business_id: business.id,
        title: formData.title,
        description: formData.description,
        is_online: formData.is_online,
        location: formData.is_online ? 'Online' : `${formData.venue_name}, ${formData.address}`,
        online_link: formData.is_online ? formData.online_link : null,
        district: formData.is_online ? null : formData.district,
        latitude: formData.is_online ? null : formData.latitude,
        longitude: formData.is_online ? null : formData.longitude,
        date_time: new Date(formData.date_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        registration_deadline: formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null,
        is_free: formData.is_free,
        price: formData.is_free ? 0 : Number(formData.price),
        total_seats: formData.total_seats ? Number(formData.total_seats) : null,
        banner_url: formData.banner_url,
        speakers: speakers, // JSONB structure
        status: status
      }

      const { error } = await supabase.from('events').insert(payload)
      if (error) throw error
      
      toast.success("Event created successfully!")
      router.push('/dashboard/events')

    } catch (err: any) {
      toast.error(err.message || "Failed to create event")
    } finally {
      setIsSaving(false)
    }
  }

  const InputGroup = ({ label, children, description }: any) => (
    <div className="mb-5">
      <label className="block text-sm font-bold text-gray-900 mb-1.5">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-3">{description}</p>}
      {children}
    </div>
  )

  return (
    <>
      <Toaster position="top-right" />
      <div className="max-w-4xl mx-auto pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
             <button onClick={() => router.back()} className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 bg-white"><ArrowLeft className="w-5 h-5"/></button>
             <div>
               <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Host New Event</h1>
               <div className="flex gap-2 text-sm text-gray-500 font-medium">Dashboard / Events / New</div>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
             <button onClick={e => handleSubmit(e, 'draft')} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
               Save Draft
             </button>
             <button onClick={e => handleSubmit(e, 'published')} disabled={isSaving} className="flex-1 sm:flex-none px-6 py-2.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex items-center justify-center min-w-[140px] shadow-sm">
               {isSaving ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/> : <><Save className="w-4 h-4 mr-2"/> Publish Event</>}
             </button>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
             
             <InputGroup label="Event Title *">
               <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Masterclass on Digital Marketing" />
             </InputGroup>

             <div className="grid sm:grid-cols-2 gap-6 mb-6">
               <InputGroup label="Event Type">
                 <select value={formData.event_type} onChange={e=>setFormData({...formData, event_type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none">
                   <option value="Conference">Conference / Summit</option>
                   <option value="Workshop">Workshop / Masterclass</option>
                   <option value="Exhibition">Exhibition / Expo</option>
                   <option value="Meetup">Meetup / Networking</option>
                   <option value="Sale">Clearance / Sale Event</option>
                   <option value="Music">Music / Concert</option>
                 </select>
               </InputGroup>
               <InputGroup label="Banner Image (16:9)">
                 <ImageUpload 
                   aspectRatio="wide" bucket="events" folder={business.id} currentImageUrl={formData.banner_url}
                   onUploadSuccess={url => setFormData({...formData, banner_url: url})} 
                 />
               </InputGroup>
             </div>

             <div className="mb-8">
               <label className="block text-sm font-bold text-gray-900 mb-1.5">Description & details</label>
               <RichTextEditor value={formData.description} onChange={val => setFormData({...formData, description: val})} placeholder="What is this event about?" />
             </div>

             <div className="pt-6 border-t border-gray-100">
               <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-max border border-gray-200">
                 <button type="button" onClick={()=>setFormData({...formData, is_online: false})} className={`px-5 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${!formData.is_online ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                   <MapPin className="w-4 h-4"/> Physical Venue
                 </button>
                 <button type="button" onClick={()=>setFormData({...formData, is_online: true})} className={`px-5 py-2 rounded-lg font-bold text-sm transition flex items-center gap-2 ${formData.is_online ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                   <Globe className="w-4 h-4"/> Online (Zoom/Meet)
                 </button>
               </div>

               {formData.is_online ? (
                 <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 pb-2">
                   <InputGroup label="Meeting Link (Zoom, Google Meet, Teams, etc) *">
                     <input type="url" value={formData.online_link} onChange={e=>setFormData({...formData, online_link: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="https://zoom.us/j/123456789" />
                   </InputGroup>
                   <p className="text-sm font-bold text-blue-800 -mt-2">This link will only be visible to registered attendees.</p>
                 </div>
               ) : (
                 <div className="space-y-6">
                   <div className="grid sm:grid-cols-2 gap-6">
                     <InputGroup label="Venue Name *">
                       <input type="text" value={formData.venue_name} onChange={e=>setFormData({...formData, venue_name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Soaltee Hotel" />
                     </InputGroup>
                     <InputGroup label="Address *">
                       <input type="text" value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Tahachal, Kathmandu" />
                     </InputGroup>
                   </div>
                   <InputGroup label="District *">
                     <select value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-blue-500 outline-none max-w-sm">
                       <option value="">Select District</option>
                       {districts.map((d:any) => <option key={d.id} value={d.name_en}>{d.name_en}</option>)}
                     </select>
                   </InputGroup>
                   <InputGroup label="Pin Drop (Optional Map Location)">
                     <div className="border border-gray-200 p-1 rounded-2xl">
                       <LocationPickerMap position={[formData.latitude, formData.longitude]} onChange={(lat,lng)=>setFormData({...formData, latitude: lat, longitude: lng})} />
                     </div>
                   </InputGroup>
                 </div>
               )}
             </div>

             <div className="pt-8 mt-8 border-t border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-6">Schedule</h3>
               <div className="grid sm:grid-cols-3 gap-6">
                 <InputGroup label="Starts At *">
                   <input required type="datetime-local" value={formData.date_time} onChange={e=>setFormData({...formData, date_time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-orange-500 outline-none" />
                 </InputGroup>
                 <InputGroup label="Ends At *">
                   <input required type="datetime-local" value={formData.end_time} onChange={e=>setFormData({...formData, end_time: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-orange-500 outline-none" />
                 </InputGroup>
                 <InputGroup label="RSVP Deadline (Optional)">
                   <input type="datetime-local" value={formData.registration_deadline} onChange={e=>setFormData({...formData, registration_deadline: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium focus:ring-2 focus:ring-orange-500 outline-none" />
                 </InputGroup>
               </div>
             </div>

             <div className="pt-8 mt-2 border-t border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-6">Ticketing & Capacity</h3>
               
               <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-max border border-gray-200">
                 <button type="button" onClick={()=>setFormData({...formData, is_free: true})} className={`px-5 py-2 rounded-lg font-bold text-sm transition ${formData.is_free ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                   Free Entry
                 </button>
                 <button type="button" onClick={()=>setFormData({...formData, is_free: false})} className={`px-5 py-2 rounded-lg font-bold text-sm transition ${!formData.is_free ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                   Paid Tickets
                 </button>
               </div>

               <div className="grid sm:grid-cols-2 gap-6 items-end">
                 {!formData.is_free && (
                   <InputGroup label="Ticket Price (NPR) *">
                     <div className="relative">
                       <span className="absolute left-4 top-3.5 text-blue-600 font-bold">₨</span>
                       <input type="number" required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} className="w-full bg-blue-50/50 border border-blue-200 rounded-xl pl-9 pr-4 py-3 font-extrabold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                     </div>
                   </InputGroup>
                 )}
                 
                 <InputGroup label="Total Capacity" description="Leave blank for unlimited attendees.">
                   <input type="number" value={formData.total_seats} onChange={e=>setFormData({...formData, total_seats: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. 100" />
                 </InputGroup>
               </div>
             </div>

             <div className="pt-8 mt-2 border-t border-gray-100">
               <div className="flex justify-between items-end mb-6">
                 <h3 className="text-lg font-bold text-gray-900">Speakers / Special Guests</h3>
                 <button type="button" onClick={addSpeaker} className="text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition">+ Add Speaker</button>
               </div>

               <div className="space-y-4">
                 {speakers.map((s, idx) => (
                   <div key={idx} className="flex gap-4 items-center">
                     <input type="text" value={s.name} onChange={e=>updateSpeaker(idx, 'name', e.target.value)} placeholder="Speaker Name" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                     <input type="text" value={s.role} onChange={e=>updateSpeaker(idx, 'role', e.target.value)} placeholder="Role / Company" className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500" />
                     <button type="button" onClick={()=>removeSpeaker(idx)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition"><X className="w-5 h-5"/></button>
                   </div>
                 ))}
                 {speakers.length === 0 && <p className="text-sm text-gray-500 italic pb-2 block">No speakers added yet.</p>}
               </div>
             </div>

           </div>
        </div>
      </div>
    </>
  )
}
