const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: districts } = await supabase.from('districts').select('*').limit(1)
  if (districts && districts[0]) console.log('DISTRICT_KEYS:', Object.keys(districts[0]).join(', '))
  
  const { data: categories } = await supabase.from('categories').select('*').limit(1)
  if (categories && categories[0]) console.log('CATEGORY_KEYS:', Object.keys(categories[0]).join(', '))
}

test()
