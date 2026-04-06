'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import BookingConfirmation from '@/components/events/BookingConfirmation'
import { createClient } from '@/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'
import { Calendar, MapPin, ArrowRight, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function BookingFlowClient({ event }: any) {
  const { user, profile } = useAuth()
  const supabase = createClient()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    seats: 1,
    paymentMethod: event.is_free ? 'free' : 'esewa'
  })

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
  }, [user, profile])

  // Basic validation rules
  const isStep1Valid = formData.name.trim() !== '' && formData.phone.trim() !== '' && formData.seats > 0

  const handleNext = () => {
    if (step === 1) {
      if (!isStep1Valid) {
        toast.error("Please fill in all required fields")
        return
      }
      
      if (event.is_free) {
        // Skip step 2 for free events
        handleConfirmBooking()
      } else {
        setStep(2)
      }
    }
  }

  const generateTicketCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  const handleConfirmBooking = async () => {
    setIsSubmitting(true)
    
    try {
      const ticketCode = generateTicketCode()
      const totalAmount = event.is_free ? 0 : (event.price * formData.seats)

      const bookingPayload = {
        event_id: event.id,
        user_id: user?.id || null,
        attendee_name: formData.name,
        attendee_email: formData.email,
        attendee_phone: formData.phone,
        seats: formData.seats,
        total_amount: totalAmount,
        payment_method: event.is_free ? 'free' : formData.paymentMethod,
        payment_status: event.is_free ? 'paid' : 'pending',
        ticket_code: ticketCode,
        status: 'confirmed'
      }

      // 1. Insert Booking
      const { data: bData, error: bErr } = await supabase.from('event_bookings').insert(bookingPayload).select().single()
      if (bErr) throw bErr

      // 2. Update Event Seats Count (Simple approach, RPC would be better)
      const { error: seatErr } = await supabase.from('events').update({
        booked_seats: (event.booked_seats || 0) + formData.seats
      }).eq('id', event.id)
      
      // 3. Trigger Webhook through API proxy
      fetch('/api/webhooks/event-booking', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.starts_at,
          venueName: event.venue_name,
          businessId: event.business_id,
          attendeeName: formData.name,
          attendeePhone: formData.phone,
          attendeeUserId: user?.id,
          seats: formData.seats,
          totalAmount: totalAmount,
          ticketCode: ticketCode
        }) 
      }).catch(e => console.error('Booking webhook failed:', e))

      setBookingResult(bData)
      setStep(3)
      toast.success("Booking Confirmed!")

    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to process booking")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 3 && bookingResult) {
    return <BookingConfirmation booking={bookingResult} event={event} />
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto">
        
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= 1 ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>1</div>
            <div className={`w-full h-1 ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= 2 ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>2</div>
            <div className={`w-full h-1 ${step >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${step >= 3 ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>3</div>
          </div>
          <div className="flex justify-between mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>Details</span>
            <span>Payment</span>
            <span>Ticket</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          
          {/* Event Summary Banner */}
          <div className="bg-gray-50 p-6 border-b border-gray-100 flex items-center gap-6">
             <div className="hidden sm:block w-24 h-24 rounded-xl bg-gray-200 overflow-hidden relative">
               {event.banner_url && <img src={event.banner_url} className="w-full h-full object-cover" alt="" />}
             </div>
             <div>
               <h2 className="text-xl font-bold text-gray-900 mb-2 truncate">{event.title}</h2>
               <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                 <div className="flex items-center"><Calendar className="w-4 h-4 mr-1"/> {format(new Date(event.starts_at), 'MMM d, h:mm a')}</div>
                 <div className="flex items-center"><MapPin className="w-4 h-4 mr-1 truncate"/> {event.venue_name || 'Online'}</div>
               </div>
             </div>
          </div>

          <div className="p-6 md:p-8">
            
            {/* STEP 1: Attendee Details */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Attendee Information</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp / Phone *</label>
                    <input type="tel" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="98XXXXXXXX" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Seats *</label>
                  <div className="flex items-center">
                    <button type="button" onClick={() => setFormData({...formData, seats: Math.max(1, formData.seats - 1)})} className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-l-xl font-bold text-lg">-</button>
                    <input type="number" value={formData.seats} readOnly className="w-20 h-12 text-center bg-white border-y border-gray-200 font-bold text-gray-900 focus:outline-none" />
                    <button type="button" onClick={() => setFormData({...formData, seats: formData.seats + 1})} className="w-12 h-12 flex items-center justify-center bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-r-xl font-bold text-lg">+</button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Maximum 10 seats per booking.</p>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xl font-bold text-gray-900">
                    Total: {event.is_free ? <span className="text-green-600">FREE</span> : `₨ ${(event.price * formData.seats).toLocaleString()}`}
                  </div>
                  <button onClick={handleNext} disabled={!isStep1Valid} className="bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 text-white font-bold px-8 py-3.5 rounded-xl transition flex items-center gap-2">
                    {event.is_free ? (isSubmitting ? 'Confirming...' : 'Confirm Booking') : 'Continue to Payment'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Checkout / Payment */}
            {step === 2 && !event.is_free && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <button onClick={() => setStep(1)} className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition -ml-2 p-2"><ArrowLeft className="w-4 h-4 mr-1"/> Back to Details</button>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Payment Method</h3>

                <div className="space-y-4">
                   <label className={`block border-2 rounded-2xl p-4 cursor-pointer transition ${formData.paymentMethod === 'esewa' ? 'border-[#60BB46] bg-[#60BB46]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                     <div className="flex items-center">
                       <input type="radio" checked={formData.paymentMethod === 'esewa'} onChange={() => setFormData({...formData, paymentMethod: 'esewa'})} className="w-5 h-5 text-[#60BB46] focus:ring-[#60BB46]" />
                       <div className="ml-4 flex-1 font-bold text-gray-900">Pay with eSewa</div>
                       <div className="w-16 h-auto"><img src="https://esewa.com.np/common/images/esewa_logo.png" alt="eSewa" className="w-full object-contain" /></div>
                     </div>
                   </label>

                   <label className={`block border-2 rounded-2xl p-4 cursor-pointer transition ${formData.paymentMethod === 'khalti' ? 'border-[#5C2D91] bg-[#5C2D91]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                     <div className="flex items-center">
                       <input type="radio" checked={formData.paymentMethod === 'khalti'} onChange={() => setFormData({...formData, paymentMethod: 'khalti'})} className="w-5 h-5 text-[#5C2D91] focus:ring-[#5C2D91]" />
                       <div className="ml-4 flex-1 font-bold text-gray-900">Pay with Khalti</div>
                       <div className="w-16 h-auto text-center font-black text-[#5C2D91] uppercase text-xl">Khalti</div>
                     </div>
                   </label>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl mt-8">
                  <div className="flex justify-between mb-2 text-sm font-semibold text-gray-600">
                    <span>{formData.seats}x Ticket ({event.title})</span>
                    <span>₨ {(event.price * formData.seats).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-4 mt-4 font-black text-xl text-gray-900">
                    <span>Total Amount</span>
                    <span>₨ {(event.price * formData.seats).toLocaleString()}</span>
                  </div>
                </div>

                <button onClick={handleConfirmBooking} disabled={isSubmitting} className="w-full bg-gray-900 disabled:opacity-50 disabled:bg-gray-700 hover:bg-black text-white font-bold py-4 rounded-xl transition text-lg shadow-lg">
                  {isSubmitting ? 'Processing Payment...' : (formData.paymentMethod === 'esewa' ? 'Checkout with eSewa' : 'Checkout with Khalti')}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
