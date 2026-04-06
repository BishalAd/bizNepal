import { createClient } from '@/lib/supabase/server'
import { verifyEsewaPayment } from '@/lib/payments/esewa'
import { triggerNewOrderWebhook } from '@/app/_actions/orderWebhooks'
import { CheckCircle, ArrowRight, XCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Payment Success | BizNepal' }

export default async function EsewaSuccessPage({ searchParams }: { searchParams: { data?: string } }) {
  const data = searchParams.data
  
  if (!data) {
    return <ErrorState message="Invalid payment callback. Missing data." />
  }

  const secretKey = process.env.NEXT_PUBLIC_ESEWA_SECRET || '8gBm/:&EnhH.1/q'
  const isVerified = verifyEsewaPayment(data, secretKey)

  if (!isVerified) {
    return <ErrorState message="Payment signature verification failed. Please contact support." />
  }

  // Decode the data string to JSON
  let payload: any
  try {
    payload = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
  } catch {
    return <ErrorState message="Failed to decode payment payload." />
  }

  const orderId = payload.transaction_uuid

  // Update order in Supabase
  const supabase = await createClient()
  
  // 1. Check if it's a deferred order (payment_attempts)
  const { data: attempt } = await supabase
    .from('payment_attempts')
    .select('order_data')
    .eq('id', orderId || '')
    .single()
  
  let finalOrderId = orderId

  if (attempt) {
     // Create real order from attempt data
     const { data: newOrder, error: orderError } = await supabase
       .from('orders')
       .insert({
         ...attempt.order_data,
         order_status: 'pending',
         payment_status: 'paid',
       })
       .select('id')
       .single()
     
     if (orderError) {
        return <ErrorState message="Payment successful but order creation failed. Contact support." code={payload.transaction_code} />
     }
     
     finalOrderId = newOrder.id
     // Mark attempt as completed
     await supabase.from('payment_attempts').update({ status: 'completed' }).eq('id', orderId)
  } else {
     // Standard legacy order update
     const { error } = await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId)
     if (error) {
       return <ErrorState message="Payment was successful but we couldn't update your order. Contact support with your transaction code: " code={payload.transaction_code} />
     }
  }

  // Trigger unified webhook handler
  await triggerNewOrderWebhook(finalOrderId).catch(() => {})

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="bg-[#60A130] p-8 text-white text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-black">Payment Successful</h1>
        </div>
        
        <div className="p-8 text-center space-y-6">
           <div>
             <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Amount Paid</p>
             <h2 className="text-4xl font-black text-gray-900 tracking-tight">₨ {payload.total_amount?.toLocaleString() || '---'}</h2>
           </div>
           
           <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 border border-gray-100">
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Transaction ID</span>
                <span className="text-gray-900">{payload.transaction_code}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Order ID</span>
                <span className="text-gray-900 truncate pl-4">BN-{orderId?.slice(0,8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-gray-500">Method</span>
                <span className="text-[#60A130]">eSewa</span>
              </div>
           </div>

           <p className="text-sm font-medium text-gray-600 leading-relaxed">
             Thank you for your purchase! The business owner has been notified and is preparing your order.
           </p>

           <div className="pt-4">
             <Link href="/dashboard" className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3.5 font-bold transition flex justify-center items-center shadow-md">
               Continue to Dashboard <ArrowRight className="w-4 h-4 ml-2"/>
             </Link>
           </div>
        </div>
      </div>
    </div>
  )
}

function ErrorState({ message, code }: { message: string, code?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
         <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
         <h1 className="text-2xl font-black text-gray-900 mb-2">Payment Verification Error</h1>
         <p className="font-medium text-gray-600 mb-6">{message}</p>
         {code && <p className="font-bold text-sm bg-gray-100 p-2 rounded-lg mb-6">Code: {code}</p>}
         <Link href="/checkout" className="w-full inline-block bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 font-bold transition">Return to Checkout</Link>
      </div>
    </div>
  )
}
