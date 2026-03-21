import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const { eventId, eventTitle, organizerWhatsapp, attendeeName, attendeePhone, seats, totalAmount, ticketCode, businessId } = payload

    const supabase = await createClient()

    await supabase.from('notifications').insert({
      user_id: businessId,
      title: 'New Event Booking',
      message: `${attendeeName} booked ${seats} seats for ${eventTitle}.`,
      type: 'event',
      link: `/dashboard/events`
    })

    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
       await fetch(`${n8nBaseUrl}/webhook/event-booking`, {
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
