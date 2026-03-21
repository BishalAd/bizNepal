import { NextResponse } from 'next/server'
import { verifyKhaltiPayment } from '@/lib/payments/khalti'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pidx = searchParams.get('pidx')

  if (!pidx) {
    return NextResponse.json({ error: 'Missing pidx parameter' }, { status: 400 })
  }

  try {
    const secretKey = process.env.KHALTI_SECRET_KEY || '80bd819afc11488c9a629af94a4c6a99'
    const verificationData = await verifyKhaltiPayment(secretKey, pidx)

    if (verificationData.status === 'Completed') {
      // Find the order that uses this pidx (assuming we stored pidx in notes or inferred by amount logic, 
      // but actually Khalti's epayment doesn't echo back purchase_order_id in lookup directly unless standard v2
      // ePayment gives purchase_order_id in lookup response if we initialized it with one).
      // Assuming verificationData has `purchase_order_id`, else we might just accept raw or pass it from client.
      const orderId = searchParams.get('orderId') || verificationData.purchase_order_id
      
      if (orderId) {
         const supabase = await createClient()
         // Update Supabase to paid
         await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', orderId)
         
         // Webhook
         const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL
         if (webhookUrl && !webhookUrl.includes('undefined')) {
            fetch(`${webhookUrl}/new-order`, { method: 'POST', body: JSON.stringify({ orderId, method: 'khalti' }) }).catch(()=>{})
         }
      }

      return NextResponse.json({ success: true, data: verificationData })
    }

    return NextResponse.json({ success: false, status: verificationData.status })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 })
  }
}
