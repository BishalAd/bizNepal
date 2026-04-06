'use server'

import { createClient } from '@supabase/supabase-js'

export async function triggerNewOrderWebhook(orderId: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('Failed to fetch order for webhook:', orderError)
      return { success: false, error: 'Order not found' }
    }

    // 2. Fetch Business Telegram Chat ID
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('telegram_chat_id, tg_notify_new_order')
      .eq('id', order.business_id)
      .single()

    const shouldNotifyTelegram = !!(business?.telegram_chat_id && business?.tg_notify_new_order !== false)

    // 3. Build N8N payload matching exactly what Workflow 1 expects
    const n8nPayload = {
      orderId: order.id,
      businessId: order.business_id,
      businessTelegramChatId: shouldNotifyTelegram ? business.telegram_chat_id : null,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email ?? null,
      customerAddress: {
        address: order.delivery_address ?? ''
      },
      items: order.items,
      total: order.total,
      paymentMethod: order.payment_method,
    }

    // 4. Insert In-App Notification (ignore if fails)
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: order.business_id,
        title: 'New Order Received!',
        message: `${order.customer_name} placed an order for ${order.items?.length || 1} items (Total: Rs ${order.total}). paid via ${order.payment_method || 'cash'}.`,
        type: 'order',
        link: `/dashboard/orders?id=${order.id}`,
      })
    } catch (e) {}

    // 5. Forward to N8N webhook
    const n8nBaseUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL || process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl && !n8nBaseUrl.includes('undefined')) {
      await fetch(`${n8nBaseUrl}/new-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload),
      }).catch((e) => console.error('n8n post error:', e))
    }

    return { success: true }
  } catch (error: any) {
    console.error('Webhook trigger error:', error)
    return { success: false, error: error.message }
  }
}
