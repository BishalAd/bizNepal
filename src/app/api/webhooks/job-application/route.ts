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
    const {
      jobId,
      jobTitle,
      businessId,
      businessName,
      businessEmail,
      applicantName,
      applicantPhone,
      applicantEmail,
      applicantUserId,
      cvUrl,
    } = payload

    // 2. Fetch Business Telegram Chat ID
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('telegram_chat_id')
      .eq('id', businessId)
      .single()

    // 3. Fetch Applicant Telegram Chat ID (by user_id if logged in)
    let applicantTelegramChatId: number | null = null
    if (applicantUserId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', applicantUserId)
        .single()
      applicantTelegramChatId = profile?.telegram_chat_id ?? null
    }

    // 4. Build exact n8n payload
    const n8nPayload = {
      jobId,
      jobTitle,
      businessId,
      businessName,
      businessEmail,
      businessTelegramChatId: business?.telegram_chat_id ?? null,
      applicantName,
      applicantPhone,
      applicantEmail,
      applicantTelegramChatId,
      cvUrl,
    }

    // 5. Insert In-App Notification
    await supabaseAdmin.from('notifications').insert({
      user_id: businessId,
      title: 'New Job Application',
      message: `${applicantName} applied for the ${jobTitle} position.`,
      type: 'job',
      link: `/dashboard/applications?job=${jobId}`,
    })

    // 6. Forward to n8n Webhook
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
      await fetch(`${n8nBaseUrl}/job-application`, {
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
