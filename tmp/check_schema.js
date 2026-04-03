const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function checkSchema() {
  const tables = ['products', 'jobs', 'events', 'businesses', 'offers']
  
  for (const table of tables) {
    try {
      console.log(`\n--- TABLE: ${table} ---`)
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
         console.log(`Error reading ${table}: ${error.message}`)
         continue
      }
      
      if (data && data[0]) {
        console.log(`Columns: ${Object.keys(data[0]).join(', ')}`)
      } else {
        console.log(`Table is empty. Checking information_schema...`)
        // Fallback to information_schema (requires service role / permissions)
        const { data: cols, error: cError } = await supabase.rpc('get_table_columns', { table_name: table })
        if (cError) {
          console.log(`Could not get columns for empty table ${table}: ${cError.message}`)
        } else {
          console.log(`Columns (from RPC): ${cols.join(', ')}`)
        }
      }
    } catch (e) {
      console.log(`Catch error for ${table}: ${e.message}`)
    }
  }
}

// Helper to check for the view and its definition if possible
async function checkViews() {
  const { data: views, error } = await supabase.rpc('get_views')
  if (error) {
    console.log(`Error fetching views: ${error.message}`)
  } else {
    console.log(`\nExisting Views: ${JSON.stringify(views)}`)
  }
}

checkSchema()
