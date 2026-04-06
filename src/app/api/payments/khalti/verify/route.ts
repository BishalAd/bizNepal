import { NextResponse } from 'next/server'
import { verifyKhaltiPayment } from '@/lib/payments/khalti'
import { createClient } from '@/lib/supabase/server'
import { triggerNewOrderWebhook } from '@/app/_actions/orderWebhooks'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pidx = searchParams.get('pidx')

  if (!pidx) {
    return NextResponse.json({ error: 'Missing pidx parameter' }, { status: 400 })
  }

  try {
    const secretKey = process.env.KHALTI_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'Khalti is not configured. Set KHALTI_SECRET_KEY.' }, { status: 500 })
    }
    const verificationData = await verifyKhaltiPayment(secretKey, pidx)

    if (verificationData.status === 'Completed') {
      // Find the order that uses this pidx (assuming we stored pidx in notes or inferred by amount logic, 
      // but actually Khalti's epayment doesn't echo back purchase_order_id in lookup directly unless standard v2
      // ePayment gives purchase_order_id in lookup response if we initialized it with one).
      // Assuming verificationData has `purchase_order_id`, else we might just accept raw or pass it from client.
      const orderId = searchParams.get('orderId') || verificationData.purchase_order_id
      if (orderId) {
         const supabase = await createClient()
         
         // 1. Check if it exists in payment_attempts
         const { data: attempt } = await supabase
           .from('payment_attempts')
           .select('order_data')
           .eq('id', orderId)
           .single()
         
         let finalOrderId = orderId

         if (attempt) {
            // It's a deferred order! Create the real order now.
            const { data: newOrder, error: orderError } = await supabase
              .from('orders')
              .insert({
                ...attempt.order_data,
                order_status: 'pending',
                payment_status: 'paid',
                khalti_pidx: pidx
              })
              .select('id')
              .single()
            
            if (orderError) {
               console.error('Order Creation Error:', orderError)
               throw orderError
            }
            
            finalOrderId = newOrder.id
            // Mark attempt as completed
            await supabase.from('payment_attempts').update({ status: 'completed' }).eq('id', orderId)
         } else {
            // Legacy/already created order, just update status
            await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId)
         }
         
         // Webhook (using the final order ID)
         await triggerNewOrderWebhook(finalOrderId).catch(()=>{})
      }

      return NextResponse.json({ success: true, data: verificationData })
    }

    return NextResponse.json({ success: false, status: verificationData.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}
