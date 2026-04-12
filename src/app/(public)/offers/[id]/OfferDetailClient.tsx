'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, MessageCircle, Store, Check, Info, AlertTriangle, X, ArrowRight, Flame } from 'lucide-react'
import CountdownTimer from '@/components/offers/CountdownTimer'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import dynamic from 'next/dynamic'
import EsewaButton from '@/components/payments/EsewaButton'
import { useRouter } from 'next/navigation'
import { hasOnlinePayment, buildWhatsAppUrl } from '@/lib/payments'

const SimpleMap = dynamic(() => import('@/components/ui/SimpleMap'), { 
  ssr: false, 
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" /> 
})

export default function OfferDetailClient({ offer, similarOffers }: { offer: any; similarOffers: any[] }) {
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const business = offer.business
  const onlinePayment = hasOnlinePayment(business)

  const [showGrabModal, setShowGrabModal] = useState(false)
  const [bookingState, setBookingState] = useState<'form' | 'loading' | 'success'>('form')
  const [ticketCode, setTicketCode] = useState('')
  const [formData, setFormData] = useState({ name: user?.user_metadata?.full_name || '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState<'esewa' | 'khalti' | 'store_pickup'>('store_pickup')
  const [isProcessing, setIsProcessing] = useState(false)

  const stockLeft = offer.max_quantity ? offer.max_quantity - (offer.grabbed_count || 0) : null
  const stockPercent = offer.max_quantity ? Math.round(((offer.grabbed_count || 0) / offer.max_quantity) * 100) : null
  const isEndingSoon = stockLeft !== null && stockLeft <= 5

  const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase()

  /** Case A — No merchant & WhatsApp: track first, then WhatsApp claim */
  const handleWhatsAppClaim = async () => {
    if (!business?.whatsapp) return
    setIsProcessing(true)
    const tid = toast.loading('Initiating claim...')
    try {
      const code = generateCode()
      setTicketCode(code)
      const orderPayload = {
        business_id: offer.business_id,
        customer_id: user?.id || null,
        customer_name: user?.user_metadata?.full_name || 'Customer',
        customer_phone: '',
        items: [{ offer_id: offer.id, title: offer.title, price: offer.offer_price }],
        subtotal: offer.offer_price,
        total: offer.offer_price,
        payment_method: 'whatsapp',
        payment_status: 'pending',
        notes: `WHATSAPP INQUIRY / CODE: ${code}`,
        order_status: 'pending',
      }
      const { error } = await supabase.from('orders').insert(orderPayload)
      if (error) throw error
      await supabase.rpc('increment_offer_grab', { row_id: offer.id })

      toast.success('Generated code!', { id: tid })
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://biz-nepal.vercel.app'
      const msg = `Hi, I want to claim this offer:\n*${offer.title}*\nPrice: NPR ${offer.offer_price?.toLocaleString()} (was NPR ${offer.original_price?.toLocaleString()})\nMy Code: *${code}*\nLink: ${appUrl}/offers/${offer.id}`
      window.open(buildWhatsAppUrl(business.whatsapp, msg), '_blank')
      router.refresh()
    } catch (err: any) {
      toast.error('Failed to initiate claim', { id: tid })
    } finally {
      setIsProcessing(false)
    }
  }

  /** Case A fallback — store pickup (when no whatsapp either) */
  const handleGrabSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingState('loading')
    try {
      const code = generateCode()
      setTicketCode(code)
      const orderPayload = {
        business_id: offer.business_id,
        customer_id: user?.id || null,
        customer_name: formData.name,
        customer_phone: formData.phone,
        items: [{ offer_id: offer.id, title: offer.title, price: offer.offer_price }],
        subtotal: offer.offer_price,
        total: offer.offer_price,
        payment_method: 'store_pickup',
        payment_status: 'pending',
        notes: `STORE REDEMPTION CODE: ${code}`,
        order_status: 'pending',
      }
      const { error } = await supabase.from('orders').insert(orderPayload)
      if (error) throw error
      await supabase.rpc('increment_offer_grab', { row_id: offer.id })
      setBookingState('success')
      setTimeout(() => router.refresh(), 2000)
    } catch (err: any) {
      toast.error(err.message || 'Failed to grab offer')
      setBookingState('form')
    }
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* Hero Banner */}
      <div className="w-full h-[45vh] md:h-[60vh] bg-gray-950 relative overflow-hidden">
        {offer.banner_url ? (
          <Image src={offer.banner_url} alt={offer.title} fill sizes="100vw" className="object-cover opacity-60 scale-105" priority />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 text-4xl font-black tracking-tighter">BIZNEPAL DEALS</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/80 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="bg-red-600 text-white text-sm font-black px-4 py-1.5 rounded-2xl shadow-xl shadow-red-600/20 rotate-[-2deg] flex items-center gap-2">
                  <Flame className="w-4 h-4 fill-white" />
                  {offer.discount_percent}% OFF EXCLUSIVE
                </span>
                <span className="bg-white/10 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-2xl border border-white/10">LIMITED STOCK</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight drop-shadow-2xl">{offer.title}</h1>
              <div className="flex items-center gap-6">
                <Link href={`/businesses/${business.slug}`} className="group flex items-center bg-white/5 backdrop-blur-sm border border-white/10 pl-2 pr-5 py-2 rounded-2xl hover:bg-white/10 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden mr-3">
                    {business.logo_url ? <img src={business.logo_url} alt="" className="w-full h-full object-cover"/> : <Store className="w-5 h-5 text-gray-900" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">OFFER BY</p>
                    <p className="text-white font-bold leading-none">{business.name}</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
               <h2 className="text-2xl font-bold text-gray-900 mb-6">Offer Details</h2>
               <div className="prose max-w-none text-gray-600 leading-relaxed mb-8">
                 {offer.description || 'No detailed description provided.'}
               </div>
               
               <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl flex gap-4 mt-8">
                 <Info className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                 <div>
                   <h4 className="font-bold text-yellow-900">Terms &amp; Conditions</h4>
                   <ul className="list-disc ml-4 mt-2 text-sm text-yellow-800 space-y-1">
                     <li>Offer valid only until stock lasts.</li>
                     <li>Cannot be combined with other ongoing promotions.</li>
                     <li>Business reserves the right to modify or cancel the offer.</li>
                   </ul>
                 </div>
               </div>
            </div>

            {/* Business Info & Map */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
               <h2 className="text-xl font-bold text-gray-900 mb-6">About the Business</h2>
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {business.logo_url ? <img src={business.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-gray-400" />}
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-gray-900">{business.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4 mr-1" /> {business.address || business.city || 'Nepal'}
                    </div>
                 </div>
               </div>
               
               <div className="flex gap-3 mb-8">
                  {business.phone && (
                    <a href={`tel:${business.phone}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition">
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                  {business.whatsapp && (
                    <a href={`https://wa.me/977${business.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1EBE55] rounded-xl font-semibold transition">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
               </div>

               {business.latitude && business.longitude && (
                 <div className="h-64 rounded-xl overflow-hidden border border-gray-200 z-0">
                    <SimpleMap center={[business.latitude, business.longitude]} markerPosition={[business.latitude, business.longitude]} />
                 </div>
               )}
            </div>
          </div>

          {/* Right Column (Sticky Checkout) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 sticky top-24">
               <div className="flex justify-center mb-6">
                 <CountdownTimer endsAt={offer.ends_at} />
               </div>

               {/* Discount badge + Pricing */}
               <div className="text-center mb-6">
                 <span className="inline-block bg-red-600 text-white text-sm font-black px-4 py-1.5 rounded-full mb-4">
                   {offer.discount_percent}% OFF
                 </span>
                 <div className="flex items-end gap-3 justify-center">
                   <span className="text-4xl font-extrabold text-red-600">₨ {offer.offer_price?.toLocaleString()}</span>
                   <span className="text-xl text-gray-400 line-through mb-1">₨ {offer.original_price?.toLocaleString()}</span>
                 </div>
               </div>

               {stockPercent !== null && (
                  <div className="mb-6 bg-gray-50 p-4 rounded-2xl">
                    <div className="flex justify-between text-sm font-semibold mb-2 text-gray-700">
                      <span>{offer.grabbed_count || 0} claimed</span>
                      {isEndingSoon ? <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Only {stockLeft} left</span> : <span>{stockLeft} left</span>}
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isEndingSoon ? 'bg-red-500' : 'bg-red-400'}`} style={{ width: `${Math.min(stockPercent, 100)}%` }}></div>
                    </div>
                  </div>
               )}

               {/* CASE A — No merchant: WhatsApp claim & Store Grab */}
               {!onlinePayment && (
                 <div className="space-y-3">
                   {business.whatsapp && (
                     <button
                       onClick={handleWhatsAppClaim}
                       disabled={isProcessing}
                       className="w-full bg-[#25D366] hover:bg-[#1ebe5a] disabled:opacity-50 text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-[#25D366]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                       <MessageCircle className="w-5 h-5" /> Claim via WhatsApp
                     </button>
                   )}
                   <button
                     onClick={() => { setPaymentMethod('store_pickup'); setShowGrabModal(true); }}
                     className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                   >
                     Grab Deal & Pay at Store <ArrowRight className="w-4 h-4" />
                   </button>
                 </div>
               )}

               {/* CASE B — Has merchant: online payment options */}
               {onlinePayment && (
                 <div className="space-y-4">
                   <button
                     onClick={() => { setPaymentMethod('store_pickup'); setShowGrabModal(true) }}
                     className={`w-full p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'store_pickup' ? 'border-red-600 bg-red-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                   >
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-left">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === 'store_pickup' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}><Store className="w-5 h-5" /></div>
                         <div>
                           <p className="font-black text-gray-900 leading-tight">Pay in Store</p>
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Grab Code &amp; Pay Locally</p>
                         </div>
                       </div>
                       {paymentMethod === 'store_pickup' && <Check className="w-5 h-5 text-red-600" />}
                     </div>
                   </button>

                   {business.esewa_merchant_id && (
                     <button onClick={() => setPaymentMethod('esewa')}
                       className={`w-full p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'esewa' ? 'border-[#60BB46] bg-[#60BB46]/5' : 'border-gray-100 hover:border-gray-200'}`}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-left">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${paymentMethod === 'esewa' ? 'bg-[#60BB46] text-white' : 'bg-gray-100 text-[#60BB46]'}`}>eS</div>
                           <div><p className="font-black text-gray-900 leading-tight">eSewa Wallet</p><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Instant Digital Payment</p></div>
                         </div>
                         {paymentMethod === 'esewa' && <Check className="w-5 h-5 text-[#60BB46]" />}
                       </div>
                     </button>
                   )}

                   {business.khalti_merchant_id && (
                     <button onClick={() => setPaymentMethod('khalti')}
                       className={`w-full p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'khalti' ? 'border-[#5C2D91] bg-[#5C2D91]/5' : 'border-gray-100 hover:border-gray-200'}`}
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 text-left">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${paymentMethod === 'khalti' ? 'bg-[#5C2D91] text-white' : 'bg-gray-100 text-[#5C2D91]'}`}>K</div>
                           <div><p className="font-black text-gray-900 leading-tight">Khalti SDK</p><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Secure Gateway</p></div>
                         </div>
                         {paymentMethod === 'khalti' && <Check className="w-5 h-5 text-[#5C2D91]" />}
                       </div>
                     </button>
                   )}

                   <div className="pt-2">
                     {paymentMethod === 'store_pickup' ? (
                       <button onClick={() => setShowGrabModal(true)}
                         className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                         Claim Offer <ArrowRight className="w-4 h-4" />
                       </button>
                     ) : paymentMethod === 'esewa' ? (
                       <EsewaButton amount={offer.offer_price} orderId={`OFFER-${offer.id.slice(0, 8)}`} productName={offer.title} />
                     ) : (
                       <button
                         onClick={async () => {
                           setIsProcessing(true)
                           const tid = toast.loading('Initiating Khalti...')
                           try {
                             const res = await fetch('/api/payments/khalti/initiate', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ amount: offer.offer_price, orderId: offer.id, customerName: formData.name || 'Customer', purchaseOrderName: offer.title }),
                             })
                             const data = await res.json()
                             if (data.payment_url) window.location.href = data.payment_url
                             else throw new Error('Failed to get payment link')
                           } catch (e: any) {
                             toast.error(e.message, { id: tid })
                           } finally { setIsProcessing(false) }
                         }}
                         disabled={isProcessing}
                         className="w-full bg-[#5C2D91] hover:bg-[#4a2475] text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-[#5C2D91]/20 transition-all flex items-center justify-center gap-2"
                       >
                         {isProcessing ? 'Connecting...' : 'Pay with Khalti'}
                       </button>
                     )}
                   </div>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Similar Offers */}
        {similarOffers?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Offers from {business.name}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {similarOffers.map((sim: any) => (
                <Link href={`/offers/${sim.id}`} key={sim.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                  <div className="h-32 bg-gray-100 relative">
                    {sim.banner_url && <Image src={sim.banner_url} alt={sim.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition duration-500" />}
                    {sim.discount_percent && <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">{sim.discount_percent}% OFF</div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600">{sim.title}</h3>
                    <div className="flex gap-2">
                      <span className="font-bold text-red-600">₨ {sim.offer_price?.toLocaleString()}</span>
                      <span className="text-sm text-gray-400 line-through">₨ {sim.original_price?.toLocaleString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GRAB & PAY MODAL */}
      {showGrabModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {bookingState === 'form' && (
              <form onSubmit={handleGrabSubmit} className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Grab Deal</h3>
                  <button type="button" onClick={() => setShowGrabModal(false)} className="text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full p-1"><X className="w-5 h-5"/></button>
                </div>
                <p className="text-gray-600 mb-6 text-sm">Reserve this offer now and pay when you visit the store. We&apos;ll give you a redemption code.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="98XXXXXXXX" />
                  </div>
                </div>
                <div className="mt-8 space-y-3">
                  <button type="submit" className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-red-700 transition">Confirm Reservation</button>
                  <button type="button" onClick={() => setShowGrabModal(false)} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition">Cancel</button>
                </div>
              </form>
            )}
            {bookingState === 'loading' && (
              <div className="p-12 text-center">
                <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900">Reserving your deal...</h3>
              </div>
            )}
            {bookingState === 'success' && (
              <div className="p-6 md:p-8 text-center text-gray-900">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Check className="w-8 h-8 text-green-600" />
                 </div>
                 <h3 className="text-2xl font-bold mb-2">Deal Reserved!</h3>
                 <p className="text-gray-600 mb-6">Show the code below at <strong className="text-gray-900">{business.name}</strong> to redeem your offer.</p>
                 <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 mb-8">
                   <div className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-1">Redemption Code</div>
                   <div className="text-4xl font-black tracking-widest text-red-600">{ticketCode}</div>
                 </div>
                 <button type="button" onClick={() => setShowGrabModal(false)} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition">Close window</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
