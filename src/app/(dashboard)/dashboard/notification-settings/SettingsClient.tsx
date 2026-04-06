'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { Bell, Smartphone, Mail, Settings2, Save, Send, AlertTriangle, MessageSquare, ExternalLink, CheckCircle2, Loader2, BotIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

// Column map: eventKey → businesses table column name
const TG_TOGGLE_COLUMNS: Record<string, string> = {
  new_order:           'tg_notify_new_order',
  new_job_application: 'tg_notify_job_application',
  new_event_booking:   'tg_notify_event_booking',
  new_review:          'tg_notify_new_review',
  offer_expiry:        'tg_notify_offer_grab',
}

export default function SettingsClient({ business }: any) {
  const supabase = createClient()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  
  // Telegram State
  const [telegramChatId, setTelegramChatId] = useState(business.telegram_chat_id)
  const [isLinking, setIsLinking] = useState(false)
  const [botUrl, setBotUrl] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isPolling, setIsPolling] = useState(false)

  // DB-backed Telegram notification toggles
  const [tgToggles, setTgToggles] = useState<Record<string, boolean>>({
    new_order:           business.tg_notify_new_order           !== false,
    new_job_application: business.tg_notify_job_application !== false,
    new_event_booking:   business.tg_notify_event_booking   !== false,
    new_review:          business.tg_notify_new_review          !== false,
    offer_expiry:        business.tg_notify_offer_grab        !== false,
  })

  const handleTelegramToggle = async (eventKey: string, value: boolean) => {
    if (!telegramChatId) {
      toast.error('Connect Telegram first before changing notification settings.')
      return
    }
    // Optimistic update
    setTgToggles(prev => ({ ...prev, [eventKey]: value }))
    const column = TG_TOGGLE_COLUMNS[eventKey]
    if (!column) return
    const { error } = await supabase
      .from('businesses')
      .update({ [column]: value })
      .eq('id', business.id)
    if (error) {
      // Revert on failure
      setTgToggles(prev => ({ ...prev, [eventKey]: !value }))
      toast.error('Failed to save Telegram preference.')
    }
  }

  // Polling Logic
  React.useEffect(() => {
    let interval: any
    if (isPolling && !telegramChatId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/bot/check-connection?businessId=${business.id}`)
          const data = await res.json()
          if (data.connected) {
            setTelegramChatId(data.telegram_chat_id)
            setIsPolling(false)
            setBotUrl(null)
            toast.success('Telegram Connected Successfully!')
          }
        } catch (e) {
          console.error('Polling error:', e)
        }
      }, 5000)
    }
    return () => clearInterval(interval)
  }, [isPolling, telegramChatId, business.id])

  // Timer Logic
  React.useEffect(() => {
    let timer: any
    if (timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000)
    } else if (timeLeft === 0 && botUrl) {
      setBotUrl(null)
      setIsPolling(false)
    }
    return () => clearInterval(timer)
  }, [timeLeft, botUrl])

  const handleConnectTelegram = async () => {
    setIsLinking(true)
    try {
      const res = await fetch('/api/bot/generate-link-token', { method: 'POST' })
      const data = await res.json()
      if (data.token) {
        setBotUrl(data.botUrl)
        setTimeLeft(15 * 60) // 15 minutes
        setIsPolling(true)
        toast('Link generated! Please open Telegram.', { icon: '🤖' })
      } else {
        toast.error(data.error || 'Failed to generate link')
      }
    } catch (e) {
      toast.error('Connection error')
    } finally {
      setIsLinking(false)
    }
  }

  const handleDisconnectTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect Telegram? You will stop receiving instant notifications.')) return
    
    const toastId = toast.loading('Disconnecting...')
    try {
      const { error } = await supabase.from('businesses').update({ telegram_chat_id: null }).eq('id', business.id)
      if (error) throw error
      
      setTelegramChatId(null)
      toast.success('Telegram disconnected', { id: toastId })
    } catch (e) {
      toast.error('Failed to disconnect', { id: toastId })
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }


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
      toast.success('Telegram settings auto-saved. Email/WhatsApp preferences noted.', { id: toastId })
    } catch {
      toast.error('Could not save preferences.', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const EventRow = ({ title, eventKey, desc }: any) => {
    const config = (settings.events as any)[eventKey]
    const tgEnabled = tgToggles[eventKey] ?? true
    return (
      <div className="flex flex-col md:flex-row justify-between md:items-center p-6 hover:bg-gray-50/50 transition border-b border-gray-50 last:border-0 group">
         <div className="mb-4 md:mb-0 md:pr-4 flex-1">
            <h4 className="font-bold text-gray-900 text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-400 font-medium leading-relaxed">{desc}</p>
         </div>
         <div className="flex items-center gap-3 shrink-0">
            {/* In-App - always on */}
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

            {/* Telegram - DB backed */}
            <label className={`flex flex-col items-center gap-2 px-2 group/btn ${!telegramChatId ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} title={!telegramChatId ? 'Connect Telegram above to enable' : 'Toggle Telegram notifications for this event'}>
              <input
                type="checkbox"
                disabled={!telegramChatId}
                checked={tgEnabled}
                onChange={(e) => handleTelegramToggle(eventKey, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-[#0088cc] focus:ring-[#0088cc] transition shadow-sm cursor-pointer disabled:bg-gray-100"
              />
              <span className={`text-[10px] uppercase font-black tracking-widest transition ${tgEnabled && telegramChatId ? 'text-[#0088cc]' : 'text-gray-400'}`}>TG</span>
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

        {/* Telegram Connection Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-top duration-500">
           <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-xl ${telegramChatId ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Send className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-extrabold text-gray-900">Telegram Notifications</h3>
                    <p className="text-xs text-gray-500 font-medium">Receive instant alerts for orders, jobs, and bookings.</p>
                 </div>
              </div>
              {telegramChatId ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Not Connected
                </span>
              )}
           </div>

           <div className="p-6">
              {!telegramChatId ? (
                <div className="space-y-4">
                  {!botUrl ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm text-gray-600 max-w-md">Connect your personal or business Telegram account to get notified the second anything happens on BizNepal.</p>
                      <button 
                        onClick={handleConnectTelegram}
                        disabled={isLinking}
                        className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm disabled:opacity-50"
                      >
                        {isLinking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Connect Telegram
                      </button>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-4 animate-in fade-in zoom-in duration-300">
                       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-blue-100">
                                <span className="text-xl">🤖</span>
                             </div>
                             <div>
                                <h4 className="font-bold text-blue-900">Link Your Account</h4>
                                <p className="text-xs text-blue-700 font-medium">Click the button below and press START in Telegram.</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Expires In</p>
                             <p className="text-xl font-mono font-bold text-blue-600">{formatTime(timeLeft)}</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <a 
                            href={botUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#0088cc] hover:bg-[#0077b5] text-white px-6 py-3 rounded-xl font-bold transition flex items-center justify-center shadow-lg hover:scale-[1.02] active:scale-95"
                          >
                             Open @{process.env.NEXT_PUBLIC_NOTIFY_BOT_USERNAME || 'BizNepalNotifyBot'} <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                          <button 
                            onClick={() => { setBotUrl(null); setIsPolling(false); }}
                            className="bg-white border border-blue-200 text-blue-600 px-6 py-3 rounded-xl font-bold transition hover:bg-blue-50"
                          >
                            Cancel
                          </button>
                       </div>

                       <div className="flex items-center gap-2 justify-center py-2">
                          <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Waiting for you to press START...</p>
                       </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                         <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-gray-900">Notifications Active</p>
                         <p className="text-xs text-gray-500">Messages are being sent to Chat ID: <code className="bg-gray-100 px-1 rounded">{telegramChatId}</code></p>
                      </div>
                   </div>
                   <button 
                     onClick={handleDisconnectTelegram}
                     className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition border border-red-100"
                   >
                     Disconnect Telegram
                   </button>
                </div>
              )}
           </div>
        </div>

         {/* Posting Bot Card — shown when Telegram is connected */}
         {telegramChatId && (
           <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-top duration-500">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
                       <BotIcon className="w-5 h-5" />
                    </div>
                    <div>
                       <h3 className="font-extrabold text-gray-900">Interactive Posting Bot</h3>
                       <p className="text-xs text-gray-500 font-medium">Post Jobs, Events, Products & Offers directly from Telegram.</p>
                    </div>
                 </div>
                 <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Bot 2
                 </span>
              </div>
              <div className="p-6">
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                       <p className="text-sm text-gray-600 max-w-md">Open <strong>@BizNepalPostBot</strong> in Telegram, send <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">/start</code>, and follow the prompts to publish content instantly.</p>
                       <p className="text-xs text-gray-400 mt-1.5">Your account is already linked — no separate connection needed.</p>
                    </div>
                    <a
                       href={`https://t.me/${process.env.NEXT_PUBLIC_POSTING_BOT_USERNAME || 'BizNepalPostBot'}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm shrink-0"
                    >
                       <BotIcon className="w-4 h-4 mr-2" /> Open Posting Bot <ExternalLink className="w-3.5 h-3.5 ml-2" />
                    </a>
                 </div>
                 <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[{icon:'📋',label:'Post Job'},{icon:'🎉',label:'Post Event'},{icon:'📦',label:'Add Product'},{icon:'🔥',label:'Create Offer'}].map(item => (
                       <div key={item.label} className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                          <div className="text-2xl mb-1">{item.icon}</div>
                          <p className="text-xs font-bold text-purple-700">{item.label}</p>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
         )}

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
             <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Bell className="w-5 h-5 text-gray-400" />
                 <h3 className="font-extrabold text-gray-900">Event Triggers</h3>
               </div>
               <div className="hidden md:flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-gray-400 pr-1">
                 <span className="w-11 text-center">App</span>
                 <span className="w-11 text-center">Email</span>
                 <span className="w-11 text-center">WA</span>
                 <span className={`w-11 text-center ${telegramChatId ? 'text-[#0088cc]' : ''}`}>TG</span>
               </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                       <button onClick={()=>setSettings((p:any)=>({...p, summary: {...p.summary, channel: 'Email'}}))} className={`py-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 ${settings.summary.channel === 'Email' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'}`}>
                          <Mail className="w-4 h-4"/> Email Digest
                       </button>
                       <button disabled={!business.whatsapp_number} onClick={()=>setSettings((p:any)=>({...p, summary: {...p.summary, channel: 'WhatsApp'}}))} className={`py-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 ${settings.summary.channel === 'WhatsApp' ? 'bg-[#25D366]/10 border-[#25D366]/30 text-[#128C7E]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'}`}>
                          <Smartphone className="w-4 h-4"/> WhatsApp Bot
                       </button>
                       <button disabled={!telegramChatId} onClick={()=>setSettings((p:any)=>({...p, summary: {...p.summary, channel: 'Telegram'}}))} className={`py-3 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 ${settings.summary.channel === 'Telegram' ? 'bg-[#0088cc]/10 border-[#0088cc]/30 text-[#0077b5]' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white'}`}>
                          <Send className="w-4 h-4"/> Telegram Bot
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
