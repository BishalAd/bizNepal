const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('Seeding professional sample data...')

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
  const ownerId = profiles?.[0]?.id

  const { data: categories } = await supabase.from('categories').select('id, name')
  if (!categories || categories.length === 0) {
    console.error('No categories found.')
    return
  }
  const catId = categories[0].id

  const { data: districts } = await supabase.from('districts').select('id').limit(1)
  const districtId = districts?.[0]?.id

  // 1. Create Businesses
  console.log('Creating businesses...')
  const sampleBusinesses = [
    {
      owner_id: ownerId,
      name: 'Everest Tech Hub',
      slug: 'everest-tech-hub',
      description: 'Laptops, Gadgets and Enterprise Solutions.',
      category_id: catId,
      district_id: districtId,
      city: 'Kathmandu',
      address: 'New Road, Kathmandu',
      is_active: true,
      is_verified: true,
      rating: 4.8,
      review_count: 0
    },
    {
       owner_id: ownerId,
       name: 'Himalayan Fashion',
       slug: 'himalayan-fashion',
       description: 'Authentic Nepali wear and modern fashion.',
       category_id: catId,
       district_id: districtId,
       city: 'Kathmandu',
       address: 'Darbar Marg, Kathmandu',
       is_active: true,
       is_verified: true,
       rating: 4.5,
       review_count: 0
    }
  ]

  const { data: bizData, error: bizErr } = await supabase.from('businesses').upsert(sampleBusinesses, { onConflict: 'slug' }).select()
  if (bizErr) {
    console.error('BIZ SEED ERROR:', bizErr.message)
    return
  }
  
  const bizIds = bizData.map(b => b.id)

  // 2. Create Products
  console.log('Creating products...')
  const sampleProducts = [
    { business_id: bizIds[0], name: 'MacBook Pro M3', slug: 'macbook-pro-m3', price: 295000, description: 'Apple M3 Pro chip.', category_id: catId, stock: 5, status: 'active', allows_esewa: true },
    { business_id: bizIds[1], name: 'Dhaka Topi', slug: 'dhaka-topi', price: 1500, description: 'Premium Handmade Topi.', category_id: catId, stock: 10, status: 'active', allows_cod: true },
  ]
  const { error: prodErr } = await supabase.from('products').upsert(sampleProducts, { onConflict: 'slug' })
  if (prodErr) console.error('PROD SEED ERROR:', prodErr.message)

  // 3. Create Jobs
  console.log('Creating jobs...')
  const sampleJobs = [
    { business_id: bizIds[0], title: 'React Developer', slug: 'react-dev', description: 'Next.js developer.', job_type: 'FULL-TIME', location_type: 'HYBRID', salary_min: 80000, salary_max: 120000, show_salary: true, status: 'active', category_id: catId, district_id: districtId },
  ]
  const { error: jobErr } = await supabase.from('jobs').upsert(sampleJobs, { onConflict: 'slug' })
  if (jobErr) console.error('JOB SEED ERROR:', jobErr.message)

  // 4. Create Events
  console.log('Creating events...')
  const sampleEvents = [
    { business_id: bizIds[0], title: 'Grand Launch Event', slug: 'grand-launch', venue_name: 'Tech Hall', starts_at: new Date(Date.now() + 86400000).toISOString(), is_free: true, status: 'active', category_id: catId, district_id: districtId },
  ]
  const { error: evErr } = await supabase.from('events').upsert(sampleEvents, { onConflict: 'slug' })
  if (evErr) console.error('EVENT SEED ERROR:', evErr.message)

  console.log('Successfully seeded professional sample data!')
}

seed()
