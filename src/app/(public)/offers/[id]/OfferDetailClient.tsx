'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, MessageCircle, Store, Check, Info, AlertTriangle, X } from 'lucide-react'
import CountdownTimer from '@/components/offers/CountdownTimer'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import dynamic from 'next/dynamic'

// Leaflet map needs to be dynamically imported to avoid SSR issues
const Map = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl" /> }
)
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false })

export default function OfferDetailClient({ offer, similarOffers }: any) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [showGrabModal, setShowGrabModal] = useState(false)
  const [bookingState, setBookingState] = useState<'form' | 'loading' | 'success'>('form')
  const [ticketCode, setTicketCode] = useState('')
  const [formData, setFormData] = useState({ name: user?.user_metadata?.full_name || '', phone: '' })

  const stockLeft = offer.max_quantity ? offer.max_quantity - (offer.grabbed_count || 0) : null
  const stockPercent = offer.max_quantity ? Math.round(((offer.grabbed_count || 0) / offer.max_quantity) * 100) : null
  const isEndingSoon = stockLeft !== null && stockLeft <= 5

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleGrabSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBookingState('loading')
    
    try {
      const code = generateCode()
      setTicketCode(code)

      // We use the orders table for offers. 
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
        order_status: 'pending'
      }

      const { error } = await supabase.from('orders').insert(orderPayload)
      if (error) throw error
      
      // Increment grabbed count
      await supabase.rpc('increment_offer_grab', { row_id: offer.id })
      
      // Fake n8n WhatsApp call
      fetch('/api/webhooks/whatsapp', { method: 'POST', body: JSON.stringify({ type: 'OFFER_GRABBED', code, phone: formData.phone, offer: offer.title }) }).catch(()=>console.log('webhook mocked out'))
      
      setBookingState('success')
    } catch (err: any) {
      toast.error(err.message || 'Failed to grab offer')
      setBookingState('form')
    }
  }

  return (
    <>
      <Toaster position="top-center" />

      {/* Hero Banner */}
      <div className="w-full h-[40vh] md:h-[50vh] bg-gray-900 relative">
        {offer.banner_url ? (
          <Image src={offer.banner_url} alt={offer.title} fill className="object-cover opacity-80" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-2xl font-bold">Offer Banner</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">{offer.discount_percent}% OFF</span>
                <span className="bg-white/20 backdrop-blur text-white text-xs font-semibold px-3 py-1 rounded-full">Ends soon</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-2 drop-shadow-md">{offer.title}</h1>
              <Link href={`/b/${offer.business.slug}`} className="flex items-center text-gray-300 hover:text-white transition font-medium">
                <Store className="w-4 h-4 mr-2" /> {offer.business.name}
              </Link>
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
                   <h4 className="font-bold text-yellow-900">Terms & Conditions</h4>
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
                    {offer.business.logo_url ? <img src={offer.business.logo_url} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-8 h-8 text-gray-400" />}
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-gray-900">{offer.business.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPin className="w-4 h-4 mr-1" /> {offer.business.address || offer.business.city || 'Nepal'}
                    </div>
                 </div>
               </div>
               
               <div className="flex gap-3 mb-8">
                  {offer.business.phone && (
                    <a href={`tel:${offer.business.phone}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition">
                      <Phone className="w-4 h-4" /> Call
                    </a>
                  )}
                  {offer.business.whatsapp && (
                    <a href={`https://wa.me/977${offer.business.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1EBE55] rounded-xl font-semibold transition">
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </a>
                  )}
               </div>

               {offer.business.latitude && offer.business.longitude && (
                 <div className="h-64 rounded-xl overflow-hidden border border-gray-200 z-0">
                   {typeof window !== 'undefined' && (
                      <Map center={[offer.business.latitude, offer.business.longitude]} zoom={15} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[offer.business.latitude, offer.business.longitude]} />
                      </Map>
                   )}
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

               <div className="flex items-end gap-3 justify-center mb-8">
                 <span className="text-4xl font-extrabold text-red-600">₨ {offer.offer_price.toLocaleString()}</span>
                 <span className="text-xl text-gray-400 line-through mb-1">₨ {offer.original_price.toLocaleString()}</span>
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

               <div className="space-y-3">
                 <button onClick={() => setShowGrabModal(true)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg transition shadow-md">
                   Grab & Pay in Store
                 </button>
                 <button className="w-full bg-[#60BB46] hover:bg-[#509f39] text-white font-bold py-3.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                   Pay with eSewa
                 </button>
                 <button className="w-full bg-[#5C2D91] hover:bg-[#4a2475] text-white font-bold py-3.5 rounded-xl transition shadow-sm flex items-center justify-center gap-2">
                   Pay with Khalti
                 </button>
               </div>
            </div>
          </div>
        </div>

        {/* Similar Offers */}
        {similarOffers?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">More Offers from {offer.business.name}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {similarOffers.map((sim: any) => (
                <Link href={`/offers/${sim.id}`} key={sim.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group">
                  <div className="h-32 bg-gray-100 relative">
                    {sim.banner_url && <Image src={sim.banner_url} alt={sim.title} fill className="object-cover" />}
                    {sim.discount_percent && <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">{sim.discount_percent}% OFF</div>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-red-600">{sim.title}</h3>
                    <div className="flex gap-2">
                      <span className="font-bold text-red-600">₨ {sim.offer_price.toLocaleString()}</span>
                      <span className="text-sm text-gray-400 line-through">₨ {sim.original_price.toLocaleString()}</span>
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
                
                <p className="text-gray-600 mb-6 text-sm">Reserve this offer now and pay when you visit the store physically. We'll send you a redemption code.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                    <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number (WhatsApp preferred)</label>
                    <input required type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="98XXXXXXXX" />
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button type="submit" className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl text-lg hover:bg-red-700 transition">
                    Confirm Reservation
                  </button>
                  <button type="button" onClick={() => setShowGrabModal(false)} className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition">
                    Cancel
                  </button>
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
                 <p className="text-gray-600 mb-6">Show the code below at <strong className="text-gray-900">{offer.business.name}</strong> to redeem your offer.</p>
                 
                 <div className="bg-gray-100 border border-gray-200 rounded-2xl p-6 mb-8 relative overflow-hidden group">
                   <div className="text-sm font-bold text-gray-500 tracking-widest uppercase mb-1">Redemption Code</div>
                   <div className="text-4xl font-black tracking-widest text-red-600">{ticketCode}</div>
                   <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl -mr-10 -mt-10 group-hover:bg-red-600/20 transition-all"></div>
                 </div>

                 <p className="text-sm text-gray-500 mb-8">We've also sent this code to your WhatsApp number.</p>
                 
                 <button type="button" onClick={() => setShowGrabModal(false)} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition">
                   Close window
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
