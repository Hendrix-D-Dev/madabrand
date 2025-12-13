const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

console.log('👀 Watching HTML files for changes...');

// Files to watch
const htmlFiles = [
    'index.html',
    'portfolio.html', 
    'services.html',
    'contact.html',
    'about.html'
];

// Watch function
function watchHtmlFiles() {
    htmlFiles.forEach(file => {
        const filePath = path.join(__dirname, '..', file);
        
        if (fs.existsSync(filePath)) {
            fs.watch(filePath, (eventType, filename) => {
                if (eventType === 'change') {
                    console.log(`📄 ${filename} changed, processing...`);
                    // Run the simple HTML processor
                    exec('node scripts/simple-html-processor.js', (error, stdout) => {
                        if (error) {
                            console.error('Error:', error.message);
                        } else {
                            console.log(stdout);
                        }
                    });
                }
            });
            console.log(`✅ Watching: ${file}`);
        } else {
            // Check pages directory
            const pagesPath = path.join(__dirname, '..', 'pages', file);
            if (fs.existsSync(pagesPath)) {
                fs.watch(pagesPath, (eventType, filename) => {
                    if (eventType === 'change') {
                        console.log(`📄 ${filename} changed, processing...`);
                        exec('node scripts/simple-html-processor.js');
                    }
                });
                console.log(`✅ Watching: pages/${file}`);
            }
        }
    });
}

// Initial processing
exec('node scripts/simple-html-processor.js', (error, stdout) => {
    if (error) {
        console.error('Initial processing error:', error.message);
    } else {
        console.log(stdout);
    }
    watchHtmlFiles();
});

// Keep running
console.log('Press Ctrl+C to stop watching...');
process.on('SIGINT', () => {
    console.log('\n👋 Stopped watching HTML files');
    process.exit();
});