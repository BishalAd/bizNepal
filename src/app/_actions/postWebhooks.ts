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

export async function triggerInteractionWebhook(type: 'job-application' | 'event-booking', payload: any) {
  try {
    const n8nBaseUrl = process.env.N8N_WEBHOOK_BASE_URL
    const webhookSecret = process.env.WEBHOOK_SECRET

    // 1. Call the internal API route with the secret
    // Scaling note: We could also move the logic here directly, but calling the API 
    // ensures consistency if other external services use it later.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/webhooks/${type}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-webhook-secret': webhookSecret || ''
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || `Webhook ${type} failed`)
    }

    return { success: true }
  } catch (error: any) {
    console.error(`Interaction webhook (${type}) error:`, error)
    return { success: false, error: error.message }
  }
}
