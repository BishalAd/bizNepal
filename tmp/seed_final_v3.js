const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
  const ownerId = profiles[0].id
  const { data: categories } = await supabase.from('categories').select('id').limit(1)
  const catId = categories[0].id
  const { data: districts } = await supabase.from('districts').select('id').limit(1)
  const distId = districts[0].id

  console.log('Inserting business...')
  const b = {
    owner_id: ownerId,
    name: 'Everest Tech Hub',
    slug: 'everest-tech-hub',
    city: 'Kathmandu',
    address: 'New Road, Kathmandu',
    category_id: catId,
    district_id: distId,
    is_active: true,
    is_verified: true,
    rating: 4.8
  }
  const { data: bData, error: bErr } = await supabase.from('businesses').insert(b).select()
  if (bErr) {
    console.error('BIZ ERR:', bErr.message)
    return
  }
  const bizId = bData[0].id

  console.log('Inserting product...')
  const p = {
    business_id: bizId,
    name: 'MacBook Pro M3',
    slug: 'macbook-pro-m3',
    price: 295000,
    category_id: catId,
    stock: 5,
    status: 'active'
  }
  const { error: pErr } = await supabase.from('products').insert(p)
  if (pErr) console.error('PROD ERR:', pErr.message)

  console.log('DONE')
}

seed()
