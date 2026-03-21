import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { businessId, businessWhatsapp, reviewerName, rating, content } = payload

    const supabase = await createClient()
    
    // Urgent logic if rating is 2 or less
    const isUrgent = rating <= 2
    const prefix = isUrgent ? '⚠️ Urgent: ' : ''

    await supabase.from('notifications').insert({
      user_id: businessId,
      title: `${prefix}New ${rating}-Star Review`,
      message: `${reviewerName} left a review: "${content.slice(0, 50)}${content.length > 50 ? '...' : ''}"`,
      type: 'review',
      link: `/dashboard/reviews`
    })

    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
       await fetch(`${n8nBaseUrl}/webhook/new-review`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload)
       }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
