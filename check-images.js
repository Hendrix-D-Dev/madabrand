// check-images.js
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking image paths...\n');

// Check if assets directory exists
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log('❌ assets/ directory does not exist!');
  console.log('Creating assets structure...');
  
  const dirs = ['images/portfolio', 'images/logo', 'icons'];
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, 'assets', dir);
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created: assets/${dir}/`);
  });
} else {
  console.log('✅ assets/ directory exists');
  
  // List all images
  const listFiles = (dir, prefix = '') => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        console.log(`${prefix}📁 ${file}/`);
        listFiles(filePath, prefix + '  ');
      } else if (file.match(/\.(jpg|jpeg|png|gif|ico)$/i)) {
        console.log(`${prefix}🖼️  ${file} (${Math.round(stat.size / 1024)} KB)`);
      }
    });
  };
  
  listFiles(assetsDir);
}

console.log('\n📋 Current image references in portfolio.html:');
const portfolioHtml = fs.readFileSync(path.join(__dirname, 'pages/portfolio.html'), 'utf8');
const imageRegex = /src="([^"]+\.(jpg|jpeg|png|gif))"/gi;
let match;
while ((match = imageRegex.exec(portfolioHtml)) !== null) {
  console.log(`  ${match[1]}`);
  
  // Check if file exists
  const imagePath = path.join(__dirname, match[1].replace(/^\//, ''));
  if (fs.existsSync(imagePath)) {
    console.log(`    ✅ File exists`);
  } else {
    console.log(`    ❌ File NOT FOUND at: ${imagePath}`);
  }
}