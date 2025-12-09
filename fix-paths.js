const fs = require('fs');
const path = require('path');

console.log('🔧 FIXING ALL PATHS FOR VERCEL DEPLOYMENT...');
console.log('==============================================');

// Process all HTML files
const htmlFiles = [
  'index.html',
  'pages/about.html',
  'pages/services.html',
  'pages/portfolio.html',
  'pages/contact.html'
];

htmlFiles.forEach(file => {
  try {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${file} - file not found`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    console.log(`\n📄 Processing: ${file}`);
    
    // Track changes
    let changes = 0;
    
    // 1. FIX COMPONENT FETCH PATHS (CRITICAL FIX)
    // Fix all variations of component fetch paths to: fetch('/components/navbar.html')
    const componentRegex = /fetch\(['"]([^'"]*components\/(navbar|footer)(?:\.html)?)['"]\)/g;
    const componentMatches = [...content.matchAll(componentRegex)];
    
    if (componentMatches.length > 0) {
      console.log(`   Found ${componentMatches.length} component fetch calls`);
      componentMatches.forEach(match => {
        console.log(`   - ${match[0]}`);
      });
      
      // Replace all component fetches with correct path
      content = content.replace(/fetch\(['"]([^'"]*components\/navbar(?:\.html)?)['"]\)/g, `fetch('/components/navbar.html')`);
      content = content.replace(/fetch\(['"]([^'"]*components\/footer(?:\.html)?)['"]\)/g, `fetch('/components/footer.html')`);
      changes += componentMatches.length;
    }
    
    // 2. FIX CSS PATHS
    const cssMatches = content.match(/href="[^"]*dist\/output\.css"/g);
    if (cssMatches) {
      console.log(`   Found ${cssMatches.length} CSS references`);
      content = content.replace(/href="[^"]*dist\/output\.css"/g, 'href="/dist/output.css"');
      changes += cssMatches.length;
    }
    
    // 3. FIX JAVASCRIPT PATHS
    const jsMatches = content.match(/src="[^"]*scripts\/([^"]+)"/g);
    if (jsMatches) {
      console.log(`   Found ${jsMatches.length} JS references`);
      content = content.replace(/src="[^"]*scripts\//g, 'src="/scripts/');
      changes += jsMatches.length;
    }
    
    // 4. FIX ASSET PATHS (favicon, images, etc.)
    const assetMatches = content.match(/href="[^"]*assets\//g) || [];
    const assetMatches2 = content.match(/src="[^"]*assets\//g) || [];
    const totalAssetMatches = assetMatches.length + assetMatches2.length;
    
    if (totalAssetMatches > 0) {
      console.log(`   Found ${totalAssetMatches} asset references`);
      content = content.replace(/href="[^"]*assets\//g, 'href="/assets/');
      content = content.replace(/src="[^"]*assets\//g, 'src="/assets/');
      changes += totalAssetMatches;
    }
    
    // 5. FIX PAGE LINKS (CRITICAL FOR NAVIGATION)
    // Replace all page links with clean URLs
    const pageLinks = {
      'about\\.html': '/about',
      'services\\.html': '/services', 
      'portfolio\\.html': '/portfolio',
      'contact\\.html': '/contact',
      'index\\.html': '/'
    };
    
    Object.entries(pageLinks).forEach(([oldPath, newPath]) => {
      const regex = new RegExp(`href=["']([^"']*${oldPath})["']`, 'g');
      const matches = [...content.matchAll(regex)];
      
      if (matches.length > 0) {
        console.log(`   Found ${matches.length} links to ${oldPath}`);
        content = content.replace(regex, `href="${newPath}"`);
        changes += matches.length;
      }
    });
    
    // 6. FIX NAVIGATION IN PAGES (special case for pages/*.html files)
    if (file.startsWith('pages/')) {
      // In page files, all navigation should point to root URLs
      const navLinks = content.match(/href=["']\.\.\/[^"']*["']/g);
      if (navLinks) {
        console.log(`   Found ${navLinks.length} relative navigation links`);
        // Replace ../index.html with /
        content = content.replace(/href=["']\.\.\/index\.html["']/g, 'href="/"');
        // Replace ../pages/xxx.html with /xxx
        content = content.replace(/href=["']\.\.\/pages\/(about|services|portfolio|contact)\.html["']/g, 'href="/$1"');
        changes += navLinks.length;
      }
    }
    
    // Write the fixed file
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${file} (${changes} changes made)`);
    
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
});

console.log('\n==============================================');
console.log('🎉 PATH FIXING COMPLETE!');
console.log('\n📋 DEPLOYMENT CHECKLIST:');
console.log('1. ✅ All component fetch paths fixed');
console.log('2. ✅ All CSS/JS paths made absolute');
console.log('3. ✅ All page links use clean URLs (/about, /services, etc.)');
console.log('4. ✅ All asset paths made absolute');
console.log('\n🚀 NEXT STEPS:');
console.log('1. Run: npm run build');
console.log('2. Run: node move-pages.js (if using move-pages approach)');
console.log('3. Push to GitHub: git add . && git commit -m "Fix paths" && git push');
console.log('4. Vercel will auto-deploy!');