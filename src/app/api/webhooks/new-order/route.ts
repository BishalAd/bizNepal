import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Verify Secret
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== process.env.WEBHOOK_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const {
      orderId,
      businessId,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      items,
      total,
      paymentMethod,
    } = payload

    // 2. Fetch Business Telegram Chat ID
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('telegram_chat_id')
      .eq('id', businessId)
      .single()

    // 3. Build exact n8n payload
    const n8nPayload = {
      orderId,
      businessId,
      businessTelegramChatId: business?.telegram_chat_id ?? null,
      customerName,
      customerPhone,
      customerEmail: customerEmail ?? null,
      deliveryAddress: deliveryAddress ?? '',
      items: (items ?? []).map((item: { name?: string; title?: string; quantity: number; price: number }) => ({
        name: item.name ?? item.title ?? '',
        quantity: item.quantity,
        price: item.price,
      })),
      total,
      paymentMethod,
    }

    // 4. Insert In-App Notification
    await supabaseAdmin.from('notifications').insert({
      user_id: businessId,
      title: 'New Order Received!',
      message: `${customerName} placed an order for ${items?.length || 1} items (Total: Rs ${total}). paid via ${paymentMethod || 'cash'}.`,
      type: 'order',
      link: `/dashboard/orders?id=${orderId}`,
    })

    // 5. Forward to n8n Webhook
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
      await fetch(`${n8nBaseUrl}/new-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload),
      }).catch((e) => console.error('n8n forwarding failed:', e))
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
