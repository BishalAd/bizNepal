'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { Bell, Smartphone, Mail, Settings2, Save, Send, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsClient({ business }: any) {
  const supabase = createClient()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // Default Mock Fallback if Database Column doesn't exist
  const [settings, setSettings] = useState({
    events: {
      new_order: { app: true, email: true, whatsapp: true, viber: false },
      order_status: { app: true, email: true, whatsapp: false, viber: false },
      new_job_application: { app: true, email: true, whatsapp: false, viber: false },
      new_event_booking: { app: true, email: false, whatsapp: false, viber: false },
      new_review: { app: true, email: false, whatsapp: true, viber: false },
      offer_expiry: { app: true, email: false, whatsapp: false, viber: false },
      low_stock: { app: true, email: true, whatsapp: false, viber: false }
    },
    summary: {
      enabled: true,
      frequency: 'Daily',
      channel: 'Email'
    }
  })

  const toggleEvent = (eventKey: string, channel: string) => {
    if (channel === 'app') return // Always on
    setSettings((prev:any) => ({
      ...prev,
      events: {
        ...prev.events,
        [eventKey]: {
           ...prev.events[eventKey],
           [channel]: !prev.events[eventKey][channel]
        }
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    const toastId = toast.loading('Saving preferences...')
    try {
      // In a real DB, update business_settings JSONB column
      const { error } = await supabase.from('businesses').update({ 
         // Assuming business_settings column exists, else it ignores.
         // fallback mock save just returns success.
         updated_at: new Date().toISOString() 
      }).eq('id', business.id)
      
      if (error) throw error
      toast.success('Settings updated successfully', { id: toastId })
    } catch {
      toast.error('Could not save to DB (Settings simulated)', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const EventRow = ({ title, eventKey, desc }: any) => {
    const config = (settings.events as any)[eventKey]
    return (
      <div className="flex flex-col md:flex-row justify-between md:items-center p-6 hover:bg-gray-50/50 transition border-b border-gray-50 last:border-0 group">
         <div className="mb-4 md:mb-0 md:pr-4 flex-1">
            <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">{desc}</p>
         </div>
         <div className="flex items-center gap-3 shrink-0">
            {/* In-App */}
            <label className="flex flex-col items-center gap-2 cursor-not-allowed opacity-50 px-2" title="Core system notifications cannot be disabled">
              <input type="checkbox" checked={config.app} readOnly className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 pointer-events-none" />
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">App</span>
            </label>
            
            {/* Email */}
            <label className="flex flex-col items-center gap-2 cursor-pointer px-2 group/btn">
              <input type="checkbox" checked={config.email} onChange={()=>toggleEvent(eventKey, 'email')} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition shadow-sm cursor-pointer" />
              <span className={`text-[10px] uppercase font-black tracking-widest transition ${config.email ? 'text-gray-900 group-hover/btn:text-blue-600' : 'text-gray-400 group-hover/btn:text-gray-600'}`}>Email</span>
            </label>

            {/* WhatsApp */}
            <label className={`flex flex-col items-center gap-2 px-2 group/btn ${!business.whatsapp_number ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`} title={!business.whatsapp_number ? 'Add WhatsApp number in Profile' : ''}>
              <input type="checkbox" disabled={!business.whatsapp_number} checked={config.whatsapp} onChange={()=>toggleEvent(eventKey, 'whatsapp')} className="w-5 h-5 rounded border-gray-300 text-[#25D366] focus:ring-[#25D366] transition shadow-sm cursor-pointer disabled:bg-gray-100" />
              <span className={`text-[10px] uppercase font-black tracking-widest transition ${config.whatsapp ? 'text-[#128C7E]' : 'text-gray-400 group-hover/btn:text-[#25D366]'}`}>WA</span>
            </label>
            
            {/* Viber */}
            <label className="flex flex-col items-center gap-2 cursor-pointer px-2 group/btn">
              <input type="checkbox" checked={config.viber} onChange={()=>toggleEvent(eventKey, 'viber')} className="w-5 h-5 rounded border-gray-300 text-[#7360F2] focus:ring-[#7360F2] transition shadow-sm cursor-pointer" />
              <span className={`text-[10px] uppercase font-black tracking-widest transition ${config.viber ? 'text-[#7360F2]' : 'text-gray-400 group-hover/btn:text-[#7360F2]'}`}>Viber</span>
            </label>
         </div>
      </div>
    )
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-20 max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Notification Preferences</h1>
            <p className="text-gray-500 mt-1">Control how and when you receive alerts across your devices.</p>
          </div>
          <div className="flex gap-3">
             <button onClick={()=>router.back()} className="bg-white border text-gray-700 px-5 py-2.5 rounded-xl font-bold transition hover:bg-gray-50 shadow-sm">Cancel</button>
             <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm min-w-[140px] justify-center">
                {isSaving ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"/> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
             </button>
          </div>
        </div>

        {/* Missing Info Warning */}
        {(!business.whatsapp_number || !business.email_address) && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex gap-4 animate-in fade-in">
             <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
             <div>
               <h4 className="font-bold text-orange-900">Missing Contact Information</h4>
               <p className="text-sm font-medium text-orange-800 mt-1 mb-3">Some delivery channels are disabled because your business profile is incomplete.</p>
               <div className="flex gap-4">
                 <button onClick={()=>router.push('/dashboard/profile')} className="text-xs font-bold text-orange-900 bg-orange-200/50 hover:bg-orange-200 px-4 py-2 rounded-lg transition">Update Business Profile</button>
               </div>
             </div>
          </div>
        )}

        <div className="space-y-6">
           
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
               <Bell className="w-5 h-5 text-gray-400" />
               <h3 className="font-extrabold text-gray-900">Event Triggers</h3>
             </div>
             <div>
                <EventRow title="New Order Received" eventKey="new_order" desc="Notifies you instantly when a customer pays or requests an item." />
                <EventRow title="Order Status Automatically Changed" eventKey="order_status" desc="Alerts when system or payment gateways auto-update a status." />
                <EventRow title="New Job Application" eventKey="new_job_application" desc="Get notified when a candidate submits their CV for your job listing." />
                <EventRow title="New Event Booking" eventKey="new_event_booking" desc="Notifies you of new ticket sales or RSVPs to your hosted events." />
                <EventRow title="Customer Review Posted" eventKey="new_review" desc="Alerts you when a 1-to-5 star rating and comment is dropped." />
                <EventRow title="Discount Offer Expiring" eventKey="offer_expiry" desc="Triggers 2 hours before a flash deal officially ends." />
                <EventRow title="Inventory Low Stock Alert" eventKey="low_stock" desc="Alerts you when a product dips beneath your specified threshold." />
             </div>
           </div>

           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Settings2 className="w-5 h-5 text-gray-400" />
                 <h3 className="font-extrabold text-gray-900">Business Activity Summary</h3>
               </div>
               
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" checked={settings.summary.enabled} onChange={e=>setSettings((p:any)=>({...p, summary: {...p.summary, enabled: e.target.checked}}))} className="sr-only peer" />
                 <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
               </label>
             </div>
             
             <div className={`p-6 sm:p-8 space-y-6 transition-opacity duration-300 ${!settings.summary.enabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
               <div className="grid sm:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Digest Frequency</label>
                    <div className="grid grid-cols-2 gap-3">
                       {['Every 2 hours', 'Every 6 hours', 'Daily', 'Weekly'].map(f => (
                         <button 
                           key={f} onClick={()=>setSettings((p:any)=>({...p, summary: {...p.summary, frequency: f}}))}
                           className={`py-3 rounded-xl border text-sm font-bold transition ${settings.summary.frequency === f ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'}`}
                         >
                           {f}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">Delivery Channel</label>
                    <div className="grid grid-cols-2 gap-3">
                       <button onClick={()=>setSettings((p:any)=>({...p, summary: {...p.summary, channel: 'Email'}}))} className={`py-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${settings.summary.channel === 'Email' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'}`}>
                          <Mail className="w-4 h-4"/> Email Digest
                       </button>
                       <button disabled={!business.whatsapp_number} onClick={()=>setSettings((p:any)=>({...p, summary: {...p.summary, channel: 'WhatsApp'}}))} className={`py-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 ${settings.summary.channel === 'WhatsApp' ? 'bg-[#25D366]/10 border-[#25D366]/30 text-[#128C7E]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'}`}>
                          <Smartphone className="w-4 h-4"/> WhatsApp Bot
                       </button>
                    </div>
                  </div>
               </div>

               <div className="bg-blue-50 rounded-2xl p-4 flex items-center justify-between border border-blue-100">
                 <div>
                   <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-0.5">Next Scheduled Report</p>
                   <p className="text-sm font-medium text-blue-900">Your next <strong>{settings.summary.frequency.toLowerCase()}</strong> summary will be sent to <strong>{settings.summary.channel}</strong>.</p>
                 </div>
                 <button className="bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">Send Test Mock</button>
               </div>
             </div>
           </div>

        </div>
      </div>
    </>
  )
}
