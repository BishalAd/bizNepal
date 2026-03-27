'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, XCircle, Shield, Store, Users, ShoppingBag, 
  CreditCard, AlertTriangle, Search, MoreVertical,
  Plus, Edit, Trash2, LayoutGrid, Star, Ban, Unlock, Settings,
  ChevronRight, BarChart3, Activity, Briefcase, Tag, Filter,
  TrendingUp, Layers, Eye, RefreshCw, X
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { format } from 'date-fns'
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar 
} from 'recharts'

// Global Admin Dashboard Component
export default function AdminClient({ 
  stats, 
  allBusinesses: initialBusinesses, 
  allUsers: initialUsers, 
  categories: initialCategories,
  flaggedReviews,
  moderation
}: any) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<string>('Overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  // Data States
  const [businesses, setBusinesses] = useState(initialBusinesses || [])
  const [users, setUsers] = useState(initialUsers || [])
  const [categories, setCategories] = useState(initialCategories || [])
  const [pendingProds, setPendingProds] = useState(moderation?.products || [])
  const [pendingJobs, setPendingJobs] = useState(moderation?.jobs || [])
  const [pendingOffers, setPendingOffers] = useState(moderation?.offers || [])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // -- HANDLERS --
  const handleVerify = async (table: string, id: string, approve: boolean) => {
    setIsUpdating(id)
    try {
      const { error } = await supabase.from(table).update({ is_verified: approve }).eq('id', id)
      if (error) throw error
      
      // Update local state based on table
      if (table === 'businesses') setBusinesses((prev: any) => prev.map((b: any) => b.id === id ? { ...b, is_verified: approve } : b))
      if (table === 'products') setPendingProds((prev: any) => prev.filter((p: any) => p.id !== id))
      if (table === 'jobs') setPendingJobs((prev: any) => prev.filter((j: any) => j.id !== id))
      if (table === 'offers') setPendingOffers((prev: any) => prev.filter((o: any) => o.id !== id))

      toast.success('Approved successfully!')
    } catch {
      toast.error('Action failed.')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDelete = async (table: string, id: string) => {
    if (!confirm(`Permanently delete this ${table} item?`)) return
    setIsUpdating(id)
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      
      if (table === 'products') setPendingProds((prev: any) => prev.filter((p: any) => p.id !== id))
      if (table === 'jobs') setPendingJobs((prev: any) => prev.filter((j: any) => j.id !== id))
      if (table === 'offers') setPendingOffers((prev: any) => prev.filter((o: any) => o.id !== id))
      if (table === 'categories') setCategories((prev: any) => prev.filter((c: any) => c.id !== id))

      toast.success('Deleted.')
    } catch {
      toast.error('Deletions failed.')
    } finally {
      setIsUpdating(null)
    }
  }

  // Navigation Items
  const navItems = [
    { id: 'Overview', icon: BarChart3, label: 'Dashboard' },
    { id: 'Moderation', icon: Shield, label: 'Moderation', count: pendingProds.length + pendingJobs.length + pendingOffers.length },
    { id: 'Businesses', icon: Store, label: 'Businesses' },
    { id: 'Users', icon: Users, label: 'User Registry' },
    { id: 'Commerce', icon: Tag, label: 'Ads & Offers' },
    { id: 'System', icon: Settings, label: 'System Health' },
  ]

  return (
    <div className="flex min-h-screen bg-[#FDFDFF]">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 bg-white border-r border-gray-100 transition-all duration-300 z-50 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="flex flex-col h-full">
           <div className="p-6 flex items-center gap-3 border-b border-gray-50">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                 <Shield className="w-6 h-6" />
              </div>
              {sidebarOpen && <span className="font-extrabold text-xl tracking-tighter text-gray-900">BizNepal Hub</span>}
           </div>

           <nav className="flex-1 p-4 space-y-2 mt-4">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${activeTab === item.id ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <item.icon className={`w-5 h-5 transition-transform ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {sidebarOpen && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden">
                       <span className="font-bold whitespace-nowrap">{item.label}</span>
                       {item.count ? <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white/20' : 'bg-red-500 text-white animate-pulse'}`}>{item.count}</span> : null}
                    </div>
                  )}
                </button>
              ))}
           </nav>

           <div className="p-6 border-t border-gray-50">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="w-full flex items-center justify-center p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900 transition"
              >
                 <RefreshCw className={`w-5 h-5 transition-transform duration-500 ${sidebarOpen ? '' : 'rotate-180'}`} />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 pb-24">
           
           {/* Navigation Context / Header */}
           <div className="flex items-center justify-between mb-10">
              <div>
                 <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{activeTab}</h2>
                 <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-1">Global Admin Control / {activeTab}</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                      placeholder="Global Search..." 
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold outline-none ring-gray-900/10 focus:ring-4 transition shadow-sm"
                    />
                 </div>
                 <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white shadow-sm"></div>
              </div>
           </div>

           {/* VIEW: OVERVIEW */}
           {activeTab === 'Overview' && (
             <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {[
                     { label: 'Total Businesses', val: stats.businesses, icon: Store, trend: '+12%', color: 'blue' },
                     { label: 'Platform Users', val: stats.users, icon: Users, trend: '+5.4%', color: 'purple' },
                     { label: 'Active Listings', val: stats.products, icon: ShoppingBag, trend: '-2%', color: 'emerald' },
                     { label: 'Order Velocity', val: stats.orders, icon: CreditCard, trend: '+24%', color: 'orange' },
                   ].map((s, i) => (
                     <div key={i} className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:shadow-2xl hover:scale-[1.02]">
                        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-${s.color}-50 rounded-full opacity-40 blur-3xl transition-all group-hover:opacity-60`}></div>
                        <div className="relative">
                           <div className={`w-12 h-12 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-6`}>
                              <s.icon className="w-6 h-6" />
                           </div>
                           <p className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-1">{s.label}</p>
                           <h3 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">{s.val.toLocaleString()}</h3>
                           <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.trend.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                             {s.trend} from last month
                           </span>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Charts Section */}
                <div className="grid lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                         <div>
                            <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Ecosystem Growth</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Across users and verified merchants</p>
                         </div>
                         <TrendingUp className="w-6 h-6 text-gray-900" />
                      </div>
                      <div className="h-[350px] w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                               <defs>
                                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#111827" stopOpacity={0.1}/>
                                     <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F1F1" />
                               <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold'}} dy={10} />
                               <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold'}} />
                               <Tooltip 
                                 contentStyle={{ backgroundColor: '#111827', borderRadius: '16px', border: 'none', color: '#FFF', fontSize: '10px', fontWeight: 'bold' }} 
                                 itemStyle={{ color: '#FFF' }}
                                 cursor={{ stroke: '#F1F1F1', strokeWidth: 2 }}
                               />
                               <Area type="monotone" dataKey="users" stroke="#111827" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                               <Area type="monotone" dataKey="business" stroke="#3B82F6" strokeWidth={4} fill="none" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="bg-gray-900 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden text-white flex flex-col justify-between">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
                      <div className="relative">
                         <h3 className="font-black text-2xl tracking-tighter mb-2">Platform Velocity</h3>
                         <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Real-time engagement index</p>
                      </div>
                      <div className="relative flex items-end justify-between flex-1 mt-8">
                         <div className="space-y-6">
                            <div>
                               <p className="text-4xl font-black text-white tracking-tighter">98%</p>
                               <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">API Uptime</p>
                            </div>
                            <div>
                               <p className="text-4xl font-black text-white tracking-tighter">1.2s</p>
                               <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Avg Latency</p>
                            </div>
                         </div>
                         <div className="w-32 h-32 flex items-center justify-center">
                            <RefreshCw className="w-16 h-16 text-white/10 animate-spin-slow" />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Verification Queue Preview */}
                <div className="grid lg:grid-cols-2 gap-8">
                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Verification In-Box</h3>
                         <button onClick={()=>setActiveTab('Moderation')} className="text-[10px] font-black uppercase text-blue-600 hover:underline">View All</button>
                      </div>
                      <div className="space-y-4">
                         {pendingProds.length === 0 && pendingJobs.length === 0 ? (
                            <div className="py-10 text-center flex flex-col items-center gap-2 opacity-30">
                               <CheckCircle className="w-10 h-10" />
                               <p className="text-xs font-bold uppercase tracking-widest">Queue is clear</p>
                            </div>
                         ) : (
                           [...pendingProds, ...pendingJobs].slice(0, 4).map((item: any, i: number) => (
                             <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-gray-200 transition group">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center font-black text-gray-900">
                                      {item.title?.charAt(0) || 'P'}
                                   </div>
                                   <div>
                                      <p className="font-black text-sm text-gray-900 truncate max-w-[150px]">{item.title}</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{item.businesses?.name}</p>
                                   </div>
                                </div>
                                <div className="flex gap-2">
                                   <button className="p-2 bg-white text-emerald-600 border border-emerald-100 rounded-xl shadow-sm hover:bg-emerald-600 hover:text-white transition"><CheckCircle className="w-4 h-4" /></button>
                                   <button className="p-2 bg-white text-red-600 border border-red-100 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                   </div>

                   <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
                      <div className="flex items-center gap-3 mb-6">
                         <AlertTriangle className="w-6 h-6 text-red-600" />
                         <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Security Alert Stack</h3>
                      </div>
                      <div className="divide-y divide-gray-50">
                         {flaggedReviews.length === 0 ? (
                           <p className="py-10 text-center text-xs font-bold text-gray-400 uppercase tracking-widest opacity-30 italic">No critical flags reported</p>
                         ) : flaggedReviews.slice(0, 3).map((rev: any) => (
                           <div key={rev.id} className="py-4 first:pt-0">
                              <p className="text-sm font-bold text-gray-600 line-clamp-2 italic mb-2">"{rev.comment}"</p>
                              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                                 <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">{rev.rating}⭐ Warning</span>
                                 <button onClick={()=>handleDelete('reviews', rev.id)} className="hover:text-red-600 transition">Delete Review</button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
           )}           {/* VIEW: MODERATION */}
           {activeTab === 'Moderation' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                   <div className="mb-8 border-b border-gray-50 pb-6">
                      <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Central Moderation Hub</h3>
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Approve or reject platform-wide content submissions</p>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Products Moderator */}
                      <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                               <ShoppingBag className="w-5 h-5 text-blue-600" />
                               <span className="font-extrabold text-gray-900">Products</span>
                            </div>
                            <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{pendingProds.length}</span>
                         </div>
                         <div className="space-y-4">
                            {pendingProds.length === 0 ? (
                               <p className="py-10 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">Fully Moderated</p>
                            ) : pendingProds.map((item: any) => (
                               <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition">
                                  <h4 className="font-black text-gray-900 text-sm truncate">{item.title}</h4>
                                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase truncate">{item.businesses?.name}</p>
                                  <div className="flex gap-2 mt-4">
                                     <button onClick={()=>handleVerify('products', item.id, true)} className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition">Approve</button>
                                     <button onClick={()=>handleDelete('products', item.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Jobs Moderator */}
                      <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                               <Briefcase className="w-5 h-5 text-purple-600" />
                               <span className="font-extrabold text-gray-900">Careers</span>
                            </div>
                            <span className="text-[10px] font-black bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{pendingJobs.length}</span>
                         </div>
                         <div className="space-y-4">
                            {pendingJobs.length === 0 ? (
                               <p className="py-10 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">Fully Moderated</p>
                            ) : pendingJobs.map((item: any) => (
                               <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-purple-200 transition">
                                  <h4 className="font-black text-gray-900 text-sm truncate">{item.title}</h4>
                                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase truncate">{item.businesses?.name}</p>
                                  <div className="flex gap-2 mt-4">
                                     <button onClick={()=>handleVerify('jobs', item.id, true)} className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition">Approve</button>
                                     <button onClick={()=>handleDelete('jobs', item.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>

                      {/* Offers Moderator */}
                      <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                         <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                               <Tag className="w-5 h-5 text-orange-600" />
                               <span className="font-extrabold text-gray-900">Offers</span>
                            </div>
                            <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">{pendingOffers.length}</span>
                         </div>
                         <div className="space-y-4">
                            {pendingOffers.length === 0 ? (
                               <p className="py-10 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">Fully Moderated</p>
                            ) : pendingOffers.map((item: any) => (
                               <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-200 transition">
                                  <h4 className="font-black text-gray-900 text-sm truncate">{item.title}</h4>
                                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase truncate">{item.businesses?.name}</p>
                                  <div className="flex gap-2 mt-4">
                                     <button onClick={()=>handleVerify('offers', item.id, true)} className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition">Approve</button>
                                     <button onClick={()=>handleDelete('offers', item.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition"><Trash2 className="w-4 h-4"/></button>
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* VIEW: BUSINESSES */}
           {activeTab === 'Businesses' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div>
                         <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Partner Management</h3>
                         <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Verify and feature marketplace partners</p>
                      </div>
                   </div>
                   <div className="overflow-x-auto -mx-8">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                         <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-50">
                            <tr>
                               <th className="px-8 py-5">Business Name</th>
                               <th className="px-8 py-5">Location</th>
                               <th className="px-8 py-5">Trust Level</th>
                               <th className="px-8 py-5">Marketing</th>
                               <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {businesses.filter((b:any)=>b.name.toLowerCase().includes(searchTerm.toLowerCase())).map((biz: any) => (
                              <tr key={biz.id} className="hover:bg-gray-50/50 transition-colors">
                                 <td className="px-8 py-5">
                                    <p className="font-extrabold text-gray-900">{biz.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{biz.phone}</p>
                                 </td>
                                 <td className="px-8 py-5">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full border border-gray-200">{biz.districts?.name_en || 'National'}</span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <button onClick={()=>handleVerify('businesses', biz.id, !biz.is_verified)} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border-2 transition ${biz.is_verified ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-100 text-gray-300'}`}>
                                       {biz.is_verified ? 'Verified ✓' : 'Unverified'}
                                    </button>
                                 </td>
                                 <td className="px-8 py-5">
                                    <button className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border-2 transition ${biz.is_featured ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-gray-100 text-gray-300'}`}>
                                       <Star className={`w-3 h-3 ${biz.is_featured ? 'fill-current' : ''}`} />
                                       {biz.is_featured ? 'Featured' : 'Standard'}
                                    </button>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <button className="p-2 text-gray-400 hover:text-gray-900 transition"><Settings className="w-4 h-4" /></button>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </div>
           )}

           {/* VIEW: USERS */}
           {activeTab === 'Users' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div>
                         <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Global Citizen Registry</h3>
                         <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Full administration of user profiles and permissions</p>
                      </div>
                   </div>
                   <div className="overflow-x-auto -mx-8">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                         <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-50">
                            <tr>
                               <th className="px-8 py-5">Citizen Profile</th>
                               <th className="px-8 py-5">Role Permission</th>
                               <th className="px-8 py-5">Trust Status</th>
                               <th className="px-8 py-5 text-right">Access</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50">
                            {users.filter((u:any)=>u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map((u: any) => (
                              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center font-black text-gray-900 text-xs overflow-hidden">
                                          {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.full_name?.charAt(0)}
                                       </div>
                                       <div>
                                          <p className="font-extrabold text-gray-900">{u.full_name}</p>
                                          <p className="text-[10px] text-gray-400 font-bold">{u.email}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-lg ${u.role === 'admin' ? 'bg-gray-900 text-white' : u.role === 'business' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                                       {u.role}
                                    </span>
                                 </td>
                                 <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black uppercase flex items-center gap-2 ${u.is_banned ? 'text-red-600' : 'text-emerald-600'}`}>
                                       <div className={`w-2 h-2 rounded-full ${u.is_banned ? 'bg-red-600' : 'bg-emerald-600'}`}></div>
                                       {u.is_banned ? 'Banned' : 'Active'}
                                    </span>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <button onClick={() => setSelectedUser(u)} className="px-4 py-2 bg-gray-50 text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition shadow-sm">Deep Audit</button>
                                 </td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Audit Modal */}
                {selectedUser && (
                   <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
                         <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tighter">Citizen Deep Audit</h3>
                            <button onClick={()=>setSelectedUser(null)} className="p-2 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-600 transition"><X className="w-6 h-6"/></button>
                         </div>
                         <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="flex items-center gap-6">
                               <div className="w-24 h-24 rounded-[2rem] bg-gray-100 flex items-center justify-center text-3xl font-black text-gray-900 shadow-xl overflow-hidden border-4 border-white">
                                  {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-full h-full object-cover" /> : selectedUser.full_name?.charAt(0)}
                               </div>
                               <div>
                                  <h4 className="text-3xl font-black text-gray-900 tracking-tight">{selectedUser.full_name}</h4>
                                  <p className="text-gray-400 font-bold uppercase text-[10px]">UUID: {selectedUser.id}</p>
                               </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               {[
                                 { label: 'Role', val: selectedUser.role },
                                 { label: 'Email', val: selectedUser.email },
                                 { label: 'Joined', val: format(new Date(selectedUser.created_at), 'PPP') },
                                 { label: 'Status', val: selectedUser.is_banned ? 'BANNED' : 'TRUSTED' },
                               ].map((info, i) => (
                                 <div key={i} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{info.label}</p>
                                    <p className="font-extrabold text-gray-900 truncate">{info.val}</p>
                                 </div>
                               ))}
                            </div>
                            <div className="bg-gray-900 p-8 rounded-[2rem] text-white">
                               <h5 className="font-black text-xs uppercase tracking-widest text-gray-400 mb-4">Security Actions</h5>
                               <div className="flex gap-4">
                                  <button className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg ${selectedUser.is_banned ? 'bg-emerald-600' : 'bg-red-600 hover:bg-red-700'}`}>
                                     {selectedUser.is_banned ? 'Restore Access' : 'Invoke Ban'}
                                  </button>
                                  <button className="flex-1 py-4 bg-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition">Reset Token</button>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                )}
             </div>
           )}

           {/* VIEW: COMMERCE */}
           {activeTab === 'Commerce' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                   <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">System Taxonomy</h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                      {categories.map((cat: any) => (
                        <div key={cat.id} className="relative group p-8 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-gray-900 hover:bg-white transition-all text-center">
                           <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition">{cat.icon || '📍'}</div>
                           <p className="font-black text-gray-900 text-lg">{cat.name_en}</p>
                           <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1 opacity-60">{cat.name_np}</p>
                           <button onClick={()=>handleDelete('categories', cat.id)} className="absolute top-4 right-4 p-2 bg-red-50 text-red-600 rounded-xl opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4"/></button>
                        </div>
                      ))}
                      <button className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-300 hover:text-gray-900 hover:border-gray-900 transition min-h-[180px]">
                         <Plus className="w-8 h-8 mb-2" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Add Category</span>
                      </button>
                   </div>
                </div>
             </div>
           )}

           {/* VIEW: SYSTEM */}
           {activeTab === 'System' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="bg-gray-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[200px] opacity-10 -mr-48 -mt-48"></div>
                   <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                      <div>
                         <h3 className="text-4xl font-black tracking-tighter mb-4">System Core Vitals</h3>
                         <p className="text-gray-400 font-bold max-w-md">Real-time monitoring of BizNepal infrastructure. All systems are currently operating within optimal parameters.</p>
                         <div className="flex gap-4 mt-8">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                               <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Database Load</p>
                               <p className="text-4xl font-black">12%</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                               <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Server Response</p>
                               <p className="text-4xl font-black">84ms</p>
                            </div>
                         </div>
                      </div>
                      <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10">
                         <h4 className="font-black text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-400" /> Live Audit Log
                         </h4>
                         <div className="space-y-4">
                            {['Admin verified "New Bakery"', 'User "Suman" banned', 'Inventory sync completed', 'Security patch applied'].map((log, i) => (
                              <div key={i} className="flex items-center gap-3 text-sm text-gray-500 font-bold border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                 {log}
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
           )}

        </div>
      </main>
    </div>
  )
}
