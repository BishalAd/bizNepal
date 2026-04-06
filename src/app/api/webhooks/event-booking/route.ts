import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
    // e.g. "Monday, 28 March 2026, 6:00 PM"
  } catch {
    return dateStr
  }
}

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
      eventId,
      eventTitle,
      eventDate,
      venueName,
      businessId,
      attendeeName,
      attendeePhone,
      attendeeUserId,
      seats,
      totalAmount,
      ticketCode,
    } = payload

    // 2. Fetch Organizer (Business) Telegram Chat ID + notification toggle
    const { data: business } = await supabaseAdmin
      .from('businesses')
      .select('telegram_chat_id, tg_notify_event_booking')
      .eq('id', businessId)
      .single()

    const shouldNotifyTelegram = !!(business?.telegram_chat_id && business?.tg_notify_event_booking !== false)

    // 3. Fetch Attendee Telegram Chat ID (by user_id if logged in)
    let attendeeTelegramChatId: number | null = null
    if (attendeeUserId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', attendeeUserId)
        .single()
      attendeeTelegramChatId = profile?.telegram_chat_id ?? null
    }

    // 4. Build exact n8n payload
    const n8nPayload = {
      eventId,
      eventTitle,
      eventDate: eventDate ? formatEventDate(eventDate) : '',
      venueName: venueName ?? '',
      organizerTelegramChatId: shouldNotifyTelegram ? business?.telegram_chat_id : null,
      attendeeName,
      attendeePhone,
      attendeeTelegramChatId,
      seats,
      totalAmount,
      ticketCode,
    }

    // 5. Insert In-App Notification
    await supabaseAdmin.from('notifications').insert({
      user_id: businessId,
      title: 'New Event Booking',
      message: `${attendeeName} booked ${seats} seats for ${eventTitle}.`,
      type: 'event',
      link: `/dashboard/events`,
    })

    // 6. Forward to n8n Webhook
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl) {
      await fetch(`${n8nBaseUrl}/event-booking`, {
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
