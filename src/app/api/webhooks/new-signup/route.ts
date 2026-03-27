import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Verify Secret
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== process.env.WEBHOOK_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const {
      userId,
      accountType,
      businessName,
      userName,
      userEmail,
      userPhone,
    } = payload

    // 2. Build exact n8n payload
    // Note: telegramChatId is intentionally excluded.
    // Workflow 7 sends a welcome EMAIL only.
    // Telegram welcome is handled by Workflow 8 when user connects.
    const n8nPayload = {
      userId,
      accountType,
      businessName: businessName ?? '',
      userName: userName ?? '',
      userEmail,
      userPhone,
    }

    // 3. Forward to n8n Webhook
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
      await fetch(`${n8nBaseUrl}/new-signup`, {
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
