'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Tag, Clock, CheckCircle2, AlertCircle, Edit, Trash2, StopCircle } from 'lucide-react'
import StatsCard from '@/components/dashboard/StatsCard'
import { formatDistanceToNow, format } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function OffersClient({ initialOffers }: any) {
  const supabase = createClient()
  const [offers, setOffers] = useState(initialOffers)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active')

  // Derived Stats
  const stats = useMemo(() => {
    let totalGrabbed = 0
    let potentialRevenue = 0
    
    offers.forEach((o:any) => {
      totalGrabbed += (o.grabbed_count || 0)
      potentialRevenue += (o.grabbed_count || 0) * (o.offer_price || 0)
    })

    const now = new Date()
    const active = offers.filter((o:any) => new Date(o.ends_at) > now && o.status !== 'ended')
    const ended = offers.filter((o:any) => new Date(o.ends_at) <= now || o.status === 'ended')

    return { totalGrabbed, potentialRevenue, active, ended }
  }, [offers])

  const displayOffers = activeTab === 'active' ? stats.active : stats.ended

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer permanently?")) return
    setLoadingAction(id)
    try {
      const { error } = await supabase.from('offers').delete().eq('id', id)
      if (error) throw error
      setOffers(offers.filter((o:any) => o.id !== id))
      toast.success("Offer deleted")
    } catch {
      toast.error("Failed to delete offer")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleEndEarly = async (id: string) => {
    if (!confirm("End this offer immediately?")) return
    setLoadingAction(id)
    try {
      const { error } = await supabase.from('offers').update({ status: 'ended', ends_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      setOffers(offers.map((o:any) => o.id === id ? { ...o, status: 'ended', ends_at: new Date().toISOString() } : o))
      toast.success("Offer ended")
    } catch {
      toast.error("Failed to end offer")
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Deals & Offers</h1>
            <p className="text-gray-500 mt-1">Create flash sales and promotions to drive traffic.</p>
          </div>
          <Link href="/dashboard/offers/new" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm whitespace-nowrap">
            <Plus className="w-5 h-5 mr-2" /> Create Offer
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Active Deals" value={stats.active.length} icon={<Tag className="w-6 h-6" />} color="red" />
          <StatsCard title="Total Grabs" value={stats.totalGrabbed} icon={<CheckCircle2 className="w-6 h-6" />} color="blue" />
          <StatsCard title="Revenue Generated" value={`₨ ${stats.potentialRevenue.toLocaleString()}`} icon={<Clock className="w-6 h-6" />} color="green" trend="up" trendValue="Valid Sales" />
          <StatsCard title="Ended Offers" value={stats.ended.length} icon={<AlertCircle className="w-6 h-6" />} color="gray" />
        </div>

        {/* List Box */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
          
          <div className="px-6 pt-6 border-b border-gray-100 flex gap-6">
             <button onClick={()=>setActiveTab('active')} className={`pb-4 font-bold text-sm tracking-wide transition border-b-2 ${activeTab === 'active' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
               Active Offers <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'active' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{stats.active.length}</span>
             </button>
             <button onClick={()=>setActiveTab('ended')} className={`pb-4 font-bold text-sm tracking-wide transition border-b-2 ${activeTab === 'ended' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
               Ended Archive <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'ended' ? 'bg-gray-200 text-gray-900' : 'bg-gray-100 text-gray-600'}`}>{stats.ended.length}</span>
             </button>
          </div>

          <div className="p-6">
            {displayOffers.length === 0 ? (
               <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                 <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                 <h3 className="text-lg font-bold text-gray-900">No {activeTab} offers</h3>
                 <p className="text-gray-500 mb-6">Create a new flash deal to attract more customers.</p>
                 <Link href="/dashboard/offers/new" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 px-5 py-2 rounded-lg font-bold transition inline-flex items-center">
                   <Plus className="w-4 h-4 mr-2" /> Create Offer
                 </Link>
               </div>
            ) : (
               <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {displayOffers.map((o:any) => (
                   <div key={o.id} className={`bg-white border rounded-2xl overflow-hidden transition group ${activeTab === 'ended' ? 'border-gray-200 opacity-75' : 'border-red-100 shadow-sm hover:shadow-md hover:border-red-200'}`}>
                      <div className="h-32 bg-gray-100 relative">
                        {o.banner_url ? <img src={o.banner_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-red-900/10 flex items-center justify-center"><Tag className="w-8 h-8 text-red-900/20"/></div>}
                        {o.discount_percent && <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">{o.discount_percent}% OFF</div>}
                      </div>

                      <div className="p-5">
                         <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{o.title}</h3>
                         
                         <div className="flex items-end gap-2 mb-4">
                           <span className="font-extrabold text-red-600 text-xl">₨ {o.offer_price?.toLocaleString()}</span>
                           <span className="text-sm font-bold text-gray-400 line-through mb-0.5">₨ {o.original_price?.toLocaleString()}</span>
                         </div>
                         
                         <div className="space-y-2 mb-6">
                           <div className="flex justify-between text-xs font-bold text-gray-500">
                             <span>Grabbed</span>
                             <span>{o.grabbed_count || 0} / {o.max_quantity || '∞'}</span>
                           </div>
                           <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                             <div className="h-full bg-red-500 transition-all" style={{width: o.max_quantity ? `${Math.min(((o.grabbed_count||0)/o.max_quantity)*100, 100)}%` : '0%'}}></div>
                           </div>
                           <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5 mt-2">
                             <Clock className="w-3.5 h-3.5"/> 
                             {activeTab === 'active' ? `Ends in ${formatDistanceToNow(new Date(o.ends_at))}` : `Ended on ${format(new Date(o.ends_at), 'MMM d, yyyy')}`}
                           </p>
                         </div>

                         <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                            {activeTab === 'active' && (
                              <button onClick={() => handleEndEarly(o.id)} disabled={loadingAction===o.id} className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition">
                                <StopCircle className="w-4 h-4"/> End Early
                              </button>
                            )}
                            <button onClick={() => handleDelete(o.id)} disabled={loadingAction===o.id} className="w-10 h-[36px] bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-400 rounded-lg flex items-center justify-center transition ml-auto">
                              <Trash2 className="w-4 h-4"/>
                            </button>
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
