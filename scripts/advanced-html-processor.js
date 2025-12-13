const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio'); // You'll need to install: npm install cheerio

// Configuration for smart HTML processing
const HTML_PROCESSOR_CONFIG = {
    // Files to process
    files: [
        'index.html',
        'portfolio.html',
        'services.html',
        'contact.html',
        'about.html'
    ],
    
    // Smart patterns - these will intelligently add data attributes
    smartPatterns: [
        {
            name: 'site-title',
            // Look for h1 elements with specific text or classes
            conditions: [
                { text: 'MadaBrand' },
                { text: 'Our Portfolio' },
                { text: 'Our Services' },
                { text: 'Contact Us' },
                { text: 'About Us' }
            ],
            attribute: 'data-site-title',
            // Value can be static or dynamic
            getValue: ($, element) => $(element).text().trim()
        },
        {
            name: 'site-tagline',
            conditions: [
                { text: 'Premium Design Studio' },
                { text: 'Creating memorable brand identities' },
                { class: 'text-xl.text-gray-600' } // Tailwind classes (simplified)
            ],
            attribute: 'data-site-tagline',
            getValue: ($, element) => $(element).text().trim()
        },
        {
            name: 'section-heading',
            conditions: [
                { selector: 'section h2' }
            ],
            attribute: 'data-section-heading',
            getValue: ($, element) => $(element).text().trim()
        },
        {
            name: 'portfolio-item',
            conditions: [
                { selector: '.portfolio-item h3' }
            ],
            attribute: 'data-portfolio-title',
            getValue: ($, element) => $(element).text().trim()
        }
    ],
    
    // Additional transformations
    transformations: [
        {
            name: 'add-page-attribute',
            apply: ($) => {
                $('body').attr('data-page', $('title').text().split('|')[0].trim() || 'unknown');
            }
        },
        {
            name: 'add-admin-classes',
            apply: ($) => {
                $('section').addClass('admin-editable');
                $('.portfolio-item').addClass('admin-editable');
                $('form').addClass('admin-editable');
            }
        },
        {
            name: 'add-edit-buttons',
            apply: ($) => {
                // This would add actual edit buttons for admin mode
                // For now, just add data attributes
                $('section').each((i, el) => {
                    if (!$(el).attr('id')) {
                        $(el).attr('id', `section-${i + 1}`);
                    }
                });
            }
        }
    ]
};

// Process HTML file with cheerio (proper HTML parsing)
function processHtmlFile(filePath) {
    try {
        console.log(`\n🔍 Processing ${path.basename(filePath)} with HTML parser...`);
        
        // Read the file
        const html = fs.readFileSync(filePath, 'utf8');
        const $ = cheerio.load(html);
        let changesMade = 0;
        
        // Apply smart patterns
        HTML_PROCESSOR_CONFIG.smartPatterns.forEach(pattern => {
            pattern.conditions.forEach(condition => {
                let elements;
                
                if (condition.selector) {
                    elements = $(condition.selector);
                } else if (condition.text) {
                    // Find elements containing specific text
                    elements = $('*').filter(function() {
                        return $(this).text().includes(condition.text);
                    });
                } else if (condition.class) {
                    // Simplified class matching (for Tailwind)
                    const classes = condition.class.split('.');
                    elements = $(classes.map(c => `.${c}`).join(''));
                }
                
                if (elements && elements.length > 0) {
                    elements.each((i, el) => {
                        if (!$(el).attr(pattern.attribute)) {
                            const value = pattern.getValue ? pattern.getValue($, el) : '';
                            $(el).attr(pattern.attribute, value);
                            changesMade++;
                        }
                    });
                }
            });
        });
        
        // Apply transformations
        HTML_PROCESSOR_CONFIG.transformations.forEach(transform => {
            transform.apply($);
            changesMade++;
        });
        
        // Save if changes were made
        if (changesMade > 0) {
            const updatedHtml = $.html();
            fs.writeFileSync(filePath, updatedHtml, 'utf8');
            console.log(`✅ Updated ${filePath} with ${changesMade} changes`);
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

// Batch processor
function batchProcessFiles() {
    console.log('🚀 Starting batch HTML processing...\n');
    
    let totalChanges = 0;
    let filesUpdated = 0;
    
    // Process all configured files
    HTML_PROCESSOR_CONFIG.files.forEach(fileName => {
        let filePath = path.join(__dirname, '..', fileName);
        
        if (!fs.existsSync(filePath)) {
            // Check in pages directory
            filePath = path.join(__dirname, '..', 'pages', fileName);
        }
        
        if (fs.existsSync(filePath)) {
            if (processHtmlFile(filePath)) {
                filesUpdated++;
                totalChanges++;
            }
        } else {
            console.log(`⚠️  File not found: ${fileName}`);
        }
    });
    
    console.log(`\n🎉 Complete! Updated ${filesUpdated} files with ${totalChanges} total changes.`);
    return { filesUpdated, totalChanges };
}

// Export for use
module.exports = {
    processHtmlFile,
    batchProcessFiles,
    HTML_PROCESSOR_CONFIG
};

// Run if called directly
if (require.main === module) {
    // Check if cheerio is installed
    try {
        require('cheerio');
        batchProcessFiles();
    } catch (error) {
        console.error('❌ Cheerio not installed. Please run: npm install cheerio');
        console.log('📦 Alternatively, use the simple processor without cheerio.');
    }
}