const fs = require('fs');
const path = require('path');

console.log('📁 Moving pages to root for Vercel...');

const pages = ['about', 'services', 'portfolio', 'contact'];

// Process each page
pages.forEach(page => {
  const source = path.join(__dirname, 'pages', `${page}.html`);
  const dest = path.join(__dirname, `${page}.html`);
  
  if (fs.existsSync(source)) {
    let content = fs.readFileSync(source, 'utf8');
    
    // Fix all relative paths to absolute
    content = content.replace(/href="\.\.\//g, 'href="/');
    content = content.replace(/src="\.\.\//g, 'src="/');
    
    // Fix fetch calls for components
    content = content.replace(/fetch\(['"]\.\.\/components\/(navbar|footer)\.html['"]\)/g, `fetch('/components/$1.html')`);
    content = content.replace(/fetch\(['"]\.\/components\/(navbar|footer)\.html['"]\)/g, `fetch('/components/$1.html')`);
    
    // Fix CSS path
    content = content.replace(/href="[^"]*dist\/output\.css"/g, 'href="/dist/output.css"');
    
    // Fix navigation links to use clean URLs
    content = content.replace(/href="\.\.\/pages\/(about|services|portfolio|contact)\.html"/g, 'href="/$1"');
    content = content.replace(/href="\.\.\/index\.html"/g, 'href="/"');
    
    // Write to root
    fs.writeFileSync(dest, content);
    console.log(`✅ Created ${page}.html in root`);
  } else {
    console.log(`⚠️ ${source} not found`);
  }
});

console.log('🎉 Pages moved to root! Now pages will be accessible at:');
console.log('   /about, /services, /portfolio, /contact');