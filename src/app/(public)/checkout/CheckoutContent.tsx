'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import toast, { Toaster } from 'react-hot-toast'
import { CreditCard, Truck, Store, MapPin, User, Phone, Mail, ShoppingBag, ArrowRight, Plus, Minus, Trash2, X, Loader2 } from 'lucide-react'
import EsewaButton from '@/components/payments/EsewaButton'
import CODCheckout from '@/components/payments/CODCheckout'
import ReserveCheckout from '@/components/payments/ReserveCheckout'

export default function CheckoutContent() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const supabase = createClient()
  
  const { items, totalAmount, totalItems, clearCart, updateQuantity, removeItem } = useCartStore()
  
  // Is client mounted
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', district: '', city: '',
    latitude: null as number | null,
    longitude: null as number | null
  })
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Sync user/profile data once loaded
  useEffect(() => {
    if (!formData.name && (profile?.full_name || user?.user_metadata?.full_name)) {
      setFormData(prev => ({ ...prev, name: profile?.full_name || user?.user_metadata?.full_name }))
    }
    if (!formData.email && user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }))
    }
    if (!formData.phone && (profile?.phone || profile?.whatsapp)) {
      setFormData(prev => ({ ...prev, phone: profile?.phone || profile?.whatsapp }))
    }
    if (!formData.address && profile?.address) {
      setFormData(prev => ({ ...prev, address: profile.address }))
    }
  }, [user, profile])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser')
    }

    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }))
        setIsGettingLocation(false)
        toast.success('Location captured (Optional coordinates recorded)')
      },
      (error) => {
        setIsGettingLocation(false)
        console.error('Location error:', error)
        toast.error('Could not get location. Entering manually.')
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }
  
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
  
  // Calculate delivery fee: 100 Rs per unique business
  const uniqueBusinesses = new Set(checkoutItems.map(i => i.business_id))
  const deliveryFee = paymentMethod === 'reserve' ? 0 : uniqueBusinesses.size * 100
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
      const dbPaymentMethod = paymentMethod === 'reserve' ? 'store_pickup' : paymentMethod
      
      // DEFERRED ORDER PLACEMENT LOGIC
      // If payment is COD or Pickup, place immediately. 
      // If online (eSewa/Khalti), store in payment_attempts and create order ONLY after success.

      if (paymentMethod === 'cod' || paymentMethod === 'reserve') {
        const { data: newOrder, error } = await supabase.from('orders').insert({
          customer_id: user?.id || null,
          business_id: businessId,
          items: checkoutItems.map(i => ({ id: i.id, title: i.title, price: i.price, quantity: i.quantity })),
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: grandTotal,
          order_status: 'pending',
          payment_method: dbPaymentMethod,
          payment_status: 'pending',
          customer_name: formData.name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          delivery_address: `${formData.address}, ${formData.city}, ${formData.district}`,
          latitude: formData.latitude,
          longitude: formData.longitude
        }).select('id').single()

        if (error) throw error
        setPendingOrderId(newOrder.id)
        toast.success('Order placed successfully.', { id: toastId })
        return // Finished for COD/Pickup
      }

      // ONLINE PAYMENT FLOW: Store in payment_attempts first
      const orderMetadata = {
        customer_id: user?.id || null,
        business_id: businessId,
        items: checkoutItems.map(i => ({ id: i.id, title: i.title, price: i.price, quantity: i.quantity })),
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        total: grandTotal,
        payment_method: dbPaymentMethod,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        delivery_address: `${formData.address}, ${formData.city}, ${formData.district}`,
        latitude: formData.latitude,
        longitude: formData.longitude
      }

      const { data: attempt, error: attemptError } = await supabase.from('payment_attempts').insert({
        order_data: orderMetadata,
        status: 'pending'
      }).select('id').single()

      if (attemptError) {
        console.error('Attempt Error:', attemptError)
        throw new Error('Failed to initiate secure payment session. Please run the provided database migration SQL.')
      }

      // Use the attempt ID as the purchase order reference
      const referenceId = attempt.id

      if (paymentMethod === 'khalti') {
        const res = await fetch('/api/payments/khalti/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: grandTotal,
            orderId: referenceId, // Using attempt ID
            customerName: formData.name,
            customerPhone: formData.phone,
            customerEmail: formData.email,
            purchaseOrderName: `BizNepal Payment Ref-${referenceId.slice(0,8)}`
          })
        })
        const khaltiData = await res.json()
        if (!res.ok) throw new Error(khaltiData.error || 'Khalti setup failed')
        window.location.href = khaltiData.payment_url
      } else if (paymentMethod === 'esewa') {
        setPendingOrderId(referenceId)
        toast.success('Payment session initiated.', { id: toastId })
      }

    } catch (err: any) {
      toast.error(err.message || 'Failed to process order.', { id: toastId })
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

                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-bold text-gray-700">Detailed Address <span className="text-red-500">*</span></label>
                       <button 
                         type="button" 
                         onClick={handleGetLocation}
                         disabled={isGettingLocation || !!pendingOrderId}
                         className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full transition hover:bg-blue-100"
                       >
                         <MapPin className={`w-3 h-3 ${isGettingLocation ? 'animate-bounce' : ''}`}/>
                         {formData.latitude ? 'Location Captured' : 'Use My Current Location'}
                       </button>
                    </div>
                    <textarea required value={formData.address} onChange={e=>setFormData({...formData, address: e.target.value})} disabled={!!pendingOrderId} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 resize-none" rows={2} placeholder="Street name, near landmarks, house number..." />
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
                  
                   <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 no-scrollbar mb-6">
                     {checkoutItems.map((item, idx) => (
                        <div key={idx} className="flex gap-4 group/item">
                           <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shrink-0 border border-gray-200 relative">
                              {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300"><ShoppingBag className="w-6 h-6"/></div>}
                              {!directItem && (
                                <button 
                                  onClick={() => removeItem(item.id)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity shadow-sm"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                           </div>
                          <div className="flex-1">
                             <h4 className="font-bold text-gray-900 text-sm line-clamp-1 leading-tight">{item.title}</h4>
                             <p className="text-xs font-extrabold text-blue-600 mt-0.5">₨ {item.price.toLocaleString()}</p>
                             
                             {/* Quantity Controls */}
                             <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                                   <button 
                                     onClick={() => {
                                       if (directItem) setDirectItem({...directItem, quantity: Math.max(1, directItem.quantity - 1)})
                                       else updateQuantity(item.id, Math.max(1, item.quantity - 1))
                                     }}
                                     className="p-1 px-2 hover:bg-gray-100 text-gray-500 transition border-r border-gray-200"
                                   >
                                     <Minus className="w-3 h-3" />
                                   </button>
                                   <span className="px-2.5 text-xs font-black text-gray-900">{item.quantity}</span>
                                   <button 
                                     onClick={() => {
                                       if (directItem) setDirectItem({...directItem, quantity: directItem.quantity + 1})
                                       else updateQuantity(item.id, item.quantity + 1)
                                     }}
                                     className="p-1 px-2 hover:bg-gray-100 text-gray-500 transition border-l border-gray-200"
                                   >
                                     <Plus className="w-3 h-3" />
                                   </button>
                                </div>
                                {!directItem && (
                                  <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                             </div>
                          </div>
                          <div className="text-right shrink-0">
                             <p className="font-black text-gray-900 text-sm">₨ {(item.price * item.quantity).toLocaleString()}</p>
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
