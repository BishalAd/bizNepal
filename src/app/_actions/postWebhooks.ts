'use server'

import { createClient } from '@supabase/supabase-js'

export async function triggerNewPostWebhook(type: 'job' | 'event' | 'product' | 'offer', itemId: string) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Fetch item details based on type
    const tableMap = { job: 'jobs', event: 'events', product: 'products', offer: 'offers' }
    const tableName = tableMap[type]

    const { data: item, error: itemError } = await supabaseAdmin
      .from(tableName)
      .select('*, businesses(name, owner_id, telegram_chat_id)')
      .eq('id', itemId)
      .single()

    if (itemError || !item) {
      console.error(`Failed to fetch ${type} for webhook:`, itemError)
      return { success: false, error: `${type} not found` }
    }

    const business = item.businesses as any
    const businessId = item.business_id
    const telegramChatId = business?.telegram_chat_id
    const ownerId = business?.owner_id

    // 2. Check notification settings
    // Column names match what I added in the migration
    const settingMap = {
      job: 'tg_notify_new_job',
      event: 'tg_notify_new_event',
      product: 'tg_notify_new_product',
      offer: 'tg_notify_new_offer'
    }
    const settingColumn = settingMap[type]
    
    // Fetch the specific setting for this business
    const { data: bizSettings } = await supabaseAdmin
      .from('businesses')
      .select(settingColumn)
      .eq('id', businessId)
      .single()

    const shouldNotifyTelegram = !!(telegramChatId && (bizSettings as any)?.[settingColumn] !== false)

    // 3. Build n8n payload
    const n8nPayload = {
      type,
      itemId,
      businessId,
      businessName: business?.name,
      businessTelegramChatId: shouldNotifyTelegram ? telegramChatId : null,
      title: item.title || item.name,
      description: item.description,
      imageUrl: item.image_url || null,
      link: `https://biznepal.com/dashboard/${type}s` // Fallback URL
    }

    // 4. Create In-App Notification
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1)
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: ownerId,
        title: `New ${typeLabel} Published!`,
        message: `Your ${type} "${n8nPayload.title}" is now live on BizNepal.`,
        type: type,
        link: `/dashboard/${type}s`,
      })
    } catch (e) {
      console.warn('Failed to insert in-app notification:', e)
    }

    // 5. Forward to n8n Webhook
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (n8nBaseUrl && !n8nBaseUrl.includes('undefined')) {
      // Send to a generic 'new-post' endpoint or type-specific if preferred
      // Using generic 'new-post' as planned
      await fetch(`${n8nBaseUrl}/new-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload),
      }).catch((e) => console.error('n8n post error:', e))
    }

    return { success: true }
  } catch (error: any) {
    console.error('Webhook trigger error:', error)
    return { success: false, error: error.message }
  }
}

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
  } catch {
    return dateStr
  }
}

export async function triggerInteractionWebhook(
  type: 'job-application' | 'event-booking', 
  payload: any
) {
  try {
    console.log(`[Interaction Webhook] Starting trigger for ${type}...`)

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    if (!n8nBaseUrl) {
      console.warn('[Webhook] No N8N_WEBHOOK_BASE_URL found in .env')
    }

    if (type === 'job-application') {
      const {
        jobId, jobTitle, businessId, businessName, businessEmail,
        applicantName, applicantPhone, applicantEmail, applicantUserId, cvUrl
      } = payload

      if (!businessId) throw new Error('Missing businessId in job-application payload')

      // 1. Fetch Business Notification Settings
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('telegram_chat_id, tg_notify_job_application, owner_id')
        .eq('id', businessId)
        .single()

      const shouldNotifyTelegram = !!(business?.telegram_chat_id && business?.tg_notify_job_application !== false)

      // 2. Fetch Applicant Telegram Chat ID (if logged in)
      let applicantTelegramChatId: number | null = null
      if (applicantUserId) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('telegram_chat_id')
          .eq('id', applicantUserId)
          .single()
        applicantTelegramChatId = profile?.telegram_chat_id ?? null
      }

      // 3. Build n8n payload
      const n8nPayload = {
        jobId, jobTitle, businessId, businessName, businessEmail,
        businessTelegramChatId: shouldNotifyTelegram ? business?.telegram_chat_id : null,
        applicantName, applicantPhone, applicantEmail, applicantTelegramChatId, cvUrl,
      }

      // 4. Create In-App Notification for Business Owner
      await supabaseAdmin.from('notifications').insert({
        user_id: business?.owner_id || businessId,
        title: 'New Job Application',
        message: `${applicantName} applied for the ${jobTitle} position.`,
        type: 'job',
        link: `/dashboard/applications?job=${jobId}`,
      })

      // 5. Forward to n8n
      if (n8nBaseUrl) {
        await fetch(`${n8nBaseUrl}/job-application`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload),
        })
        console.log(`[N8N] Job Application Trigger Success: ${jobTitle}`)
      }
    } 
    
    else if (type === 'event-booking') {
      const {
        eventId, eventTitle, eventDate, venueName, businessId,
        attendeeName, attendeePhone, attendeeUserId, seats, totalAmount, ticketCode
      } = payload

      if (!businessId) throw new Error('Missing businessId in event-booking payload')

      // 1. Fetch Organizer Notification Settings
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('telegram_chat_id, tg_notify_event_booking, owner_id')
        .eq('id', businessId)
        .single()

      const shouldNotifyTelegram = !!(business?.telegram_chat_id && business?.tg_notify_event_booking !== false)

      // 2. Fetch Attendee Telegram Chat ID
      let attendeeTelegramChatId: number | null = null
      if (attendeeUserId) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('telegram_chat_id')
          .eq('id', attendeeUserId)
          .single()
        attendeeTelegramChatId = profile?.telegram_chat_id ?? null
      }

      // 3. Build n8n payload
      const n8nPayload = {
        eventId, eventTitle, 
        eventDate: eventDate ? formatEventDate(eventDate) : '',
        venueName: venueName ?? '',
        organizerTelegramChatId: shouldNotifyTelegram ? business?.telegram_chat_id : null,
        attendeeName, attendeePhone, attendeeTelegramChatId, seats, totalAmount, ticketCode,
      }

      // 4. Create In-App Notification
      await supabaseAdmin.from('notifications').insert({
        user_id: business?.owner_id || businessId,
        title: 'New Event Booking',
        message: `${attendeeName} booked ${seats} seats for ${eventTitle}.`,
        type: 'event',
        link: `/dashboard/events`,
      })

      // 5. Forward to n8n
      if (n8nBaseUrl) {
        await fetch(`${n8nBaseUrl}/event-booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(n8nPayload),
        })
        console.log(`[N8N] Event Booking Trigger Success: ${eventTitle}`)
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error(`[Webhook Error] ${type}:`, error.message)
    return { success: false, error: error.message }
  }
}
