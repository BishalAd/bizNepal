const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
  const ownerId = profiles?.[0]?.id
  const { data: categories } = await supabase.from('categories').select('id').limit(1)
  const catId = categories?.[0]?.id
  const { data: districts } = await supabase.from('districts').select('id').limit(1)
  const distId = districts?.[0]?.id

  console.log(`Using Owner: ${ownerId}, Category: ${catId}, District: ${distId}`)

  const biz = {
    owner_id: ownerId,
    name: 'Everest Tech',
    slug: 'everest-tech-' + Date.now(),
    category_id: catId,
    district_id: distId,
    is_active: true,
    is_verified: true
  }

  const { data, error } = await supabase.from('businesses').insert(biz).select()
  if (error) {
    console.error('INSERT ERROR:', error.message)
  } else {
    console.log('INSERT SUCCESS:', data[0].id)
  }
}

seed()
