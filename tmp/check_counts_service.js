const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role if available, otherwise anon
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);

async function check() {
  const tables = ['businesses', 'offers', 'events', 'jobs', 'products', 'categories', 'districts'];
  console.log(`Using Key: ${key === process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`);
  
  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`${table} ERROR: ${error.message}`);
    } else {
      console.log(`${table}: ${count}`);
    }
  }
}

check();
