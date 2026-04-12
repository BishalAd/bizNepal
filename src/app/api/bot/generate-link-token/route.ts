import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST() {
  try {
    const supabase = await createClient()

    // 1. Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get their business_id
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'No business found for this account' }, { status: 404 })
    }

    // 3. Generate random 8-character token
    const token = crypto.randomBytes(4).toString('hex').toUpperCase()

    // 4. Cleanup old unused tokens for this business
    await supabase
      .from('telegram_links')
      .delete()
      .eq('business_id', business.id)
      .eq('used', false)

    // 5. Insert new token (expires in 15 mins)
    const { error: finalInsertError } = await supabase
      .from('telegram_links')
      .insert({
        token,
        business_id: business.id,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      })

    if (finalInsertError) {
      throw finalInsertError
    }

    // 6. Return response
    // Use the public username which doesn't have the '@' for the URL
    const botUsername = process.env.NEXT_PUBLIC_NOTIFY_BOT_USERNAME || 'BizNepalNotifyBot'
    return NextResponse.json({
      token,
      botUrl: `https://t.me/${botUsername}?start=${token}`
    })

  } catch (error: any) {
    console.error('Bot Link Token Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
