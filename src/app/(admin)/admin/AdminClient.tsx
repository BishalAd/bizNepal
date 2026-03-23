'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, XCircle, Shield, Store, Users, ShoppingBag, 
  CreditCard, AlertTriangle, Search, MoreVertical,
  Plus, Edit, Trash2, LayoutGrid, Star, Ban, Unlock, Settings
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { format } from 'date-fns'

export default function AdminClient({ 
  stats, 
  allBusinesses: initialBusinesses, 
  allUsers: initialUsers, 
  categories: initialCategories,
  flaggedReviews 
}: any) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('Overview')
  
  const [businesses, setBusinesses] = useState(initialBusinesses || [])
  const [users, setUsers] = useState(initialUsers || [])
  const [categories, setCategories] = useState(initialCategories || [])
  
  const [searchTerm, setSearchTerm] = useState('')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Handlers
  const handleVerifyBusiness = async (id: string, approve: boolean) => {
    setIsUpdating(id)
    try {
      const { error } = await supabase.from('businesses').update({ is_verified: approve }).eq('id', id)
      if (error) throw error
      setBusinesses((prev: any) => prev.map((b: any) => b.id === id ? { ...b, is_verified: approve } : b))
      toast.success(approve ? 'Business Verified!' : 'Verification Removed')
    } catch {
      toast.error('Failed to update business status.')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setIsUpdating(id)
    try {
      const { error } = await supabase.from('businesses').update({ is_featured: !current }).eq('id', id)
      if (error) throw error
      setBusinesses((prev: any) => prev.map((b: any) => b.id === id ? { ...b, is_featured: !current } : b))
      toast.success(!current ? 'Business Featured!' : 'Removed from Featured')
    } catch {
      toast.error('Failed to update featured status.')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    setIsUpdating(userId)
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
      if (error) throw error
      setUsers((prev: any) => prev.map((u: any) => u.id === userId ? { ...u, role: newRole } : u))
      toast.success(`User role updated to ${newRole}`)
    } catch {
      toast.error('Failed to update user role.')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleToggleBanUser = async (userId: string, currentBanStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentBanStatus ? 'unban' : 'ban'} this user?`)) return
    setIsUpdating(userId)
    try {
      const { error } = await supabase.from('profiles').update({ is_banned: !currentBanStatus }).eq('id', userId)
      if (error) throw error
      setUsers((prev: any) => prev.map((u: any) => u.id === userId ? { ...u, is_banned: !currentBanStatus } : u))
      toast.success(currentBanStatus ? 'User unbanned' : 'User banned successfully')
    } catch {
      toast.error('Failed to change ban status.')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleDeleteReview = async (id: string) => {
     if(!confirm('Delete this review permanently?')) return
     try {
       const { error } = await supabase.from('reviews').delete().eq('id', id)
       if (error) throw error
       toast.success('Review deleted.')
       window.location.reload()
     } catch {
       toast.error('Failed to delete review.')
     }
  }

  const handleAddCategory = async () => {
    const name_en = prompt('Enter Category name (English):')
    const name_np = prompt('Enter Category name (Nepali):')
    const icon = prompt('Enter Emoji Icon (e.g. 🍔):')
    if (!name_en || !name_np) return

    try {
      const { data, error } = await supabase.from('categories').insert({ name_en, name_np, icon }).select().single()
      if (error) throw error
      setCategories((prev: any) => [...prev, data])
      toast.success('Category added!')
    } catch {
      toast.error('Failed to add category.')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category permanently?')) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      setCategories((prev: any) => prev.filter((c: any) => c.id !== id))
      toast.success('Category deleted.')
    } catch {
      toast.error('Failed to delete category.')
    }
  }

  // Filtering logic
  const filteredUsers = (users || []).filter((u:any) => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredBusinesses = (businesses || []).filter((b:any) => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-20">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl flex items-center justify-center shadow-2xl">
             <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">BizNepal Control</h1>
            <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-0.5">Global Administration Hub</p>
          </div>
        </div>

        <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm overflow-hidden">
          {['Overview', 'Users', 'Businesses', 'Categories'].map(tab => (
            <button 
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchTerm('') }}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === tab ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {[
               { icon: Store, color: 'blue', label: 'Businesses', val: stats.businesses },
               { icon: Users, color: 'purple', label: 'Total Users', val: stats.users },
               { icon: ShoppingBag, color: 'emerald', label: 'Active Ads', val: stats.products },
               { icon: CreditCard, color: 'orange', label: 'Revenue/Orders', val: stats.orders },
             ].map((s, i) => (
               <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group border-b-4" style={{borderBottomColor: `var(--tw-gradient-from)`}}>
                  <div className={`w-12 h-12 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-gray-400 font-black text-[10px] mb-1 uppercase tracking-widest">{s.label}</h4>
                  <p className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{s.val}</p>
               </div>
             ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
             {/* Verification Queue */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                   <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Verify Businesses</h3>
                   <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full">{businesses.filter((b:any)=>!b.is_verified).length} TO REVIEW</span>
                </div>
                <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                   {businesses.filter((b:any)=>!b.is_verified).length === 0 ? (
                     <div className="p-20 text-center flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-green-200 mb-4" />
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest text-center">In-Box Zero!<br/>All businesses are verified.</p>
                     </div>
                   ) : businesses.filter((b:any)=>!b.is_verified).map((biz: any) => (
                     <div key={biz.id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="font-black text-gray-900 truncate text-lg leading-tight">{biz.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase tracking-tighter">{biz.districts?.name_en || 'Unknown District'}</span>
                             <span className="text-[10px] font-bold text-gray-400">{biz.phone}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-2">Requested {format(new Date(biz.created_at), 'PP')}</p>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             disabled={isUpdating === biz.id}
                             onClick={()=>handleVerifyBusiness(biz.id, true)} 
                             className="w-12 h-12 bg-gray-900 text-white hover:bg-green-600 rounded-2xl flex items-center justify-center transition shadow-lg disabled:opacity-50"
                           >
                             <CheckCircle className="w-6 h-6"/>
                           </button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Flagged Content */}
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                   <AlertTriangle className="w-6 h-6 text-red-600"/>
                   <h3 className="font-extrabold text-gray-900 text-xl tracking-tight">Security Flags</h3>
                </div>
                <div className="divide-y divide-gray-100">
                   {flaggedReviews.length === 0 ? (
                     <div className="p-20 text-center flex flex-col items-center opacity-30">
                        <Shield className="w-12 h-12 text-gray-400 mb-4" />
                        <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">No flagged content detected</p>
                     </div>
                   ) : flaggedReviews.map((rev: any) => (
                     <div key={rev.id} className="p-6 bg-red-50/30">
                        <div className="flex justify-between items-start mb-3">
                          <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-sm">{rev.rating}⭐ DANGER</span>
                          <span className="text-[10px] text-gray-400 font-black uppercase">{format(new Date(rev.created_at), 'PP')}</span>
                        </div>
                        <p className="text-sm font-black text-gray-900 mb-2 italic bg-white p-3 rounded-2xl border border-red-100">"{rev.comment}"</p>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                           <span>Review for: {rev.business?.name}</span>
                           <button onClick={()=>handleDeleteReview(rev.id)} className="text-red-600 hover:scale-105 transition">Burn Comment</button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
           <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-black text-gray-900 text-2xl tracking-tighter">Global Citizen Registry</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Manage accounts and permissions</p>
              </div>
              <div className="relative max-w-sm w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 <input 
                   type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                   placeholder="Search ID, Name or Email..." 
                   className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-gray-900 transition" 
                 />
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-50">
                   <tr>
                     <th className="px-8 py-5">Full Profile</th>
                     <th className="px-8 py-5">Role Permission</th>
                     <th className="px-8 py-5">Member Since</th>
                     <th className="px-8 py-5 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filteredUsers.map((u:any) => (
                     <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.is_banned ? 'bg-red-50/20' : ''}`}>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-4">
                              <div className={`relative w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-900 overflow-hidden border-2 ${u.is_banned ? 'border-red-500' : 'border-white'} shadow-sm`}>
                                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.full_name?.charAt(0)}
                                {u.is_banned && <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center"><Ban className="w-5 h-5 text-white" /></div>}
                              </div>
                              <div>
                                <p className="font-black text-gray-900 text-base flex items-center gap-2">
                                  {u.full_name}
                                  {u.is_banned && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded uppercase leading-none">Banned</span>}
                                </p>
                                <p className="text-xs text-gray-400 font-bold tracking-tight mt-0.5">{u.email}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <select 
                             disabled={isUpdating === u.id}
                             value={u.role} 
                             onChange={(e) => handleChangeUserRole(u.id, e.target.value)}
                             className={`text-xs font-black px-4 py-2 rounded-xl border-2 outline-none appearance-none transition shadow-sm ${
                               u.role === 'admin' ? 'bg-gray-900 border-gray-900 text-white' : 
                               u.role === 'business' ? 'bg-blue-50 border-blue-100 text-blue-700' : 
                               'bg-white border-gray-100 text-gray-700'
                             }`}
                           >
                              <option value="user">Individual User</option>
                              <option value="business">Business Merchant</option>
                              <option value="admin">System Admin</option>
                           </select>
                        </td>
                        <td className="px-8 py-5 font-bold text-gray-500">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleToggleBanUser(u.id, u.is_banned)}
                                className={`p-2 rounded-xl transition-all border ${u.is_banned ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'}`}
                              >
                                 {u.is_banned ? <Unlock className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                              <button className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition border border-gray-100"><Settings className="w-4 h-4" /></button>
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'Businesses' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[600px]">
           <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h3 className="font-black text-gray-900 text-2xl tracking-tighter">Marketplace Partners</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Review, Verify and Feature businesses</p>
              </div>
              <div className="relative max-w-sm w-full">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                 <input 
                   type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                   placeholder="Search Shop Names..." 
                   className="w-full pl-12 pr-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-gray-900 transition" 
                 />
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-50">
                   <tr>
                     <th className="px-8 py-5">Partner Name</th>
                     <th className="px-8 py-5">Territory</th>
                     <th className="px-8 py-5">Trust Level</th>
                     <th className="px-8 py-5">Marketing Status</th>
                     <th className="px-8 py-5 text-right">Tools</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {filteredBusinesses.map((b:any) => (
                     <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-5">
                           <p className="font-black text-gray-900 text-base">{b.name}</p>
                           <p className="text-xs text-gray-400 font-bold tracking-tight">{b.phone}</p>
                        </td>
                        <td className="px-8 py-5">
                           <span className="font-black text-[10px] tracking-widest uppercase text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                             {b.districts?.name_en || 'Main Depot'}
                           </span>
                        </td>
                        <td className="px-8 py-5">
                           <button 
                             disabled={isUpdating === b.id}
                             onClick={() => handleVerifyBusiness(b.id, !b.is_verified)}
                             className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition ${
                                 b.is_verified ? 'bg-green-50 border-green-500 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-400'
                             }`}
                           >
                              {b.is_verified ? 'VERIFIED ✓' : 'UNVERIFIED'}
                           </button>
                        </td>
                        <td className="px-8 py-5">
                           <button 
                             disabled={isUpdating === b.id}
                             onClick={() => handleToggleFeatured(b.id, b.is_featured)}
                             className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition ${
                                 b.is_featured ? 'bg-amber-50 border-amber-500 text-amber-900' : 'bg-white border-gray-100 text-gray-400 hover:border-amber-200'
                             }`}
                           >
                              <Star className={`w-3 h-3 ${b.is_featured ? 'fill-current' : ''}`} />
                              {b.is_featured ? 'Featured' : 'Standard'}
                           </button>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <button className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-xl transition border border-gray-100"><Edit className="w-4 h-4" /></button>
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'Categories' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-gray-900 text-2xl tracking-tighter">System Taxonomy</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Define platform categories</p>
              </div>
              <button 
                onClick={handleAddCategory}
                className="bg-gray-900 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center gap-2 hover:bg-gray-800 transition shadow-2xl"
              >
                 <Plus className="w-5 h-5" /> EXPAND SYSTEM
              </button>
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 p-8 gap-6">
              {categories.map((cat:any) => (
                <div key={cat.id} className="relative p-8 border-2 border-gray-100 rounded-[2rem] bg-gray-50/50 flex flex-col items-center group overflow-hidden hover:border-gray-900 hover:bg-white transition-all duration-300">
                   <div className="text-5xl mb-4 drop-shadow-lg group-hover:scale-125 transition duration-500">{cat.icon || '📍'}</div>
                   <p className="font-black text-gray-900 text-lg tracking-tighter">{cat.name_en}</p>
                   <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1 opacity-60">{cat.name_np}</p>
                   
                   <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={()=>handleDeleteCategory(cat.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition"><Trash2 className="w-4 h-4" /></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

    </div>
  )
}
