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
    const { businessId, reviewerName, rating, content } = payload

    // 2. Fetch Business Telegram Chat ID + notification toggle
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('telegram_chat_id, tg_notify_new_review')
      .eq('id', businessId)
      .single()

    const shouldNotifyTelegram = !!(business?.telegram_chat_id && business?.tg_notify_new_review !== false)

    // 3. Build exact n8n payload
    const n8nPayload = {
      businessId,
      businessTelegramChatId: shouldNotifyTelegram ? business?.telegram_chat_id : null,
      reviewerName,
      rating,
      content,
    }

    // 4. Insert In-App Notification
    const isUrgent = rating <= 2
    const prefix = isUrgent ? '⚠️ Urgent: ' : ''
    await supabaseAdmin.from('notifications').insert({
      user_id: businessId,
      title: `${prefix}New ${rating}-Star Review`,
      message: `${reviewerName} left a review: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
      type: 'review',
      link: `/dashboard/reviews`,
    })

    // 5. Forward to n8n Webhook
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
      await fetch(`${n8nBaseUrl}/new-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload),
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
