const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function seed() {
  console.log('Seeding jobs and events...')

  const { data: profiles } = await supabase.from('profiles').select('id').limit(1)
  const ownerId = profiles?.[0]?.id

  const { data: categories } = await supabase.from('categories').select('id').limit(1)
  const catId = categories[0].id

  const { data: districts } = await supabase.from('districts').select('id').limit(1)
  const districtId = districts[0].id

  const { data: businesses } = await supabase.from('businesses').select('id').limit(2)
  const bizId = businesses[0].id

  // Create Jobs
  const sampleJobs = [
    { business_id: bizId, title: 'Senior Frontend Developer', slug: 'senior-frontend-dev', job_type: 'FULL-TIME', location_type: 'REMOTE', salary_min: 150000, salary_max: 200000, show_salary: true, status: 'active', category_id: catId, district_id: districtId },
    { business_id: bizId, title: 'Marketing Manager', slug: 'marketing-manager', job_type: 'FULL-TIME', location_type: 'ON-SITE', salary_min: 60000, salary_max: 90000, show_salary: true, status: 'active', category_id: catId, district_id: districtId },
  ]
  await supabase.from('jobs').upsert(sampleJobs, { onConflict: 'slug' })

  // Create Events
  const sampleEvents = [
    { business_id: bizId, title: 'BizNepal Grand Opening', slug: 'biznepal-grand-opening', venue_name: 'Virtual', starts_at: new Date(Date.now() + 86400000*30).toISOString(), is_free: true, status: 'active', category_id: catId, district_id: districtId },
  ]
  await supabase.from('events').upsert(sampleEvents, { onConflict: 'slug' })

  console.log('Successfully seeded jobs and events!')
}

seed()
