// fix-paths.js
const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING COMPONENT PATHS FOR VERCEL...');

const files = [
  'index.html',
  'pages/about.html',
  'pages/services.html',
  'pages/portfolio.html',
  'pages/contact.html'
];

files.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Skipping ${file} - not found`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    console.log(`\n📄 Processing ${file}...`);
    
    // Check what fetch paths exist
    const fetchMatches = content.match(/fetch\(['"]([^'"]+)['"]\)/g);
    if (fetchMatches) {
      console.log('Found fetch calls:', fetchMatches);
    }
    
    // FIX 1: Replace ALL component fetch paths to /components/navbar and /components/footer
    content = content.replace(/fetch\(['"]\.\.\/components\/(navbar|footer)\.html['"]\)/g, `fetch('/components/$1')`);
    content = content.replace(/fetch\(['"]\.\/components\/(navbar|footer)\.html['"]\)/g, `fetch('/components/$1')`);
    content = content.replace(/fetch\(['"]\/styles\/components\/(navbar|footer)['"]\)/g, `fetch('/components/$1')`);
    content = content.replace(/fetch\(['"]\/components\/(navbar|footer)\.html['"]\)/g, `fetch('/components/$1')`);
    content = content.replace(/fetch\(['"]components\/(navbar|footer)\.html['"]\)/g, `fetch('/components/$1')`);
    
    // FIX 2: Make all CSS/JS paths absolute
    content = content.replace(/href="\.\.\/dist\/output\.css"/g, 'href="/dist/output.css"');
    content = content.replace(/href="\.\/dist\/output\.css"/g, 'href="/dist/output.css"');
    content = content.replace(/src="\.\.\/scripts\//g, 'src="/scripts/');
    content = content.replace(/src="\.\/scripts\//g, 'src="/scripts/');
    
    // FIX 3: Make all asset paths absolute
    content = content.replace(/href="\.\.\/assets\//g, 'href="/assets/');
    content = content.replace(/href="\.\/assets\//g, 'href="/assets/');
    content = content.replace(/src="\.\.\/assets\//g, 'src="/assets/');
    content = content.replace(/src="\.\/assets\//g, 'src="/assets/');
    
    // FIX 4: Make page links use clean URLs
    content = content.replace(/href="\.\.\/pages\/(about|services|portfolio|contact)\.html"/g, 'href="/$1"');
    content = content.replace(/href="\.\/pages\/(about|services|portfolio|contact)\.html"/g, 'href="/$1"');
    content = content.replace(/href="pages\/(about|services|portfolio|contact)\.html"/g, 'href="/$1"');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${file}`);
    
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n🎉 Path fixing complete!');
console.log('\n📋 VERIFICATION:');
console.log('1. Components will load from: /components/navbar');
console.log('2. Components will load from: /components/footer');
console.log('3. Test URLs:');
console.log('   - https://your-site.vercel.app/components/navbar');
console.log('   - https://your-site.vercel.app/components/footer');