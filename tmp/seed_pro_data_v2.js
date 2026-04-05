const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('Seeding professional sample data...')

  // Get current user id
  const { data: { user } } = await supabase.auth.getUser()
  // Since we are seeding, we might not have a logged in user in this script. 
  // We'll use a dummy UUID if needed, but businesses require an owner_id.
  // I'll check if there are any profiles.
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
  const ownerId = profiles?.[0]?.id

  if (!ownerId) {
    console.warn('No profiles found to own the businesses. Creating a dummy profile if possible...')
    // For now, I'll assume there is at least one profile from the user's manual testing.
    return
  }

  // 1. Get some categories
  const { data: categories } = await supabase.from('categories').select('id, name')
  if (!categories || categories.length === 0) {
    console.error('No categories found.')
    return
  }

  const catId = categories[0].id

  // 2. Get a district
  const { data: districts } = await supabase.from('districts').select('id').limit(1)
  const districtId = districts?.[0]?.id

  // 3. Create Businesses
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
      review_count: 124,
      whatsapp: '9800000001'
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
       review_count: 89,
       whatsapp: '9800000002'
    }
  ]

  const { data: createdBusinesses, error: bizErr } = await supabase.from('businesses').upsert(sampleBusinesses, { onConflict: 'slug' }).select()
  if (bizErr) console.error('Error seeding businesses:', bizErr)
  
  const bizIds = createdBusinesses?.map(b => b.id) || []

  // 4. Create Products
  if (bizIds.length > 0) {
    console.log('Creating products...')
    const sampleProducts = [
      { business_id: bizIds[0], name: 'MacBook Pro M3', slug: 'macbook-pro-m3', price: 295000, description: 'Apple M3 Pro chip, 14-inch.', category_id: catId, stock: 5, status: 'active', allows_esewa: true },
      { business_id: bizIds[0], name: 'Logitech MX Master 3', slug: 'logitech-mx-master-3', price: 15500, description: 'Advanced Wireless Mouse.', category_id: catId, stock: 12, status: 'active', allows_khalti: true },
      { business_id: bizIds[1], name: 'Dhaka Topi Premium', slug: 'dhaka-topi-premium', price: 1500, description: 'Handmade Palpali Dhaka Topi.', category_id: catId, stock: 50, status: 'active', allows_cod: true },
    ]
    await supabase.from('products').upsert(sampleProducts, { onConflict: 'slug' })
  }

  console.log('Successfully seeded professional sample data!')
}

seed()
