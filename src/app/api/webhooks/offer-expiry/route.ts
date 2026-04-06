import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('telegram_chat_id, tg_notify_offer_grab')
      .eq('id', payload.businessId)
      .single()

    const shouldNotifyTelegram = !!(business?.telegram_chat_id && business?.tg_notify_offer_grab !== false)

    const updatedPayload = {
      ...payload,
      businessTelegramChatId: shouldNotifyTelegram ? business?.telegram_chat_id : null
    }

    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
       await fetch(`${n8nBaseUrl}/offer-expiry`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(updatedPayload)
       }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
