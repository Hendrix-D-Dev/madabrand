const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing paths for Vercel deployment...');

const htmlFiles = [
  'index.html',
  'pages/about.html',
  'pages/services.html',
  'pages/portfolio.html',
  'pages/contact.html'
];

// Update paths in HTML files
htmlFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} - file not found`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace relative paths with absolute paths for production
    content = content.replace(/href="\.\.\//g, 'href="/');
    content = content.replace(/src="\.\.\//g, 'src="/');
    content = content.replace(/fetch\('\.\.\//g, `fetch('/`);
    content = content.replace(/fetch\("\.\.\//g, `fetch("/`);
    
    // Fix common component paths
    content = content.replace(/href="\.\/components\//g, 'href="/components/');
    content = content.replace(/src="\.\/scripts\//g, 'src="/scripts/');
    content = content.replace(/href="\.\/assets\//g, 'href="/assets/');
    
    // Update Tailwind CSS path
    content = content.replace(/href="\.\.\/dist\/output\.css"/g, 'href="/dist/output.css"');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed paths in ${file}`);
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

// Check if dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('📁 Creating dist directory...');
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
}

console.log('🎉 Path fixing complete!');
console.log('👉 Run: npm run build');
console.log('👉 Then: git add . && git commit -m "Fix paths" && git push');