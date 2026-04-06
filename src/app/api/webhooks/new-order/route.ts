import { NextResponse } from 'next/server'
import { triggerNewOrderWebhook } from '@/app/_actions/orderWebhooks'

export async function POST(request: Request) {
  try {
    // 1. Verify Secret
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== process.env.WEBHOOK_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    // It can handle both expected flat payload or Supabase webhook record payload
    const orderId = payload.orderId || payload.record?.id
    
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const result = await triggerNewOrderWebhook(orderId)

    if (!result.success) {
       return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
