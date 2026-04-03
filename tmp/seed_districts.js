const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Using service role to bypass RLS for seeding if needed
const supabase = createClient(supabaseUrl, supabaseKey)

const districts = [
  ['Taplejung', 'ताप्लेजुङ', 'Koshi'], ['Panchthar', 'पाँचथर', 'Koshi'], ['Ilam', 'इलाम', 'Koshi'], ['Jhapa', 'झापा', 'Koshi'], ['Morang', 'मोरङ', 'Koshi'], ['Sunsari', 'सुनसरी', 'Koshi'], ['Dhankuta', 'धनकुटा', 'Koshi'], ['Tehrathum', 'तेह्रथुम', 'Koshi'], ['Sankhuwasabha', 'सङ्खुवासभा', 'Koshi'], ['Bhojpur', 'भोजपुर', 'Koshi'], ['Solukhumbu', 'सोलुखुम्बु', 'Koshi'], ['Okhaldhunga', 'ओखलढुङ्गा', 'Koshi'], ['Khotang', 'खोटाङ', 'Koshi'], ['Udayapur', 'उदयपुर', 'Koshi'],
  ['Saptari', 'सप्तरी', 'Madhesh'], ['Siraha', 'सिराहा', 'Madhesh'], ['Dhanusha', 'धनुषा', 'Madhesh'], ['Mahottari', 'महोत्तरी', 'Madhesh'], ['Sarlahi', 'सर्लाही', 'Madhesh'], ['Rautahat', 'रौतहट', 'Madhesh'], ['Bara', 'बारा', 'Madhesh'], ['Parsa', 'पर्सा', 'Madhesh'],
  ['Dolakha', 'दोलखा', 'Bagmati'], ['Sindhupalchok', 'सिन्धुपाल्चोक', 'Bagmati'], ['Rasuwa', 'रसुवा', 'Bagmati'], ['Dhading', 'धादिङ', 'Bagmati'], ['Nuwakot', 'नुवाकोट', 'Bagmati'], ['Kathmandu', 'काठमाडौं', 'Bagmati'], ['Bhaktapur', 'भक्तपुर', 'Bagmati'], ['Lalitpur', 'ललितपुर', 'Bagmati'], ['Kavrepalanchok', 'काभ्रेपलाञ्चोक', 'Bagmati'], ['Ramechhap', 'रामेछाप', 'Bagmati'], ['Sindhuli', 'सिन्धुली', 'Bagmati'], ['Makwanpur', 'मकवानपुर', 'Bagmati'], ['Chitwan', 'चितवन', 'Bagmati'],
  ['Gorkha', 'गोरखा', 'Gandaki'], ['Manang', 'मनाङ', 'Gandaki'], ['Mustang', 'मुस्ताङ', 'Gandaki'], ['Myagdi', 'म्याग्दी', 'Gandaki'], ['Kaski', 'कास्की', 'Gandaki'], ['Lamjung', 'लमजुङ', 'Gandaki'], ['Tanahun', 'तनहुँ', 'Gandaki'], ['Nawalpur', 'नवलपुर', 'Gandaki'], ['Syangja', 'स्याङ्जा', 'Gandaki'], ['Parbat', 'पर्वत', 'Gandaki'], ['Baglung', 'बागलुङ', 'Gandaki'],
  ['Rukum East', 'रुकुम पूर्व', 'Lumbini'], ['Rolpa', 'रोलपा', 'Lumbini'], ['Pyuthan', 'प्युठान', 'Lumbini'], ['Gulmi', 'गुल्मी', 'Lumbini'], ['Arghakhanchi', 'अर्घाखाँची', 'Lumbini'], ['Palpa', 'पाल्पा', 'Lumbini'], ['Rupandehi', 'रुपन्देही', 'Lumbini'], ['Kapilvastu', 'कपिलवस्तु', 'Lumbini'], ['Dang', 'दाङ', 'Lumbini'], ['Banke', 'बाँके', 'Lumbini'], ['Bardiya', 'बर्दिया', 'Lumbini'], ['Parasi', 'परासी', 'Lumbini'],
  ['Dolpa', 'डोल्पा', 'Karnali'], ['Mugu', 'मुगु', 'Karnali'], ['Humla', 'हुम्ला', 'Karnali'], ['Jumla', 'जुम्ला', 'Karnali'], ['Kalikot', 'कालिकोट', 'Karnali'], ['Dailekh', 'दैलेख', 'Karnali'], ['Jajarkot', 'जाजरकोट', 'Karnali'], ['Rukum West', 'रुकुम पश्चिम', 'Karnali'], ['Salyan', 'सल्यान', 'Karnali'], ['Surkhet', 'सुर्खेत', 'Karnali'],
  ['Bajura', 'बाजुरा', 'Sudurpashchim'], ['Bajhang', 'बझाङ', 'Sudurpashchim'], ['Darchula', 'दार्चुला', 'Sudurpashchim'], ['Baitadi', 'बैतडी', 'Sudurpashchim'], ['Dadeldhura', 'डडेल्धुरा', 'Sudurpashchim'], ['Doti', 'डोटी', 'Sudurpashchim'], ['Achham', 'अछाम', 'Sudurpashchim'], ['Kailali', 'कैलाली', 'Sudurpashchim'], ['Kanchanpur', 'कञ्चनपुर', 'Sudurpashchim']
].map(d => ({
  name_en: d[0],
  name_np: d[1],
  province: d[2]
}))

async function seed() {
  console.log('Seeding districts...')
  const { data, error } = await supabase.from('districts').insert(districts)
  if (error) {
    console.error('Error seeding districts:', error)
  } else {
    console.log('Successfully seeded 77 districts!')
  }
}

seed()
