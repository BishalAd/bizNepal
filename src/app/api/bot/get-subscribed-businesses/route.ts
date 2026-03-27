import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    // 1. Verify Secret
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== process.env.WEBHOOK_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Query Subscribed Businesses
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('id, name, telegram_chat_id, whatsapp_number')
      .not('telegram_chat_id', 'is', null)
      .eq('is_active', true)

    if (error) throw error

    return NextResponse.json(data)

  } catch (error: any) {
    console.error('Get Subscribed Businesses Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
