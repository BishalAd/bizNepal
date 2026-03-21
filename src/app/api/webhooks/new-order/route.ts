import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // 1. Verify Secret
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== process.env.WEBHOOK_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const { orderId, businessId, businessName, businessPhone, businessWhatsapp, customerName, customerPhone, customerEmail, items, total, paymentMethod } = payload

    const supabase = await createClient()

    // 2. Insert In-App Notification
    await supabase.from('notifications').insert({
      user_id: businessId, // Assuming businessId is the owner_id for this context
      title: 'New Order Received!',
      message: `${customerName} placed an order for ${items?.length || 1} items (Total: Rs ${total}). paid via ${paymentMethod || 'cash'}.`,
      type: 'order',
      link: `/dashboard/orders?id=${orderId}`
    })

    // 3. Forward to n8n Webhook
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
       await fetch(`${n8nBaseUrl}/webhook/new-order`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       }).catch(e => console.error('n8n forwarding failed:', e))
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
