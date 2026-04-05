const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('Seeding professional sample data...')

  // 1. Get some categories
  const { data: categories } = await supabase.from('categories').select('id, name, type')
  if (!categories || categories.length === 0) {
    console.error('No categories found. Run category seeding first.')
    return
  }

  const bizCat = categories.find(c => c.type === 'business')?.id || categories[0].id
  const prodCat = categories.find(c => c.type === 'product')?.id || categories[0].id
  const jobCat = categories.find(c => c.type === 'job')?.id || categories[0].id
  const eventCat = categories.find(c => c.type === 'event')?.id || categories[0].id

  // 2. Get a district
  const { data: districts } = await supabase.from('districts').select('id').limit(1)
  const districtId = districts?.[0]?.id

  if (!districtId) {
    console.error('No districts found. Run district seeding first.')
    return
  }

  // 3. Create Businesses
  console.log('Creating businesses...')
  const sampleBusinesses = [
    {
      name: 'Everest Tech Hub',
      slug: 'everest-tech-hub',
      description: 'Laptops, Gadgets and Enterprise Solutions.',
      category_id: bizCat,
      district_id: districtId,
      city: 'Kathmandu',
      address: 'New Road, Kathmandu',
      is_active: true,
      is_verified: true,
      rating: 4.8,
      review_count: 124,
      whatsapp: '9800000001'
    },
    {
       name: 'Himalayan Fashion',
       slug: 'himalayan-fashion',
       description: 'Authentic Nepali wear and modern fashion.',
       category_id: bizCat,
       district_id: districtId,
       city: 'Kathmandu',
       address: 'Darbar Marg, Kathmandu',
       is_active: true,
       is_verified: true,
       rating: 4.5,
       review_count: 89,
       whatsapp: '9800000002'
    },
    {
       name: 'The Thakali House',
       slug: 'the-thakali-house',
       description: 'Best authentic Thakali Tali in town.',
       category_id: bizCat,
       district_id: districtId,
       city: 'Lalitpur',
       address: 'Jhamsikhel, Lalitpur',
       is_active: true,
       is_verified: true,
       rating: 4.9,
       review_count: 215,
       whatsapp: '9800000003'
    }
  ]

  const { data: createdBusinesses, error: bizErr } = await supabase.from('businesses').upsert(sampleBusinesses, { onConflict: 'slug' }).select()
  if (bizErr) console.error('Error seeding businesses:', bizErr)
  
  const bizIds = createdBusinesses?.map(b => b.id) || []

  // 4. Create Products
  if (bizIds.length > 0) {
    console.log('Creating products...')
    const sampleProducts = [
      { business_id: bizIds[0], name: 'MacBook Pro M3', slug: 'macbook-pro-m3', price: 295000, description: 'Apple M3 Pro chip, 14-inch.', category_id: prodCat, stock_quantity: 5, status: 'active', esewa_available: true },
      { business_id: bizIds[0], name: 'Logitech MX Master 3', slug: 'logitech-mx-master-3', price: 15500, description: 'Advanced Wireless Mouse.', category_id: prodCat, stock_quantity: 12, status: 'active', khalti_available: true },
      { business_id: bizIds[1], name: 'Dhaka Topi Premium', slug: 'dhaka-topi-premium', price: 1500, description: 'Handmade Palpali Dhaka Topi.', category_id: prodCat, stock_quantity: 50, status: 'active', cod_available: true },
      { business_id: bizIds[1], name: 'Pashmina Shawl', slug: 'pashmina-shawl', price: 12000, description: '100% Pure Chyangra Pashmina.', category_id: prodCat, stock_quantity: 20, status: 'active', cod_available: true },
      { business_id: bizIds[2], name: 'Thakali Thali Set', slug: 'thakali-thali-set', price: 850, description: 'Authentic meal set.', category_id: prodCat, stock_quantity: 100, status: 'active', esewa_available: true },
    ]
    await supabase.from('products').upsert(sampleProducts, { onConflict: 'slug' })
  }

  // 5. Create Jobs
  if (bizIds.length > 0) {
    console.log('Creating jobs...')
    const sampleJobs = [
      { business_id: bizIds[0], title: 'Senior React Developer', slug: 'sr-react-dev', job_type: 'FULL-TIME', location_type: 'HYBRID', salary_min: 120000, salary_max: 180000, show_salary: true, status: 'active', category_id: jobCat, district_id: districtId },
      { business_id: bizIds[2], title: 'Sous Chef', slug: 'sous-chef', job_type: 'FULL-TIME', location_type: 'ON-SITE', salary_min: 45000, salary_max: 60000, show_salary: true, status: 'active', category_id: jobCat, district_id: districtId },
    ]
    await supabase.from('jobs').upsert(sampleJobs, { onConflict: 'slug' })
  }

  // 6. Create Events
  if (bizIds.length > 0) {
    console.log('Creating events...')
    const sampleEvents = [
      { business_id: bizIds[0], title: 'Tech Trends 2026', slug: 'tech-trends-2026', venue_name: 'Everest Tech Hub Hall', starts_at: new Date(Date.now() + 86400000*7).toISOString(), is_free: true, status: 'active', category_id: eventCat, district_id: districtId },
      { business_id: bizIds[2], title: 'Festival of Flavors', slug: 'flavors-fest', venue_name: 'Jhamsikhel Food Street', starts_at: new Date(Date.now() + 86400000*14).toISOString(), is_free: false, price: 500, status: 'active', category_id: eventCat, district_id: districtId },
    ]
    await supabase.from('events').upsert(sampleEvents, { onConflict: 'slug' })
  }

  console.log('Successfully seeded professional sample data!')
}

seed()
