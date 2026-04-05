'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Filter, Edit, Trash2, Eye, MoreVertical, PackageOpen, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import StatsCard from '@/components/dashboard/StatsCard'
import { StatusBadge } from '@/components/dashboard/shared/DashboardShared'

export default function ProductsClient({ initialProducts, categories, businessId }: any) {
  const supabase = createClient()
  
  const [products, setProducts] = useState(initialProducts)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Derived Stats
  const stats = useMemo(() => {
    let total = products.length
    let active = 0
    let draft = 0
    let outOfStock = 0

    products.forEach((p:any) => {
      if (p.status === 'active') active++
      if (p.status === 'draft') draft++
      if (p.stock_quantity === 0) outOfStock++
    })

    return { total, active, draft, outOfStock }
  }, [products])

  // Filtered List
  const displayProducts = useMemo(() => {
    return products.filter((p:any) => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      const pCategoryName = Array.isArray(p.category) ? p.category[0]?.name_en : (p.category as any)?.name_en
      const matchCategory = filterCategory ? pCategoryName === filterCategory : true
      let matchStatus = true
      if (filterStatus === 'active') matchStatus = p.status === 'active'
      if (filterStatus === 'draft') matchStatus = p.status === 'draft'
      if (filterStatus === 'out_of_stock') matchStatus = p.stock_quantity === 0
      
      return matchSearch && matchCategory && matchStatus
    })
  }, [products, search, filterCategory, filterStatus])

  // Handlers
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'draft' : 'active'
    setLoadingAction(id)
    try {
      const { error } = await supabase.from('products').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      setProducts(products.map((p:any) => p.id === id ? { ...p, status: newStatus } : p))
      toast.success(`Product marked as ${newStatus}`)
    } catch (e: any) {
      toast.error(e.message || "Failed to update status")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return
    setLoadingAction(id)
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(products.filter((p:any) => p.id !== id))
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
      toast.success("Product deleted")
    } catch (e: any) {
      toast.error(e.message || "Failed to delete product")
    } finally {
      setLoadingAction(null)
    }
  }

  const handleBulkAction = async (action: 'delete' | 'active' | 'draft') => {
    if (selectedIds.length === 0) return
    if (action === 'delete' && !confirm(`Are you sure you want to delete ${selectedIds.length} products?`)) return
    
    setLoadingAction('bulk')
    try {
      if (action === 'delete') {
        const { error } = await supabase.from('products').delete().in('id', selectedIds)
        if (error) throw error
        setProducts(products.filter((p:any) => !selectedIds.includes(p.id)))
        toast.success(`Deleted ${selectedIds.length} products`)
      } else {
        const { error } = await supabase.from('products').update({ status: action }).in('id', selectedIds)
        if (error) throw error
        setProducts(products.map((p:any) => selectedIds.includes(p.id) ? { ...p, status: action } : p))
        toast.success(`Marked ${selectedIds.length} products as ${action}`)
      }
      setSelectedIds([])
    } catch (e: any) {
      toast.error(e.message || "Bulk action failed")
    } finally {
      setLoadingAction(null)
    }
  }

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(displayProducts.map((p:any) => p.id))
    else setSelectedIds([])
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id))
    else setSelectedIds([...selectedIds, id])
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Products & Services</h1>
            <p className="text-gray-500 mt-1">Manage your catalog, inventory, and pricing.</p>
          </div>
          <Link href="/dashboard/products/new" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm whitespace-nowrap">
            <Plus className="w-5 h-5 mr-2" /> Add Product
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard title="Total Products" value={stats.total} icon={<PackageOpen className="w-6 h-6" />} color="gray" />
          <StatsCard title="Active Listings" value={stats.active} icon={<CheckCircle2 className="w-6 h-6" />} color="green" />
          <StatsCard title="Drafts" value={stats.draft} icon={<Clock className="w-6 h-6" />} color="blue" />
          <StatsCard title="Out of Stock" value={stats.outOfStock} icon={<AlertCircle className="w-6 h-6" />} color="red" />
        </div>

        {/* Main List Box */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Toolbar */}
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/50">
            
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
               <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                   type="text" 
                   value={search} onChange={e=>setSearch(e.target.value)}
                   placeholder="Search products..." 
                   className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none" 
                 />
               </div>
               
               <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                 <option value="">All Categories</option>
                 {categories.map((c:any) => <option key={c.id} value={c.name_en}>{c.name_en}</option>)}
               </select>

               <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-medium text-gray-700 outline-none focus:ring-2 focus:ring-blue-500">
                 <option value="">Any Status</option>
                 <option value="active">Active</option>
                 <option value="draft">Draft</option>
                 <option value="out_of_stock">Out of Stock</option>
               </select>
            </div>

            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 animate-in fade-in">
                <span className="text-sm font-bold text-blue-700 mr-2">{selectedIds.length} selected</span>
                <button onClick={() => handleBulkAction('active')} disabled={loadingAction==='bulk'} className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg shadow-sm">Set Active</button>
                <button onClick={() => handleBulkAction('draft')} disabled={loadingAction==='bulk'} className="text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-lg shadow-sm">Set Draft</button>
                <div className="w-px h-6 bg-blue-200 mx-1"></div>
                <button onClick={() => handleBulkAction('delete')} disabled={loadingAction==='bulk'} className="text-xs font-bold text-red-600 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg shadow-sm">Delete</button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-gray-100 text-xs uppercase font-bold text-gray-400">
                <tr>
                  <th className="px-6 py-4 w-10">
                    <input type="checkbox" checked={selectedIds.length === displayProducts.length && displayProducts.length > 0} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                  </th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price / Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Views</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {displayProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {products.length === 0 ? "You haven't added any products yet." : "No products match your search filters."}
                      </td>
                    </tr>
                 ) : (
                   displayProducts.map((p:any) => {
                     const isLowStock = p.stock_quantity <= 10 && p.stock_quantity > 0
                     const isOutOfStock = p.stock_quantity === 0
                     const isProcessing = loadingAction === p.id

                     return (
                       <tr key={p.id} className={`hover:bg-gray-50/50 transition group ${selectedIds.includes(p.id) ? 'bg-blue-50/20' : ''} ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
                         
                         <td className="px-6 py-4">
                           <input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                         </td>
                         
                         <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                               {p.image_keys && p.image_keys.length > 0 ? (
                                 <img src={p.image_keys[0]} className="w-full h-full object-cover" alt="Thumbnail" />
                               ) : (
                                 <PackageOpen className="w-4 h-4 text-gray-400" />
                               )}
                             </div>
                             <div>
                               <p className="font-bold text-gray-900 leading-tight block w-48 truncate">{p.name}</p>
                             </div>
                           </div>
                         </td>
                                                  <td className="px-6 py-4 font-medium text-gray-600">
                            {Array.isArray(p.category) ? p.category[0]?.name_en : (p.category as any)?.name_en || '-'}
                          </td>
                         
                         <td className="px-6 py-4">
                           <p className="font-extrabold text-gray-900">₨ {p.discount_price ? p.discount_price.toLocaleString() : p.price?.toLocaleString()}</p>
                           <p className={`text-xs font-bold mt-0.5 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-green-600'}`}>
                             {p.stock_quantity} in stock
                           </p>
                         </td>
                         
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleToggleStatus(p.id, p.status)} 
                              className="hover:scale-105 transition-transform"
                              title="Click to toggle status"
                            >
                              <StatusBadge status={p.status} />
                            </button>
                          </td>

                         <td className="px-6 py-4 text-center">
                           <div className="inline-flex items-center gap-1.5 text-gray-500 font-bold bg-gray-50 border border-gray-100 px-2 py-1 rounded-md">
                             <Eye className="w-3.5 h-3.5" /> {p.view_count || 0}
                           </div>
                         </td>

                         <td className="px-6 py-4 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Link href={`/dashboard/products/${p.id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 bg-white hover:bg-blue-50 border border-gray-200 rounded-lg shadow-sm transition">
                               <Edit className="w-4 h-4" />
                             </Link>
                             <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 bg-white hover:bg-red-50 border border-gray-200 rounded-lg shadow-sm transition">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </td>
                       </tr>
                     )
                   })
                 )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </>
  )
}

