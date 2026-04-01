
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkSchema() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching products:', error)
  } else {
    console.log('Product columns:', data ? Object.keys(data[0] || {}) : 'No data')
  }

  const { data: viewData, error: viewError } = await supabase
    .from('products_round_robin')
    .select('*')
    .limit(1)

  if (viewError) {
    console.error('Error fetching products_round_robin:', viewError.message)
  } else {
    console.log('products_round_robin columns:', viewData ? Object.keys(viewData[0] || {}) : 'No data')
  }
}

checkSchema()
