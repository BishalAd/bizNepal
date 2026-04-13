'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow, format } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'
import { 
  PackageSearch, BellRing, Phone, Mail, MapPin, Search, ChevronDown, 
  ChevronUp, Printer, FileText, CheckCircle2, XCircle, Truck, Package, Clock, ShoppingBag
} from 'lucide-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { StatusBadge, PaymentBadge } from '@/components/dashboard/shared/DashboardShared'

export default function OrdersClient({ initialOrders, business }: any) {
  const supabase = createClient()
  const [orders, setOrders] = useState(initialOrders)
  const [activeTab, setActiveTab] = useState('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Audio ref for notification
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const invoiceRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3') // Free positive notification sound
  }, [])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase.channel('realtime_orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `business_id=eq.${business.id}`
      }, (payload: any) => {
         const newOrder = payload.new
         setOrders((prev:any) => [newOrder, ...prev])
         toast.success('🔔 New Order Arrived!', { duration: 5000, position: 'top-center' })
         audioRef.current?.play().catch(() => {})
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `business_id=eq.${business.id}`
      }, (payload: any) => {
         // Some other client/admin might have updated the order
         setOrders((prev:any) => prev.map((o:any) => o.id === payload.new.id ? { ...o, ...payload.new } : o))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [business.id, supabase])

  const tabs = ['All', 'pending', 'confirmed', 'dispatched', 'delivered', 'cancelled']

  const displayOrders = useMemo(() => {
    let filtered = orders
    if (activeTab !== 'All') {
      filtered = filtered.filter((o:any) => o.order_status === activeTab)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((o:any) => 
        o.customer_name?.toLowerCase().includes(q) || 
        o.customer_phone?.includes(q) ||
        o.id.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [orders, activeTab, searchQuery])

  const handleStatusChange = async (id: string, newStatus: string) => {
    // Optimistic UI update
    setOrders((prev:any) => prev.map((o:any) => o.id === id ? { ...o, order_status: newStatus } : o))
    try {
      const { error } = await supabase.from('orders').update({ order_status: newStatus }).eq('id', id)
      if (error) throw error
      toast.success(`Order marked as ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
      // Revert on error
      setOrders([...orders])
    }
  }

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const { error } = await supabase.from('orders').update({ notes }).eq('id', id)
      if (error) throw error
      setOrders(orders.map((o:any) => o.id === id ? { ...o, notes } : o))
      toast.success('Notes saved')
    } catch {
      toast.error('Failed to save notes')
    }
  }

  const generatePDF = async (order: any) => {
    const el = document.getElementById(`invoice-${order.id}`)
    if (!el) return
    const canvas = await html2canvas(el, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(`Invoice_BN-${order.id.slice(0,8)}.pdf`)
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Orders Inbox</h1>
            <p className="text-gray-500 mt-1 uppercase text-[10px] font-black tracking-widest">Physical & Digital Shipments</p>
          </div>
          <div className="relative w-full sm:w-72 group">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by Name or BN-ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 rounded-2xl">
          {tabs.map(tab => (
             <button 
               key={tab} 
               onClick={() => setActiveTab(tab)}
               className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
             >
               {tab} {tab !== 'All' && <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-gray-100 ${activeTab === tab ? 'bg-gray-200 text-gray-900' : ''}`}>{orders.filter((o:any)=>o.order_status===tab).length}</span>}
             </button>
          ))}
        </div>

        {/* Main List Box */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
          {displayOrders.length === 0 ? (
             <div className="py-24 text-center border-2 border-dashed border-gray-50 m-6 rounded-3xl">
               <PackageSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
               <h3 className="text-lg font-bold text-gray-900">No {activeTab !== 'All' ? activeTab : ''} orders found</h3>
               <p className="text-gray-500">When customers place an order, it will appear here in real-time.</p>
             </div>
          ) : (
             <div className="divide-y divide-gray-100">
               {displayOrders.map((o:any) => {
                 const isExpanded = expandedId === o.id
                 
                 return (
                   <div key={o.id} className={`transition duration-300 ${isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50/50'}`}>
                      {/* Main Row summary */}
                      <div className="p-4 sm:p-6 flex flex-col xl:flex-row items-center justify-between gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                         
                         <div className="flex items-center gap-4 xl:w-2/12">
                           <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                              <Package className="w-6 h-6 text-orange-600" />
                           </div>
                           <div>
                             <p className="font-extrabold text-gray-900 text-sm">BN-{o.id.slice(0,8).toUpperCase()}</p>
                             <p className="text-xs font-bold text-gray-400 mt-0.5">{formatDistanceToNow(new Date(o.created_at))} ago</p>
                           </div>
                         </div>
                         
                         <div className="xl:w-3/12 flex-1">
                           <p className="font-bold text-gray-900">{o.customer_name}</p>
                           <a href={`tel:${o.customer_phone}`} onClick={e=>e.stopPropagation()} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1.5 mt-0.5">
                             <Phone className="w-3.5 h-3.5"/> {o.customer_phone}
                           </a>
                         </div>

                         <div className="xl:w-2/12 flex-1 hidden sm:block">
                           <p className="text-sm font-bold text-gray-600 truncate pr-4">
                             {o.items?.[0]?.title || 'Package (Various)'} {o.items?.length > 1 ? `+${o.items.length - 1} more` : ''}
                           </p>
                         </div>

                         <div className="xl:w-2/12">
                           <p className="font-extrabold text-gray-900 text-lg">₨ {Number(o.total || 0).toLocaleString()}</p>
                           <div className="flex gap-2 items-center mt-1">
                             <PaymentBadge method={o.payment_method} />
                             {o.payment_status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500"/> : o.payment_status === 'pending' ? <Clock className="w-3.5 h-3.5 text-yellow-500"/> : <XCircle className="w-3.5 h-3.5 text-red-500"/>}
                           </div>
                         </div>

                         <div className="xl:w-2/12 flex gap-3 items-center justify-end w-full xl:w-auto">
                            <StatusBadge status={o.order_status} />
                            <select 
                              onClick={e => e.stopPropagation()} 
                              value={o.order_status} 
                              onChange={e => handleStatusChange(o.id, e.target.value)} 
                              className="text-[10px] font-black outline-none cursor-pointer border border-gray-200 px-2 py-1.5 rounded-lg appearance-none bg-white hover:bg-gray-50 transition-colors uppercase tracking-widest"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="dispatched">Dispatched</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            
                            <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition">
                               {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                            </button>
                         </div>

                      </div>

                      {/* Expanded View Area */}
                      {isExpanded && (
                         <div className="p-6 pt-0 border-t border-gray-100 mt-2 xl:mt-0 xl:-mt-2 animate-in slide-in-from-top-2 duration-200">
                           <div className="grid lg:grid-cols-3 gap-8 pt-6">
                              
                              {/* Left Info */}
                              <div className="lg:col-span-2 space-y-6">
                                 <div>
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Ordered Items</h3>
                                    <div className="bg-white border text-sm border-gray-100 rounded-xl overflow-hidden">
                                       <table className="w-full text-left">
                                         <thead className="bg-gray-50 text-xs text-gray-500 font-bold border-b border-gray-100">
                                            <tr>
                                              <th className="px-4 py-3">Item Details</th>
                                              <th className="px-4 py-3 text-center">Qty</th>
                                              <th className="px-4 py-3">Price</th>
                                              <th className="px-4 py-3 text-right">Total</th>
                                            </tr>
                                         </thead>
                                         <tbody className="divide-y divide-gray-50">
                                            {o.items?.map((item:any, idx:number) => (
                                              <tr key={idx}>
                                                <td className="px-4 py-3 font-bold text-gray-900">
                                                  {item.title}
                                                </td>
                                                <td className="px-4 py-3 text-center font-bold text-gray-600">{item.quantity}</td>
                                                <td className="px-4 py-3 font-medium">₨ {item.price?.toLocaleString()}</td>
                                                <td className="px-4 py-3 font-extrabold text-blue-900 text-right">₨ {(item.price * item.quantity).toLocaleString()}</td>
                                              </tr>
                                            ))}
                                         </tbody>
                                         <tfoot className="bg-blue-50/50">
                                           <tr>
                                             <td colSpan={3} className="px-4 py-3 font-bold text-right text-gray-700">Grand Total</td>
                                             <td className="px-4 py-3 font-black text-blue-900 text-right text-lg">₨ {Number(o.total || 0).toLocaleString()}</td>
                                           </tr>
                                         </tfoot>
                                       </table>
                                    </div>
                                 </div>

                                 <div className="flex gap-4">
                                   <button onClick={() => handleStatusChange(o.id, 'delivered')} disabled={o.order_status === 'delivered'} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm">
                                      <CheckCircle2 className="w-5 h-5 mr-2" /> Mark as Delivered
                                   </button>
                                   <button onClick={() => generatePDF(o)} className="bg-white border border-gray-200 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-bold transition flex items-center shadow-sm text-gray-700">
                                      <Printer className="w-5 h-5 mr-2" /> Print Invoice
                                   </button>
                                   <button onClick={() => { if(confirm('Cancel?')) handleStatusChange(o.id, 'cancelled') }} className="bg-white border border-gray-200 opacity-60 hover:opacity-100 hover:text-red-600 hover:bg-red-50 hover:border-red-200 px-5 py-2.5 rounded-xl font-bold transition flex items-center ml-auto">
                                      Cancel Order
                                   </button>
                                 </div>
                              </div>

                              {/* Right Sidebar */}
                              <div className="space-y-6">
                                 <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Customer Details</h3>
                                    <div className="space-y-3 font-medium text-sm text-gray-600">
                                      <div className="flex items-start gap-3"><Mail className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/> <span className="break-all">{o.customer_email || 'No email provided'}</span></div>
                                      <div className="flex items-start gap-3"><Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/> <span>{o.customer_phone}</span></div>
                                      <div className="flex items-start gap-3"><MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"/> <span>{o.customer_address?.city}, {o.customer_address?.district} <br/><span className="text-xs text-gray-400">{o.customer_address?.address}</span></span></div>
                                    </div>
                                 </div>

                                 <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Private Notes</h3>
                                    <textarea 
                                      className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-yellow-400 outline-none resize-none" 
                                      rows={3} 
                                      placeholder="Leave a note for yourself..."
                                      defaultValue={o.notes || ''}
                                      onBlur={(e) => { if(e.target.value !== o.notes) handleUpdateNotes(o.id, e.target.value) }}
                                    ></textarea>
                                 </div>
                              </div>
                           </div>
                         </div>
                      )}

                      {/* Hidden Invoice Template for PDF Generation */}
                      <div className="absolute top-[-9999px] left-[-9999px]">
                        <div id={`invoice-${o.id}`} className="w-[800px] bg-white p-12 text-black font-sans">
                           <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
                             <div>
                               <h1 className="text-4xl font-black text-blue-900">{business.name}</h1>
                               <p className="text-gray-500 font-bold mt-2 text-sm">{business.city}, {business.district?.name_en || 'Nepal'}</p>
                               <p className="text-gray-500 font-bold text-sm">{business.phone} • {business.email}</p>
                             </div>
                             <div className="text-right">
                               <h2 className="text-3xl font-black text-gray-300 tracking-widest uppercase">INVOICE</h2>
                               <p className="font-bold text-gray-800 mt-2">ID: BN-{o.id.toUpperCase()}</p>
                               <p className="font-bold text-gray-500">Date: {format(new Date(o.created_at), 'PA')}</p>
                             </div>
                           </div>
                           
                           <div className="mb-8">
                             <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Billed To:</p>
                             <p className="font-bold text-xl">{o.customer_name}</p>
                             <p className="font-medium text-gray-600">{o.customer_phone}</p>
                             <p className="font-medium text-gray-600">{o.customer_address?.address}, {o.customer_address?.city}</p>
                           </div>

                           <table className="w-full text-left mb-8">
                             <thead className="border-y-2 border-gray-900">
                               <tr>
                                 <th className="py-3 font-black uppercase text-sm">Description</th>
                                 <th className="py-3 font-black uppercase text-sm text-center">Qty</th>
                                 <th className="py-3 font-black uppercase text-sm">Unit Price</th>
                                 <th className="py-3 font-black uppercase text-sm text-right">Amount</th>
                               </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                               {o.items?.map((item:any, idx:number) => (
                                 <tr key={idx}>
                                   <td className="py-4 font-bold text-gray-800">{item.title}</td>
                                   <td className="py-4 font-bold text-gray-800 text-center">{item.quantity}</td>
                                   <td className="py-4 font-bold text-gray-800">₨ {item.price?.toLocaleString()}</td>
                                   <td className="py-4 font-black text-gray-900 text-right">₨ {(item.price * item.quantity).toLocaleString()}</td>
                                 </tr>
                               ))}
                             </tbody>
                           </table>

                           <div className="flex justify-end">
                             <div className="w-1/2">
                               <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                 <span className="font-bold text-gray-500 text-sm uppercase">Payment Method</span>
                                 <span className="font-bold uppercase">{o.payment_method}</span>
                               </div>
                               <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4 mt-4">
                                 <span className="font-black text-lg text-gray-800">Total Due</span>
                                 <span className="font-black text-2xl text-blue-900">₨ {Number(o.total || 0).toLocaleString()}</span>
                               </div>
                             </div>
                           </div>

                           <div className="mt-16 text-center text-sm font-bold text-gray-400">
                             Thank you for your business! Powered by Biznity.
                           </div>
                        </div>
                      </div>

                   </div>
                 )
               })}
             </div>
          )}
        </div>
      </div>
    </>
  )
}
