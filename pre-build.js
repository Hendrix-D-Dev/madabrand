const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up directories for Vercel...');

// Create necessary directories if they don't exist
const dirs = [
  'dist',
  'components',
  'pages',
  'scripts',
  'styles',
  'assets/images',
  'assets/icons'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

// Create empty CSS file if it doesn't exist
const cssOutput = path.join(__dirname, 'dist', 'output.css');
if (!fs.existsSync(cssOutput)) {
  fs.writeFileSync(cssOutput, '/* Tailwind CSS will be generated here */');
  console.log('✅ Created empty output.css');
}

console.log('🎉 Setup complete!');