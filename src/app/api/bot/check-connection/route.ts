import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ connected: false, error: 'Missing businessId' }, { status: 400 })
    }

    // 1. Fetch business and its owner_id
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('telegram_chat_id, owner_id')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ connected: false, error: 'Business not found' })
    }

    // 2. If already connected in business, return success
    if (business.telegram_chat_id) {
      return NextResponse.json({ connected: true, telegram_chat_id: business.telegram_chat_id })
    }

    // 3. FALLBACK: Check if the OWNER'S PROFILE has a telegram_chat_id
    const { data: profile, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', business.owner_id)
      .single()

    if (!profError && profile?.telegram_chat_id) {
      // 4. AUTO-SYNC: Update the business table so notifications work
      await supabaseAdmin
        .from('businesses')
        .update({ telegram_chat_id: profile.telegram_chat_id })
        .eq('id', businessId)

      return NextResponse.json({ 
        connected: true, 
        telegram_chat_id: profile.telegram_chat_id,
        synced: true 
      })
    }

    return NextResponse.json({ connected: false })

  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 })
  }
}
