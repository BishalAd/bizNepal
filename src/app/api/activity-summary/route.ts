import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { businessId, period } = await request.json()
    const supabase = await createClient()

    // Calculate time offset based on period
    let hoursOffset = 2
    if (period === '6h') hoursOffset = 6
    if (period === 'daily') hoursOffset = 24
    
    // Time filter logic timestamp generating
    const timeFilter = new Date(Date.now() - hoursOffset * 60 * 60 * 1000).toISOString()

    // Query aggregates (For real production, perform optimized count queries)
    const [ordersRes, applicationsRes, bookingsRes, reviewsRes] = await Promise.all([
      supabase.from('orders').select('total_amount').eq('business_id', businessId).gte('created_at', timeFilter),
      supabase.from('job_applications').select('id', { count: 'exact' }).eq('business_id', businessId).gte('created_at', timeFilter),
      supabase.from('event_bookings').select('id', { count: 'exact' }).eq('business_id', businessId).gte('created_at', timeFilter),
      supabase.from('reviews').select('rating').eq('business_id', businessId).gte('created_at', timeFilter)
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
