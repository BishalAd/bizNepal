'use client'

import React, { useState } from 'react'
import { Truck, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface CODProps {
  orderId: string
  totalAmount: number
  onSuccess: () => void
}

export default function CODCheckout({ orderId, totalAmount, onSuccess }: CODProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const supabase = createClient()

  const handleConfirm = async () => {
    setIsProcessing(true)
    const toastId = toast.loading('Confirming your order...')
    
    try {
      // Order is already created with pending status in checkout page
      // We just need to ensure payment_method='cod' is set explicitly if not already
      const { error } = await supabase.from('orders').update({
         payment_method: 'cod',
         payment_status: 'pending' // Expected to be collected physically
      }).eq('id', orderId)
      
      if (error) throw error

      toast.success('Order Successfully Confirmed!', { id: toastId })
      onSuccess()
    } catch {
      toast.error('Failed to confirm cash order. Please try again.', { id: toastId })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-3xl p-6 bg-white animate-in slide-in-from-top-2">
       <div className="flex items-start gap-4 mb-6">
         <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
           <Truck className="w-6 h-6" />
         </div>
         <div>
           <h3 className="font-extrabold text-gray-900 text-lg">Cash on Delivery</h3>
           <p className="text-sm font-medium text-gray-500 mt-1">Our delivery partner will collect exactly <span className="font-bold text-gray-900">₨ {totalAmount.toLocaleString()}</span> at the time of delivery.</p>
         </div>
       </div>

       <div className="space-y-3 bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100">
         <div className="flex items-start gap-2">
           <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
           <p className="text-xs font-bold text-gray-600">Please prepare exact change if possible to avoid delays.</p>
         </div>
         <div className="flex items-start gap-2">
           <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
           <p className="text-xs font-bold text-gray-600">The business owner may call you to verify this COD order before packing.</p>
         </div>
       </div>

       <button 
         disabled={isProcessing}
         onClick={handleConfirm}
         className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-70 text-white rounded-2xl py-4 font-bold transition flex items-center justify-center shadow-lg shadow-gray-900/10"
       >
         {isProcessing ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"/> : 'Place Order (Pay on Delivery)'}
       </button>
    </div>
  )
}
