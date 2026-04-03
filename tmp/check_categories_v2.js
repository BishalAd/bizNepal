const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('categories').select('*').limit(1)
  if (error) {
    console.error('Error:', error)
  } else if (data && data.length > 0) {
    console.log('KEYS:', Object.keys(data[0]).join(', '))
    console.log('ITEM:', JSON.stringify(data[0], null, 2))
  } else {
    console.log('No categories found')
  }
}

test()
