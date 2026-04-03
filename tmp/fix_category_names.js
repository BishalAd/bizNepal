const fs = require('fs')
const path = require('path')

const filesToFix = [
  'src/app/(public)/jobs/JobsClientListing.tsx',
  'src/app/(public)/businesses/BusinessDirectoryClient.tsx',
  'src/components/businesses/BusinessCard.tsx',
  'src/app/(public)/businesses/page.tsx',
  'src/app/(public)/businesses/[slug]/BusinessProfileClient.tsx',
]

function fixFile(relativePadding) {
  const absolutePath = path.join('c:/BizNepal/bizNepal', relativePadding)
  if (!fs.existsSync(absolutePath)) {
    console.log(`File not found: ${absolutePath}`)
    return
  }

  let content = fs.readFileSync(absolutePath, 'utf8')
  
  // Replacements
  const originalSize = content.length
  
  // Replace categories name_en with name
  content = content.replace(/categories\(name_en\)/g, 'categories(name)')
  content = content.replace(/categories.map\(\(c:any\) => <option key=\{c\.id\} value=\{c\.id\}>\{c\.name_en\}<\/option>\)/g, 'categories.map((c:any) => <option key={c.id} value={c.id}>{c.name}</option>)')
  content = content.replace(/business\.category\[0\]\?\.name_en/g, 'business.category[0]?.name')
  content = content.replace(/business\.category as any\)\?\.name_en/g, 'business.category as any)?.name')
  content = content.replace(/business\.category\?\.name_en/g, 'business.category?.name')
  content = content.replace(/\{c\.name_en\}/g, '{c.name}') // Generic one for dropdowns if the above fails
  content = content.replace(/\.select\('id, name_en, slug'\)/g, ".select('id, name, slug')")
  content = content.replace(/\.select\('id, name_en'\)/g, ".select('id, name')")
  
  if (content.length !== originalSize || content !== fs.readFileSync(absolutePath, 'utf8')) {
    fs.writeFileSync(absolutePath, content, 'utf8')
    console.log(`Fixed: ${relativePadding}`)
  } else {
    console.log(`No changes needed or could not find patterns in: ${relativePadding}`)
  }
}

filesToFix.forEach(fixFile)
