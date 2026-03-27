import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')

    if (!businessId) {
      return NextResponse.json({ connected: false, error: 'Missing businessId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('businesses')
      .select('telegram_chat_id')
      .eq('id', businessId)
      .single()

    if (error || !data) {
      return NextResponse.json({ connected: false, error: 'Not found' })
    }

    return NextResponse.json({ 
      connected: !!data.telegram_chat_id, 
      telegram_chat_id: data.telegram_chat_id 
    })

  } catch (error: any) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 500 })
  }
}
