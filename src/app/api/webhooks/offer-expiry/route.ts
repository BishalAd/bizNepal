import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
       await fetch(`${n8nBaseUrl}/webhook/offer-expiry`, {
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
