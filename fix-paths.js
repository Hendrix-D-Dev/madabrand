// fix-paths.js
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing paths for deployment...');

const htmlFiles = [
  'index.html',
  'pages/about.html',
  'pages/services.html',
  'pages/portfolio.html',
  'pages/contact.html'
];

// For each HTML file, fix the paths
htmlFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Skipping ${file} - not found`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    console.log(`📄 Processing ${file}...`);
    
    // Fix CSS paths - all should be absolute
    content = content.replace(/href="\.\.\/dist\/output\.css"/g, 'href="/dist/output.css"');
    
    // Fix JS paths - all should be absolute
    content = content.replace(/src="\.\.\/scripts\//g, 'src="/scripts/');
    
    // Fix favicon paths
    content = content.replace(/href="\.\.\/assets\//g, 'href="/assets/');
    
    // Fix fetch paths for components - these need special handling
    // For pages/*.html, components are at /components/
    // For index.html, components are at ./components/
    
    if (file === 'index.html') {
      // For index.html, use relative paths
      content = content.replace(/fetch\('\.\/components\//g, `fetch('./components/`);
      content = content.replace(/fetch\("\.\/components\//g, `fetch("./components/`);
    } else {
      // For pages, use absolute paths
      content = content.replace(/fetch\('\.\.\/components\//g, `fetch('/components/`);
      content = content.replace(/fetch\("\.\.\/components\//g, `fetch("/components/`);
    }
    
    // Fix internal links between pages
    content = content.replace(/href="\.\.\/pages\//g, 'href="/pages/');
    content = content.replace(/href="\.\.\/index\.html/g, 'href="/index.html');
    content = content.replace(/href="\.\/index\.html/g, 'href="/index.html');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed paths in ${file}`);
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('🎉 Path fixing complete!');