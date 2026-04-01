import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { 
      role, name, phone, email, password, telegram_chat_id,
      businessName, businessSlogan, businessCategory, businessType,
      businessDesc, whatsapp, location, website, logo_url, cover_url
    } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    // Initialize Supabase Admin Client to bypass RLS for account creation
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Create User in Supabase Auth (This securely hashes the password and sends verification email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Wait for them to click the email link
      user_metadata: {
        full_name: name,
        phone_number: phone,
        role: role === 'business' ? 'business' : 'user'
      }
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create auth user' }, { status: 400 })
    }

    const userId = authData.user.id

    // 2. Insert into profiles table
    await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name: name,
      avatar_url: null,
      role: role === 'business' ? 'business' : 'customer'
    })

    // 3. If Business, insert into businesses table
    if (role === 'business') {
      // Basic slugification safely handled
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000)
      
      let lat = null
      let lng = null
      
      if (location) {
         // Assuming n8n sends 'lat,lng' string from telegram location
         const parts = location.split(',')
         if (parts.length === 2) {
           lat = parseFloat(parts[0])
           lng = parseFloat(parts[1])
         }
      }

      await supabaseAdmin.from('businesses').insert({
        owner_id: userId,
        name: businessName,
        slug: slug,
        slogan: businessSlogan,
        description: businessDesc,
        category_id: businessCategory || null,
        phone: phone,
        whatsapp: whatsapp || null,
        website: website || null,
        logo_url: logo_url || null,
        cover_url: cover_url || null,
        latitude: lat,
        longitude: lng,
        telegram_chat_id: telegram_chat_id || null, // Link Telegram immediately!
        is_verified: false, // Admin must approve
        is_active: false // Needs email verification
      })
    }
    
    // 4. Clear their telegram session so they can start fresh
    if (telegram_chat_id) {
       await supabaseAdmin.from('telegram_sessions').delete().eq('chat_id', telegram_chat_id)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account created and verification email sent.' 
    })

  } catch (error: any) {
    console.error('Bot Registration API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
