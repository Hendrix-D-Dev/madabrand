const fs = require('fs');
const path = require('path');

console.log('📁 ORGANIZING IMAGES FOR MADABRAND WEBSITE...\n');

// Create directories if they don't exist
const directories = [
  'assets/images/portfolio',
  'assets/images/logo',
  'assets/images/clients',
  'assets/images/testimonials',
  'assets/icons'
];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`📁 Directory exists: ${dir}`);
  }
});

// Check what images are already in assets/images
const imagesDir = path.join(__dirname, 'assets/images');
if (fs.existsSync(imagesDir)) {
  const files = fs.readdirSync(imagesDir);
  const imageFiles = files.filter(file => file.match(/\.(jpg|jpeg|png|gif|svg)$/i));
  
  console.log(`\n📸 Found ${imageFiles.length} image files in assets/images/:`);
  imageFiles.forEach(file => {
    const filePath = path.join(imagesDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   ${file} (${Math.round(stats.size / 1024)} KB)`);
  });
}

console.log('\n📋 INSTRUCTIONS:');
console.log('1. Your logo should be: photo_10_2025-12-10_09-49-24.jpg');
console.log('2. Portfolio images: photo_1.jpg to photo_9.jpg');
console.log('\n🎯 Current setup is correct if images are in assets/images/ folder');
console.log('\n💡 TIP: Run "npm run check-images" to verify paths');