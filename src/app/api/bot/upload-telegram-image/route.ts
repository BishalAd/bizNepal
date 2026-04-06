import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/bot/upload-telegram-image
 *
 * Called by n8n when a user sends an image in the Interactive Posting Bot.
 * n8n fetches the image binary from Telegram's CDN and POSTs it here.
 * This endpoint uploads it to Supabase Storage and returns the public URL.
 *
 * Body (multipart/form-data):
 *   file          — The image binary
 *   content_type  — 'job' | 'event' | 'product' | 'offer' (used for bucket path)
 *   telegram_user_id — For naming/organizing the file
 *
 * OR Body (application/json with base64):
 *   file_base64   — base64 encoded image string
 *   mime_type     — e.g. 'image/jpeg'
 *   content_type  — content category
 *   telegram_user_id
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

    const contentTypeHeader = request.headers.get('content-type') || ''
    let fileBuffer: Buffer
    let mimeType = 'image/jpeg'
    let contentCategory = 'misc'
    let telegramUserId = 'unknown'

    if (contentTypeHeader.includes('multipart/form-data')) {
      // Handle multipart upload
      const formData = await request.formData()
      const file = formData.get('file') as File | null
      if (!file) {
        return NextResponse.json({ error: 'No file provided in form data.' }, { status: 400 })
      }
      const arrayBuffer = await file.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
      mimeType = file.type || 'image/jpeg'
      contentCategory = (formData.get('content_type') as string) || 'misc'
      telegramUserId = (formData.get('telegram_user_id') as string) || 'unknown'

    } else if (contentTypeHeader.includes('application/json')) {
      // Handle base64 JSON upload (easier for n8n HTTP Request node)
      const body = await request.json()
      if (!body.file_base64) {
        return NextResponse.json({ error: 'No file_base64 provided in JSON body.' }, { status: 400 })
      }
      fileBuffer = Buffer.from(body.file_base64, 'base64')
      mimeType = body.mime_type || 'image/jpeg'
      contentCategory = body.content_type || 'misc'
      telegramUserId = String(body.telegram_user_id || 'unknown')

    } else {
      return NextResponse.json({ error: 'Unsupported Content-Type. Use multipart/form-data or application/json.' }, { status: 400 })
    }

    // 2. Generate a unique file path
    const extension = mimeType.split('/')[1] || 'jpg'
    const timestamp = Date.now()
    const filePath = `telegram/${contentCategory}/${telegramUserId}_${timestamp}.${extension}`
    const bucketName = process.env.TELEGRAM_IMAGES_BUCKET || 'telegram-uploads'

    // 3. Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[upload-telegram-image] Storage upload error:', uploadError)
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // 4. Get the public URL
    const { data: { publicUrl } } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[upload-telegram-image] Error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
