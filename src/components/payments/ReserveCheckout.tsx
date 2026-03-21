'use client'

import React, { useState } from 'react'
import { Store, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface ReserveProps {
  orderId: string
  onSuccess: () => void
}

export default function ReserveCheckout({ orderId, onSuccess }: ReserveProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const supabase = createClient()

  const handleConfirm = async () => {
    setIsProcessing(true)
    const toastId = toast.loading('Reserving your items...')
    
    try {
      const { error } = await supabase.from('orders').update({
         payment_method: 'reserve',
         payment_status: 'pending',
         order_status: 'pending',
         notes: 'Reserved for Store Pickup'
      }).eq('id', orderId)
      
      if (error) throw error

      toast.success('Items Reserved successfully!', { id: toastId })
      onSuccess()
    } catch {
      toast.error('Failed to reserve. Network error.', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="border border-blue-200 rounded-3xl p-6 bg-blue-50/50 animate-in slide-in-from-top-2">
       <div className="flex items-start gap-4 mb-6">
         <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
           <Store className="w-6 h-6" />
         </div>
         <div>
           <h3 className="font-extrabold text-blue-900 text-lg">Reserve & Pick Up</h3>
           <p className="text-sm font-medium text-blue-800/80 mt-1 mb-2">Secure this item digitally. You will pay directly at the store counter when you arrive.</p>
           <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-black uppercase tracking-widest rounded-lg">
             <Clock className="w-3.5 h-3.5"/> Holds for 24 Hours
           </span>
         </div>
       </div>

       <button 
         disabled={isProcessing}
         onClick={handleConfirm}
         className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-2xl py-4 font-bold transition flex items-center justify-center shadow-lg shadow-blue-600/20"
       >
         {isProcessing ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"/> : 'Lock My Reservation (Free)'}
       </button>
       
       <p className="text-center text-xs font-bold text-blue-600/60 mt-4 leading-relaxed tracking-tight px-4">
         Inventory is locked in your name safely. If you don't arrive within 24 hours, the store may automatically cancel the reservation to serve other waiting customers.
       </p>
    </div>
  )
}
