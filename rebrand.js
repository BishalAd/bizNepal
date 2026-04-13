const fs = require('fs');
const path = require('path');

const directoryPath = path.join('c:', 'Biznity', 'bizNepal');

const excludeDirs = ['node_modules', '.next', '.git', 'dist'];

function processDirectory(dir) {
    let files = fs.readdirSync(dir);
    
    files.forEach(file => {
        let fullPath = path.join(dir, file);
        let stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                processDirectory(fullPath);
            }
        } else {
            // Only process common text files
            if (['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.txt', '.css'].some(ext => file.endsWith(ext))) {
                let content = fs.readFileSync(fullPath, 'utf8');
                let newContent = content
                    .replace(/biz-nepal\.vercel\.app/g, 'biznity.vercel.app')
                    .replace(/Biznity/g, 'Biznity')
                    .replace(/Biznity/g, 'Biznity')
                    .replace(/biznity/g, 'biznity')
                    .replace(/Biznity/g, 'Biznity')
                    // Also replace the URL link prefix if needed
                    .replace(/href="\/businesses\//g, 'href="/');
                    
                // Special case for dynamic router push
                newContent = newContent.replace(/router\.push\(`\/businesses\//g, 'router.push(`/');
                // Link href={`/...`}
                newContent = newContent.replace(/href={`\/businesses\//g, 'href={`/');

                if (content !== newContent) {
                    fs.writeFileSync(fullPath, newContent, 'utf8');
                    console.log(`Updated > ${fullPath}`);
                }
            }
        }
    });
}

console.log('Starting string replacement...');
processDirectory(directoryPath);
console.log('Finished strings replacement!');
