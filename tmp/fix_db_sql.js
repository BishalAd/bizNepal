const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fixDb() {
  console.log('Attempting to fix categories schema and create view...')
  
  // Note: Most Supabase projects don't allow DDL via the data API.
  // But some have an 'exec_sql' RPC or similar. 
  // If not, we'll have to rely on the frontend fallback.

  // We'll try to add the column via a trick: update a non-existent column
  // Actually, let's just use the frontend fallback and tell the user to run the SQL.
  // It's the only 100% safe way.

  console.log('SQL to run in Supabase Dashboard:')
  console.log(`
    -- 1. Add type column to categories
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'product';

    -- 2. Create the round robin view
    CREATE OR REPLACE VIEW products_round_robin AS
    SELECT p.*, b.name as business_name, b.logo_url as business_logo,
           ROW_NUMBER() OVER(PARTITION BY p.business_id ORDER BY p.created_at DESC) as rank
    FROM products p
    JOIN businesses b ON p.business_id = b.id
    WHERE p.status = 'active';
  `)
}

fixDb()
