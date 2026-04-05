const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('Clearing old businesses...')
  await supabase.from('businesses').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
  const ownerId = profiles?.[0]?.id || '00a947d0-8ce6-4299-bb67-6a56abbd4323'

  const { data: categories } = await supabase.from('categories').select('id, name')
  const catId = categories[0].id
  const { data: districts } = await supabase.from('districts').select('id').limit(1)
  const distId = districts[0].id

  const sampleBusinesses = [
    {
      owner_id: ownerId,
      name: 'Everest Tech',
      slug: 'everest-tech',
      city: 'Kathmandu',
      address: 'New Road',
      category_id: catId,
      district_id: distId,
      is_active: true,
      is_verified: true
    },
    {
       owner_id: ownerId,
       name: 'Himalayan Fashion',
       slug: 'himalayan-fashion',
       city: 'Kathmandu',
       address: 'Darbar Marg',
       category_id: catId,
       district_id: distId,
       is_active: true,
       is_verified: true
    }
  ]

  console.log('Inserting businesses...')
  const { data: bData, error: bErr } = await supabase.from('businesses').insert(sampleBusinesses).select()
  if (bErr) {
    console.error('BIZ INSER ERR:', bErr.message)
    return
  }

  const bizId = bData[0].id
  console.log('Inserting products...')
  const sampleProducts = [
    { business_id: bizId, name: 'MacBook', slug: 'macbook', price: 2000, category_id: catId, stock: 10, status: 'active' },
    { business_id: bizId, name: 'iPhone', slug: 'iphone', price: 1000, category_id: catId, stock: 20, status: 'active' }
  ]
  const { error: pErr } = await supabase.from('products').insert(sampleProducts)
  if (pErr) console.error('PROD INSERT ERR:', pErr.message)

  console.log('SUCCESS')
}

seed()
