'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import toast, { Toaster } from 'react-hot-toast'
import { CreditCard, Truck, Store, MapPin, User, Phone, Mail, ShoppingBag, ArrowRight } from 'lucide-react'
import EsewaButton from '@/components/payments/EsewaButton'
import CODCheckout from '@/components/payments/CODCheckout'
import ReserveCheckout from '@/components/payments/ReserveCheckout'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClient()
  
  const { items, totalAmount, totalItems, clearCart } = useCartStore()
  
  // Is client mounted
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', district: '', city: ''
  })
  
  const searchParams = useSearchParams()
  const [directItem, setDirectItem] = useState<any>(null)
  
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'khalti' | 'cod' | 'reserve'>((searchParams.get('method') as any) || 'esewa')
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch direct product if in URL
  useEffect(() => {
    const pId = searchParams.get('productId')
    const qty = searchParams.get('quantity')
    
    if (pId) {
      const fetchDirect = async () => {
        const { data } = await supabase.from('products').select('id, name, price, image_keys, business_id').eq('id', pId).single()
        if (data) {
          setDirectItem({
            id: data.id,
            title: data.name,
            price: data.price,
            business_id: data.business_id,
            quantity: parseInt(qty || '1'),
            image_url: data.image_keys?.[0]
          })
        }
      }
      fetchDirect()
    }
  }, [searchParams, supabase])

  const checkoutItems = directItem ? [directItem] : items
  const subtotal = directItem ? (directItem.price * directItem.quantity) : totalAmount()
  const deliveryFee = paymentMethod === 'reserve' ? 0 : 100
  const grandTotal = subtotal + deliveryFee

  if (!mounted) return null

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center justify-center text-center">
         <ShoppingBag className="w-20 h-20 text-gray-200 mb-6" />
         <h1 className="text-3xl font-black text-gray-900 mb-2">Your Cart is Empty</h1>
         <p className="text-gray-500 font-medium mb-8">Add some amazing products to your cart before checking out.</p>
         <button onClick={()=>router.push('/')} className="px-8 py-3.5 bg-gray-900 text-white rounded-xl font-bold transition hover:bg-gray-800 shadow-xl shadow-gray-900/20">
           Browse BizNepal
         </button>
      </div>
    )
  }

  // To combine items, we assume they all go to one business for now, or the backend logic supports multi-vendor.
  // For simplicity, we just assign to the first item's business_id. In a true multi-vendor cart, we'd split orders.
  const businessId = checkoutItems[0]?.business_id

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.phone || !formData.address) return toast.error('Please fill all required delivery details.')

    setIsProcessing(true)
    const toastId = toast.loading('Generating secure order...')

    try {
      // 1. Create a master Order in Supabase
      const { data: newOrder, error } = await supabase.from('orders').insert({
         user_id: user?.id || null,
         business_id: businessId,
         items: checkoutItems.map(i => ({ id: i.id, title: i.title, price: i.price, quantity: i.quantity })),
         total: grandTotal,
         order_status: 'pending',
         payment_method: paymentMethod,
         payment_status: 'pending',
         customer_name: formData.name,
         customer_email: formData.email,
         customer_phone: formData.phone,
         customer_address: { district: formData.district, city: formData.city, address: formData.address }
      }).select('id').single()

      if (error) throw error

      setPendingOrderId(newOrder.id)
      toast.success('Order logged successfully. Awaiting payment.', { id: toastId })

      // 2. If Khalti, init logic directly
      if (paymentMethod === 'khalti') {
         const res = await fetch('/api/payments/khalti/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               amount: grandTotal,
               orderId: newOrder.id,
               customerName: formData.name,
               customerPhone: formData.phone,
               customerEmail: formData.email,
               purchaseOrderName: `BizNepal Order BN-${newOrder.id.slice(0,8)}`
            })
         })
         const khaltiData = await res.json()
         if (!res.ok) throw new Error(khaltiData.error || 'Khalti setup failed')
         
         // Redirect to Khalti payment page
         window.location.href = khaltiData.payment_url
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to generate order.', { id: toastId })
      setPendingOrderId(null)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-32 pb-20">
      <Toaster position="top-right" />
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
         <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Secure Checkout</h1>

         <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left: Input Form */}
            <div className="lg:col-span-7 space-y-8">
               
               {/* 1. Contact & Delivery Info */}
               <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                 <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2"><MapPin className="w-5 h-5 text-blue-600"/> Delivery Details</h2>
                 
                 <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                       <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                         <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} disabled={!!pendingOrderId} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50" placeholder="Ram Bahadur" />
                         </div>
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                         <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input required value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} disabled={!!pendingOrderId} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50" placeholder="98XXXXXXXX" />
                         </div>
                       </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                      <div className="relative">
                         <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                         <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} disabled={!!pendingOrderId} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50" placeholder="ram@example.com (Optional)" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5 pt-2">
                       <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">District <span className="text-red-500">*</span></label>
                         <input required value={formData.district} onChange={e=>setFormData({...formData, district: e.target.value})} disabled={!!pendingOrderId} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50" placeholder="e.g. Kathmandu" />
                       </div>
                       <div>
                         <label className="block text-sm font-bold text-gray-700 mb-2">City / Area <span className="text-red-500">*</span></label>
                         <input required value={formData.city} onChange={e=>setFormData({...formData, city: e.target.value})} disabled={!!pendingOrderId} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50" placeholder="e.g. Thamel" />
                       </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Detailed Address <span className="text-red-500">*</span></label>
                      <textarea required value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} disabled={!!pendingOrderId} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 resize-none" rows={2} placeholder="Street name, near landmarks, house number..." />
                    </div>
                 </form>
               </div>

               {/* 2. Payment Method */}
               <div className={`bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 transition-opacity ${pendingOrderId && paymentMethod !== 'reserve' && paymentMethod !== 'cod' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-600"/> Payment Method</h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                     <button type="button" onClick={() => setPaymentMethod('esewa')} disabled={!!pendingOrderId} className={`p-4 rounded-2xl border-2 text-left transition disabled:opacity-50 ${paymentMethod === 'esewa' ? 'border-[#60A130] bg-[#60A130]/5' : 'border-gray-200 hover:border-[#60A130]'}`}>
                        <div className="w-8 h-8 font-black text-[#60A130] bg-white rounded flex items-center justify-center shadow-sm mb-3 border border-gray-100">eS</div>
                        <h4 className="font-extrabold text-gray-900">eSewa Wallet</h4>
                        <p className="text-xs font-bold text-gray-500 mt-1">Pay instantly via eSewa</p>
                     </button>

                     <button type="button" onClick={() => setPaymentMethod('khalti')} disabled={!!pendingOrderId} className={`p-4 rounded-2xl border-2 text-left transition disabled:opacity-50 ${paymentMethod === 'khalti' ? 'border-[#5C2D91] bg-[#5C2D91]/5' : 'border-gray-200 hover:border-[#5C2D91]'}`}>
                        <div className="w-8 h-8 font-black text-[#5C2D91] bg-white rounded flex items-center justify-center shadow-sm mb-3 border border-gray-100">K</div>
                        <h4 className="font-extrabold text-gray-900">Khalti Gateway</h4>
                        <p className="text-xs font-bold text-gray-500 mt-1">Pay securely via Khalti</p>
                     </button>

                     <button type="button" onClick={() => setPaymentMethod('cod')} disabled={!!pendingOrderId} className={`p-4 rounded-2xl border-2 text-left transition disabled:opacity-50 ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-500'}`}>
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-sm mb-3 border border-gray-100"><Truck className="w-4 h-4 text-orange-500"/></div>
                        <h4 className="font-extrabold text-gray-900">Cash on Delivery</h4>
                        <p className="text-xs font-bold text-gray-500 mt-1">Pay Rs {deliveryFee} delivery fee</p>
                     </button>

                     <button type="button" onClick={() => setPaymentMethod('reserve')} disabled={!!pendingOrderId} className={`p-4 rounded-2xl border-2 text-left transition disabled:opacity-50 ${paymentMethod === 'reserve' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-500'}`}>
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center shadow-sm mb-3 border border-gray-100"><Store className="w-4 h-4 text-blue-500"/></div>
                        <h4 className="font-extrabold text-gray-900">Reserve & Pick Up</h4>
                        <p className="text-xs font-bold text-gray-500 mt-1">Free reserving for 24 hours</p>
                     </button>
                  </div>
               </div>

               {/* Render Actual Gateway Handlers once Order is Pending */}
               {pendingOrderId && (
                 <div className="mt-8">
                    {paymentMethod === 'esewa' && (
                       <div className="animate-in slide-in-from-top-2">
                         <EsewaButton amount={grandTotal} orderId={pendingOrderId} productName="BizNepal Cart" />
                       </div>
                    )}
                    {paymentMethod === 'khalti' && (
                       <div className="p-6 text-center border-2 border-[#5C2D91] border-dashed rounded-3xl bg-[#5C2D91]/5">
                          <span className="animate-spin w-8 h-8 border-4 border-[#5C2D91]/30 border-t-[#5C2D91] rounded-full inline-block mb-4"/>
                          <h3 className="font-bold text-[#5C2D91]">Redirecting to Khalti...</h3>
                       </div>
                    )}
                    {paymentMethod === 'cod' && (
                       <CODCheckout orderId={pendingOrderId} totalAmount={grandTotal} onSuccess={()=>{ clearCart(); router.push(`/dashboard/orders`); }} />
                    )}
                    {paymentMethod === 'reserve' && (
                       <ReserveCheckout orderId={pendingOrderId} onSuccess={()=>{ clearCart(); router.push(`/dashboard/orders`); }} />
                    )}
                 </div>
               )}

            </div>


            {/* Right: Cart Summary */}
            <div className="lg:col-span-5 sticky top-32">
               <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-black text-gray-900 mb-6">Order Summary</h3>
                  
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar mb-6">
                     {checkoutItems.map((item, idx) => (
                        <div key={idx} className="flex gap-4">
                           <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                              {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300"><ShoppingBag className="w-6 h-6"/></div>}
                           </div>
                          <div className="flex-1">
                             <h4 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">{item.title}</h4>
                             <p className="text-xs font-bold text-gray-400 mt-1">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right shrink-0">
                             <p className="font-extrabold text-blue-900 text-sm">₨ {(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                       </div>
                     ))}
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-100 border-dashed">
                     <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                        <span>Subtotal ({directItem ? directItem.quantity : totalItems()} items)</span>
                        <span className="text-gray-900">₨ {subtotal.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                        <span>Delivery Fee</span>
                        {paymentMethod === 'reserve' ? (
                           <span className="text-green-500 line-through">₨ 100</span>
                        ) : (
                           <span className="text-gray-900">₨ {deliveryFee.toLocaleString()}</span>
                        )}
                     </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-gray-100 flex justify-between items-end">
                     <div>
                       <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Due</p>
                       <p className="text-3xl font-black text-gray-900 tracking-tight">₨ {grandTotal.toLocaleString()}</p>
                     </div>
                  </div>

                  {!pendingOrderId && (
                    <button 
                      form="checkout-form"
                      disabled={isProcessing}
                      type="submit" 
                      className="w-full mt-8 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl py-4 font-bold transition flex items-center justify-center shadow-xl shadow-gray-900/20 disabled:opacity-70 group"
                    >
                      {isProcessing ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"/> : <><CreditCard className="w-5 h-5 mr-2" /> Proceed to Payment <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"/></>}
                    </button>
                  )}
               </div>

               <p className="text-xs text-center font-bold text-gray-400 mt-6 leading-relaxed px-4">
                 Your transactions are fully secured. By placing an order, you agree to BizNepal's <a href="#" className="underline hover:text-gray-600">Terms of Service</a> and <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
               </p>
            </div>

         </div>
      </div>
    </div>
  )
}
