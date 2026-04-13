import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { productName, category, businessName } = await request.json()

    // Mock Anthropic Request, as per environment availability. You should use the official API natively:
    // await fetch('https://api.anthropic.com/v1/messages') ...
    // Using fake logic to comply safely:

    // Prompt engineering defined by user params:
    const systemPrompt = "You write product descriptions for a Nepali e-commerce platform. Write in both English and Nepali (Devanagari script). Be accurate, helpful, and culturally appropriate for Nepal."
    const userPrompt = `Write a product description for: ${productName} in category ${category} sold by ${businessName}. Return exactly JSON format: {"english": "...", "nepali": "..."}`

    // Mock response simulating a Claude output due to key unavailability
    const responseJson = {
       english: `${productName} by ${businessName} is the definitive choice for your ${category} needs in Nepal. Crafted with exceptional quality and built to deliver supreme reliability. Get it today on Biznity.`,
       nepali: `${businessName} ले प्रस्तुत गर्दैछ उत्कृष्ट ${productName}। ${category} को लागि यो नेपालमै सबैभन्दा भरपर्दो विकल्प हो। उत्कृष्ट गुणस्तर र लामो टिकाउपनका साथ, आजै अर्डर गर्नुहोस्।`
    }

    return NextResponse.json(responseJson)
  } catch (error: any) {
    return NextResponse.json({ error: 'AI Error: ' + error.message }, { status: 500 })
  }
}
