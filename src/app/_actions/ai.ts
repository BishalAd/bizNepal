'use server'

import { createClient } from '@/lib/supabase/server'

export async function enhanceDescription(currentDescription: string, businessName: string, city: string, province: string) {
  const supabase = await createClient()
  
  // Verify that the user is authenticated (security measure)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  // Ensure input length isn't absurdly long to prevent basic abuse
  if (currentDescription.length > 2000) {
    throw new Error('Description is too long')
  }

  // Pretend to call an LLM API here. 
  // We simulate the latency.
  await new Promise(resolve => setTimeout(resolve, 1500))

  const cleanDescription = currentDescription.trim()

  const improved = `🚀 Welcome to ${businessName}! 

${cleanDescription}

At ${businessName}, we are committed to delivering excellence and high-quality service to our valued customers in ${city}. Whether you're looking for professional expertise or local reliability, our team ensures a seamless experience designed around your needs. 

✨ Why Choose Us?
✅ Trusted Local Expertise in ${province}
✅ Dedicated Customer Support
✅ Quality Guaranteed

Connect with us today!`.trim()

  return { success: true, enhancedDescription: improved }
}
