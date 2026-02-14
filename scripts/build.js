#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏗️  MadaBrand Build System\n');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Step 1: Process HTML files
console.log(`${colors.cyan}Step 1:${colors.reset} Processing HTML files...`);
exec('node scripts/simple-html-processor.js', (error, stdout, stderr) => {
    if (error) {
        console.error(`${colors.yellow}Warning:${colors.reset} HTML processor failed:`, error.message);
    } else {
        console.log(stdout);
    }
    
    // Step 2: Build CSS
    console.log(`\n${colors.cyan}Step 2:${colors.reset} Building CSS...`);
    exec('npm run build', (error, stdout, stderr) => {
        if (error) {
            console.error(`${colors.yellow}Warning:${colors.reset} CSS build failed:`, error.message);
        } else {
            console.log(stdout);
        }
        
        // Step 3: Validate build
        console.log(`\n${colors.cyan}Step 3:${colors.reset} Validating build...`);
        validateBuild();
    });
});

function validateBuild() {
    const requiredFiles = [
        'dist/output.css',
        'index.html',
        'portfolio.html',
        'services.html',
        'contact.html',
        'about.html'
    ];
    
    console.log('\n📋 Build Validation:');
    
    let allGood = true;
    
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            console.log(`  ✅ ${file}`);
        } else {
            console.log(`  ❌ ${file} (missing)`);
            allGood = false;
        }
    });
    
    // Check for data attributes
    console.log('\n🔍 Checking data attributes...');
    checkDataAttributes();
    
    if (allGood) {
        console.log(`\n${colors.green}🎉 Build completed successfully!${colors.reset}`);
    } else {
        console.log(`\n${colors.yellow}⚠️  Build completed with warnings${colors.reset}`);
    }
}

function checkDataAttributes() {
    const htmlFiles = [
        'index.html',
        'portfolio.html',
        'services.html',
        'contact.html',
        'about.html'
    ];
    
    htmlFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const hasDataPage = content.includes('data-page=');
            const hasDataSiteTitle = content.includes('data-site-title');
            const hasDataSiteTagline = content.includes('data-site-tagline');
            const hasAdminEditable = content.includes('admin-editable');
            
            console.log(`  ${file}:`);
            console.log(`    data-page: ${hasDataPage ? '✅' : '❌'}`);
            console.log(`    data-site-title: ${hasDataSiteTitle ? '✅' : '❌'}`);
            console.log(`    data-site-tagline: ${hasDataSiteTagline ? '✅' : '❌'}`);
            console.log(`    admin-editable: ${hasAdminEditable ? '✅' : '❌'}`);
        }
    });
}