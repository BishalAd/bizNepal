import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const supabase = await createClient()
    const { data: business } = await supabase
      .from('businesses')
      .select('telegram_chat_id')
      .eq('id', payload.businessId)
      .single()

    const updatedPayload = {
      ...payload,
      businessTelegramChatId: business?.telegram_chat_id || null
    }

    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
       await fetch(`${n8nBaseUrl}/webhook/offer-expiry`, {
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
