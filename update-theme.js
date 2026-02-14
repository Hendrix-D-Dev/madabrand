const fs = require('fs');
const path = require('path');

console.log('🎨 UPDATING THEME TO DEEP BLUE/WHITE ACROSS ALL PAGES...\n');

// Files to update
const files = [
    'about.html',
    'services.html', 
    'contact.html',
    'portfolio.html',
    'index.html'
];

// Theme replacements - improved to prevent duplicates
const replacements = [
    // Body background
    [/class="font-body bg-off-white"/g, 'class="font-body bg-white text-gray-800"'],
    [/class="font-body bg-gray-50"/g, 'class="font-body bg-white text-gray-800"'],
    
    // Gold to Deep Blue
    [/text-gold/g, 'text-deep-blue'],
    [/bg-gold/g, 'bg-deep-blue'],
    [/border-gold/g, 'border-deep-blue'],
    [/from-gold/g, 'from-deep-blue'],
    [/to-gold/g, 'to-deep-blue'],
    [/bg-gold\/10/g, 'bg-deep-blue/10'],
    [/bg-gold\/20/g, 'bg-deep-blue/20'],
    [/border-gold\/30/g, 'border-deep-blue/30'],
    [/text-gold\/80/g, 'text-deep-blue/80'],
    
    // Update gradient backgrounds
    [/bg-gradient-to-r from-deep-blue\/5 to-gold\/5/g, 'bg-gradient-to-r from-deep-blue/10 to-blue-100'],
    [/bg-gradient-to-br from-deep-blue\/20 to-gold\/20/g, 'bg-gradient-to-br from-deep-blue/20 to-blue-200'],
    [/bg-gradient-to-br from-gold\/20 to-deep-blue\/20/g, 'bg-gradient-to-br from-deep-blue/20 to-blue-300'],
    
    // Update buttons
    [/bg-gold text-black/g, 'bg-deep-blue text-white'],
    [/bg-gold text-white/g, 'bg-deep-blue text-white'],
    [/hover:bg-gold/g, 'hover:bg-blue-700'],
    
    // Update borders
    [/border-gray-200/g, 'border-gray-300'],
    [/border-gray-100/g, 'border-gray-200'],
    
    // Update shadows
    [/shadow-lg/g, 'shadow-md'],
    [/shadow-xl/g, 'shadow-lg'],
    
    // Update footer
    [/bg-black text-white/g, 'bg-gradient-to-b from-deep-blue to-blue-900 text-white'],
];

// Remove duplicate classes from content
function removeDuplicateClasses(content) {
    // Pattern to find class attributes
    const classRegex = /class="([^"]*)"/g;
    
    return content.replace(classRegex, (match, classes) => {
        // Split classes, remove duplicates, and rejoin
        const classList = classes.split(/\s+/).filter(Boolean);
        const uniqueClasses = [...new Set(classList)];
        return `class="${uniqueClasses.join(' ')}"`;
    });
}

let totalChanges = 0;

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let fileChanges = 0;
        
        console.log(`\n📄 Processing: ${file}`);
        
        // First, remove any existing duplicate classes
        const beforeLength = content.length;
        content = removeDuplicateClasses(content);
        if (content.length !== beforeLength) {
            console.log(`   ↪ Cleaned up duplicate classes`);
        }
        
        // Apply all replacements
        replacements.forEach(([pattern, replacement], index) => {
            const matches = content.match(pattern);
            if (matches) {
                content = content.replace(pattern, replacement);
                fileChanges += matches.length;
                if (matches.length > 0) {
                    console.log(`   ↪ Applied: ${pattern.toString().slice(0,50)}...`);
                }
            }
        });
        
        // Special: Update logo in headers
        const logoPattern = /<a[^>]*href="[^"]*"[^>]*>[\s\S]*?Mada<span[^>]*>Brand<\/span>[\s\S]*?<\/a>/;
        if (logoPattern.test(content)) {
            content = content.replace(
                logoPattern,
                `<a href="/" class="flex items-center">
                    <img src="/assets/images/photo_10_2025-12-10_09-49-24.jpg" 
                         alt="MadaBrand Logo" 
                         class="h-14 w-14 object-cover rounded-full border-4 border-deep-blue shadow-lg hover:scale-105 transition-transform duration-300">
                </a>`
            );
            fileChanges++;
            console.log(`   ↪ Updated logo to image-only`);
        }
        
        // Update navigation links to use clean URLs
        content = content.replace(/href="\.\.\/index\.html"/g, 'href="/"');
        content = content.replace(/href="\.\.\/pages\/(about|services|portfolio|contact)\.html"/g, 'href="/$1"');
        
        // Remove duplicate classes again after replacements
        content = removeDuplicateClasses(content);
        
        fs.writeFileSync(filePath, content);
        console.log(`✅ Updated ${file} (${fileChanges} changes)`);
        totalChanges += fileChanges;
    } else {
        console.log(`⚠️  ${file} not found, skipping...`);
    }
});

console.log('\n' + '='.repeat(50));
console.log(`🎉 THEME UPDATE COMPLETE!`);
console.log(`📊 Total changes across all files: ${totalChanges}`);
console.log('\n🚀 NEXT STEPS:');
console.log('1. Run: npm run build');
console.log('2. Run: npm start (to preview locally)');
console.log('3. Check all pages for consistency');
console.log('4. Deploy: git add . && git commit -m "Update theme" && git push');
console.log('\n💡 TIP: You can also run "npm run theme:deploy" for quick deployment');