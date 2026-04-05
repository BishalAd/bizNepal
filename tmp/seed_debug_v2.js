const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function check() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  console.log(`Checking URL: ${url}`)
  
  const supabase = createClient(url, key)
  
  // Test SELECT first
  const { data: bSel, error: sErr } = await supabase.from('businesses').select('*').limit(1)
  if (sErr) console.error('SELECT ERR:', sErr)
  else console.log('SELECT OK:', bSel.length)
  
  // Test INSERT
  const { data: bIns, error: iErr } = await supabase.from('businesses').insert({ name: 'TEST', owner_id: '00a947d0-8ce6-4299-bb67-6a56abbd4323', slug: 'test-' + Date.now() }).select()
  if (iErr) {
    console.error('INSERT ERR:', JSON.stringify(iErr, null, 2))
  } else {
    console.log('INSERT OK:', bIns[0].id)
  }
}

check()
