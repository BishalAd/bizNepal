import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use SERVICE ROLE KEY for administrative updates from n8n
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

    const { token, chatId } = await request.json()

    if (!token || !chatId) {
      return NextResponse.json({ error: 'Token and chatId are required' }, { status: 400 })
    }

    // 2. Query telegram_links and join with businesses
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('telegram_links')
      .select('business_id, used, expires_at, businesses(name, owner_id)')
      .eq('token', token)
      .single()

    if (linkError || !linkData) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' })
    }

    // 3. Validation: used check and expiry check
    if (linkData.used) {
      return NextResponse.json({ success: false, error: 'Token already used' })
    }

    if (new Date(linkData.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'Token expired' })
    }

    const businessId = linkData.business_id
    const businessName = (linkData.businesses as any)?.name
    const ownerId = (linkData.businesses as any)?.owner_id

    // 4. Update Business
    const { error: bizUpdateError } = await supabaseAdmin
      .from('businesses')
      .update({ telegram_chat_id: chatId })
      .eq('id', businessId)

    if (bizUpdateError) throw bizUpdateError

    // 5. Update Profile
    if (ownerId) {
      await supabaseAdmin
        .from('profiles')
        .update({ telegram_chat_id: chatId })
        .eq('id', ownerId)
    }

    // 6. Mark token as used
    await supabaseAdmin
      .from('telegram_links')
      .update({ used: true })
      .eq('token', token)

    return NextResponse.json({ success: true, businessName })

  } catch (error: any) {
    console.error('Bot Link Update Error:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
