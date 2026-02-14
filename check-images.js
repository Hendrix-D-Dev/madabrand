const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING IMAGE PATHS AND AVAILABILITY...\n');

// Check directories
const checkDir = (dirPath, dirName) => {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    const images = files.filter(f => f.match(/\.(jpg|jpeg|png|gif|svg|ico)$/i));
    console.log(`✅ ${dirName}: ${images.length} image files`);
    return images.length;
  } else {
    console.log(`❌ ${dirName}: Directory not found`);
    return 0;
  }
};

let totalImages = 0;
totalImages += checkDir(path.join(__dirname, 'assets/images'), 'assets/images/');
totalImages += checkDir(path.join(__dirname, 'assets/icons'), 'assets/icons/');

console.log(`\n📊 Total images found: ${totalImages}`);

// Check specific important files
console.log('\n🔑 CRITICAL FILES CHECK:');
const criticalFiles = [
  '/assets/images/photo_10_2025-12-10_09-49-24.jpg',
  '/assets/images/photo_1_2025-12-10_09-45-08.jpg',
  '/assets/icons/favicon.ico'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file.replace(/^\//, ''));
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${Math.round(stats.size / 1024)} KB)`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
  }
});

console.log('\n🎯 IMAGE CHECK COMPLETE');
if (totalImages >= 10) {
  console.log('✅ Good! You have enough images for the portfolio.');
} else {
  console.log('⚠️  Consider adding more images for a complete portfolio.');
}