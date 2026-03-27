import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { businessId, period } = await request.json()
    
    // 1. Verify Secret
    const authHeader = request.headers.get('x-webhook-secret')
    if (authHeader !== process.env.WEBHOOK_SECRET && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate time offset based on period
    let hoursOffset = 2
    if (period === '6h') hoursOffset = 6
    if (period === 'daily') hoursOffset = 24
    
    // Time filter logic timestamp generating
    const timeFilter = new Date(Date.now() - hoursOffset * 60 * 60 * 1000).toISOString()

    // Query aggregates (For real production, perform optimized count queries)
    const [ordersRes, applicationsRes, bookingsRes, reviewsRes] = await Promise.all([
      supabaseAdmin.from('orders').select('total_amount').eq('business_id', businessId).gte('created_at', timeFilter),
      supabaseAdmin.from('job_applications').select('id', { count: 'exact' }).eq('business_id', businessId).eq('status', 'new').gte('created_at', timeFilter),
      supabaseAdmin.from('event_bookings').select('id', { count: 'exact' }).eq('business_id', businessId).gte('created_at', timeFilter),
      supabaseAdmin.from('reviews').select('rating').eq('business_id', businessId).gte('created_at', timeFilter)
    ])

    const ordersData = ordersRes.data || []
    const ordersCount = ordersData.length
    const totalRevenue = ordersData.reduce((sum, o) => sum + (o.total_amount || 0), 0)

    const applicationsCount = applicationsRes.count || 0
    const bookingsCount = bookingsRes.count || 0
    
    const reviewsData = reviewsRes.data || []
    const reviewsCount = reviewsData.length

    return NextResponse.json({
      orders: ordersCount,
      revenue: totalRevenue,
      applications: applicationsCount,
      bookings: bookingsCount,
      reviews: reviewsCount
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
