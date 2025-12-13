const fs = require('fs');
const path = require('path');

// Configuration for data attributes to add
const DATA_ATTRIBUTES_CONFIG = {
    // Files to process
    files: [
        'index.html',
        'portfolio.html', 
        'services.html',
        'contact.html',
        'about.html'
    ],
    
    // Patterns to match and their data attributes
    patterns: [
        {
            // Site title patterns (h1 elements containing "MadaBrand")
            selector: 'h1',
            content: 'MadaBrand',
            attribute: 'data-site-title'
        },
        {
            // Site tagline patterns (p elements containing "Premium Design Studio")
            selector: 'p',
            content: 'Premium Design Studio',
            attribute: 'data-site-tagline'
        },
        {
            // Portfolio stats - project count
            selector: 'p.text-3xl',
            content: '6',
            attribute: 'data-stats-projects',
            context: 'Projects Completed'
        },
        {
            // Portfolio stats - happy clients
            selector: 'p.text-3xl',
            content: '12+',
            attribute: 'data-stats-clients',
            context: 'Happy Clients'
        }
    ]
};

// Helper function to add data attribute to HTML element
function addDataAttribute(html, selector, content, attribute, context = null) {
    // Create a regex pattern to find the element
    // This is a simplified approach - for production, use a proper HTML parser
    const lines = html.split('\n');
    let inTargetElement = false;
    let elementDepth = 0;
    let currentElement = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Check if this line contains our selector and content
        if (line.includes(`<${selector}`) && line.includes(content)) {
            // Also check context if provided
            if (!context || lines.slice(i, i + 3).some(l => l.includes(context))) {
                // Check if the element already has the attribute
                if (!line.includes(`${attribute}=`)) {
                    // Add the data attribute
                    const attributeInsertionPoint = line.lastIndexOf('>') > -1 ? 
                        line.lastIndexOf('>') : line.length;
                    const beforeAttribute = line.substring(0, attributeInsertionPoint);
                    const afterAttribute = line.substring(attributeInsertionPoint);
                    
                    // Add attribute with proper spacing
                    const newLine = beforeAttribute.trim().endsWith('"') || 
                                   beforeAttribute.trim().endsWith("'") ?
                        `${beforeAttribute} ${attribute}` :
                        `${beforeAttribute} ${attribute}="${content.replace(/"/g, '&quot;')}"`;
                    
                    lines[i] = newLine + afterAttribute;
                    console.log(`✓ Added ${attribute} to line ${i + 1}`);
                }
            }
        }
    }
    
    return lines.join('\n');
}

// Process a single HTML file
function processFile(filePath) {
    try {
        console.log(`\n📄 Processing ${path.basename(filePath)}...`);
        
        // Read the file
        let html = fs.readFileSync(filePath, 'utf8');
        let originalHtml = html;
        let changesMade = 0;
        
        // Apply all patterns
        DATA_ATTRIBUTES_CONFIG.patterns.forEach(pattern => {
            const beforeLength = html.length;
            html = addDataAttribute(html, pattern.selector, pattern.content, pattern.attribute, pattern.context);
            if (html.length !== beforeLength) {
                changesMade++;
            }
        });
        
        // Also add attributes to common elements
        // Add data-page attribute to body
        if (!html.includes('data-page=')) {
            const pageName = path.basename(filePath, '.html');
            html = html.replace('<body', `<body data-page="${pageName}"`);
            changesMade++;
        }
        
        // Add admin-edit class to sections for admin editing
        if (html.includes('<section') && !html.includes('admin-editable')) {
            html = html.replace(/<section/g, '<section class="admin-editable"');
            changesMade += (html.match(/<section/g) || []).length;
        }
        
        // Save if changes were made
        if (changesMade > 0) {
            fs.writeFileSync(filePath, html, 'utf8');
            console.log(`✅ Updated ${filePath} with ${changesMade} data attributes`);
            return true;
        } else {
            console.log(`⏭️  No changes needed for ${filePath}`);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main function
function main() {
    console.log('🚀 Starting data attributes update...\n');
    
    let totalChanges = 0;
    let filesUpdated = 0;
    
    // Process all configured files
    DATA_ATTRIBUTES_CONFIG.files.forEach(fileName => {
        const filePath = path.join(__dirname, '..', fileName);
        
        if (fs.existsSync(filePath)) {
            if (processFile(filePath)) {
                filesUpdated++;
                totalChanges++;
            }
        } else {
            // Also check in pages directory
            const pagesPath = path.join(__dirname, '..', 'pages', fileName);
            if (fs.existsSync(pagesPath)) {
                if (processFile(pagesPath)) {
                    filesUpdated++;
                    totalChanges++;
                }
            } else {
                console.log(`⚠️  File not found: ${fileName}`);
            }
        }
    });
    
    console.log(`\n🎉 Complete! Updated ${filesUpdated} files with data attributes.`);
    return totalChanges;
}

// Run if called directly
if (require.main === module) {
    main();
}

// Export for use in other scripts
module.exports = {
    processFile,
    main,
    DATA_ATTRIBUTES_CONFIG
};