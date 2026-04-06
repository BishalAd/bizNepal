import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/bot/post-content
 *
 * Called by n8n's Interactive Posting Bot after collecting all fields via conversation.
 * Looks up the business from telegram_user_id, then inserts into the correct table.
 *
 * Body:
 *   telegram_user_id: string   — Telegram user/chat ID of the business owner
 *   content_type: 'job' | 'event' | 'product' | 'offer'
 *   data: object               — The collected fields for the content type
 *   image_url?: string         — Optional Supabase Storage URL from image upload step
 */
export async function POST(request: Request) {
  try {
    // 1. Verify webhook secret
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== process.env.WEBHOOK_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { telegram_user_id, content_type, data: contentData, image_url } = body

    if (!telegram_user_id || !content_type || !contentData) {
      return NextResponse.json({ error: 'Missing required fields: telegram_user_id, content_type, data' }, { status: 400 })
    }

    // 2. Resolve business_id from telegram_user_id via businesses table
    const { data: business, error: bizError } = await supabaseAdmin
      .from('businesses')
      .select('id, owner_id')
      .eq('telegram_chat_id', String(telegram_user_id))
      .single()

    if (bizError || !business) {
      return NextResponse.json({
        error: 'No business found linked to this Telegram account. Please connect via the dashboard first.',
        code: 'BUSINESS_NOT_FOUND'
      }, { status: 404 })
    }

    const businessId = business.id
    const ownerId = business.owner_id
    let insertedId: string | null = null

    // 3. Insert into the correct table based on content_type
    if (content_type === 'job') {
      const { data: job, error } = await supabaseAdmin
        .from('jobs')
        .insert({
          business_id: businessId,
          title: contentData.title,
          category: contentData.category || 'General',
          description: contentData.description,
          salary: contentData.salary || 'Negotiable',
          deadline: contentData.deadline || null,
          location: contentData.location || 'Kathmandu',
          image_url: image_url || null,
          status: 'active',
          posted_via: 'telegram_bot',
        })
        .select('id')
        .single()

      if (error) throw error
      insertedId = job.id

    } else if (content_type === 'event') {
      const { data: event, error } = await supabaseAdmin
        .from('events')
        .insert({
          business_id: businessId,
          title: contentData.title,
          category: contentData.category || 'General',
          description: contentData.description,
          event_date: contentData.event_date || null,
          venue_name: contentData.venue || 'TBA',
          ticket_price: parseFloat(contentData.ticket_price) || 0,
          total_seats: parseInt(contentData.total_seats) || 100,
          image_url: image_url || null,
          status: 'draft',
          posted_via: 'telegram_bot',
        })
        .select('id')
        .single()

      if (error) throw error
      insertedId = event.id

    } else if (content_type === 'product') {
      const { data: product, error } = await supabaseAdmin
        .from('products')
        .insert({
          business_id: businessId,
          title: contentData.title,
          category_id: contentData.category_id || null,
          description: contentData.description,
          price: parseFloat(contentData.price) || 0,
          stock: parseInt(contentData.stock) || 0,
          image_url: image_url || null,
          status: 'active',
          posted_via: 'telegram_bot',
        })
        .select('id')
        .single()

      if (error) throw error
      insertedId = product.id

    } else if (content_type === 'offer') {
      const { data: offer, error } = await supabaseAdmin
        .from('offers')
        .insert({
          business_id: businessId,
          title: contentData.title,
          description: contentData.description,
          discount_percentage: parseFloat(contentData.discount_percentage) || 0,
          original_price: parseFloat(contentData.original_price) || 0,
          expires_at: contentData.expires_at || null,
          image_url: image_url || null,
          status: 'active',
          posted_via: 'telegram_bot',
        })
        .select('id')
        .single()

      if (error) throw error
      insertedId = offer.id

    } else {
      return NextResponse.json({ error: `Unknown content_type: ${content_type}` }, { status: 400 })
    }

    // 4. Create in-app notification for the business owner
    const typeLabels: Record<string, string> = {
      job: 'Job', event: 'Event', product: 'Product', offer: 'Offer'
    }
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: ownerId,
        title: `${typeLabels[content_type]} posted via Telegram`,
        message: `"${contentData.title}" has been published successfully from your Telegram bot.`,
        type: content_type,
        link: `/dashboard/${content_type}s`,
      })
    } catch { /* Non-critical — don't fail if notifications table has issues */ }

    return NextResponse.json({
      success: true,
      content_type,
      id: insertedId,
      message: `${typeLabels[content_type]} created successfully.`
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[post-content] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
