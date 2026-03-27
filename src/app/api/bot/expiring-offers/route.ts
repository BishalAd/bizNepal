import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
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

    // 2. Query offers expiring in exactly the next 2 hours for businesses with Telegram
    // Using simple date math because Postgres INTERVAL from PostgREST can be tricky
    const now = new Date()
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)

    const { data: offers, error } = await supabaseAdmin
      .from('offers')
      .select('id, title, grabbed_count, ends_at, business_id, businesses!inner(name, telegram_chat_id)')
      .eq('status', 'active')
      .gte('ends_at', now.toISOString())
      .lte('ends_at', twoHoursFromNow.toISOString())
      // The !inner join forces the result to only include offers where the business exists
      // Then we filter out ones without a telegram_chat_id
      .not('businesses.telegram_chat_id', 'is', null)

    if (error) {
      throw error
    }

    // 3. Flatten the joined businesses object for easier consumption by n8n
    const formattedOffers = (offers || []).map((offer: any) => ({
      id: offer.id,
      title: offer.title,
      grabbed_count: offer.grabbed_count,
      ends_at: offer.ends_at,
      business_name: offer.businesses?.name,
      telegram_chat_id: offer.businesses?.telegram_chat_id,
    }))

    return NextResponse.json({ offers: formattedOffers })

  } catch (error: any) {
    console.error('Bot Expiring Offers Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
