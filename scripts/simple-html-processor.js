const fs = require('fs');
const path = require('path');

// Simple regex-based HTML processor (no dependencies)
function simpleHtmlProcessor() {
    console.log('🔧 Simple HTML Processor (No Dependencies)\n');
    
    // Files to process
    const files = [
        'index.html',
        'portfolio.html',
        'services.html',
        'contact.html',
        'about.html'
    ];
    
    let filesProcessed = 0;
    
    files.forEach(fileName => {
        let filePath = path.join(__dirname, '..', fileName);
        
        if (!fs.existsSync(filePath)) {
            filePath = path.join(__dirname, '..', 'pages', fileName);
        }
        
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️  Skipping: ${fileName} (not found)`);
            return;
        }
        
        console.log(`📄 Processing: ${fileName}`);
        
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        let changes = 0;
        
        // Pattern 1: Add data-page attribute to body
        if (!content.includes('data-page=') && content.includes('<body')) {
            const pageName = fileName.replace('.html', '');
            content = content.replace(
                /<body([^>]*)>/i,
                `<body$1 data-page="${pageName}">`
            );
            changes++;
        }
        
        // Pattern 2: Add data-site-title to h1 containing MadaBrand
        if (content.includes('MadaBrand') && content.includes('<h1')) {
            const h1Regex = /<h1([^>]*)>([^<]*MadaBrand[^<]*)<\/h1>/gi;
            content = content.replace(h1Regex, (match, attrs, text) => {
                if (!attrs.includes('data-site-title')) {
                    const newAttrs = attrs.includes('class=') ? 
                        attrs.replace('class="', 'class="' + (attrs.includes('data-site-title') ? '' : 'data-site-title ')) :
                        `${attrs} data-site-title="${text.trim().replace(/"/g, '&quot;')}"`;
                    return `<h1${newAttrs}>${text}</h1>`;
                }
                return match;
            });
            if (content !== originalContent) changes++;
        }
        
        // Pattern 3: Add data-site-tagline to paragraphs with specific text
        const taglineTexts = [
            'Premium Design Studio',
            'Creating memorable brand identities',
            'Showcasing our best work',
            'Comprehensive design solutions',
            'Get in touch with MadaBrand'
        ];
        
        taglineTexts.forEach(tagline => {
            if (content.includes(tagline) && content.includes('<p')) {
                const pRegex = new RegExp(`<p([^>]*)>([^<]*${tagline.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*)</p>`, 'gi');
                content = content.replace(pRegex, (match, attrs, text) => {
                    if (!attrs.includes('data-site-tagline')) {
                        const newAttrs = attrs.includes('class=') ? 
                            attrs.replace('class="', 'class="' + (attrs.includes('data-site-tagline') ? '' : 'data-site-tagline ')) :
                            `${attrs} data-site-tagline="${text.trim().replace(/"/g, '&quot;')}"`;
                        return `<p${newAttrs}>${text}</p>`;
                    }
                    return match;
                });
            }
        });
        
        // Pattern 4: Add admin-editable class to sections
        if (content.includes('<section')) {
            const sectionRegex = /<section([^>]*)>/gi;
            content = content.replace(sectionRegex, (match, attrs) => {
                if (!attrs.includes('admin-editable') && !attrs.includes('class="admin-editable')) {
                    if (attrs.includes('class="')) {
                        return `<section${attrs.replace('class="', 'class="admin-editable ')}>`;
                    } else {
                        return `<section${attrs} class="admin-editable">`;
                    }
                }
                return match;
            });
            if (content !== originalContent) changes++;
        }
        
        // Pattern 5: Add data-portfolio-item to portfolio items
        if (fileName === 'portfolio.html' && content.includes('portfolio-item')) {
            const portfolioItemRegex = /<div([^>]*?)class="([^"]*portfolio-item[^"]*)"([^>]*)>/gi;
            content = content.replace(portfolioItemRegex, (match, beforeClass, classes, afterClass) => {
                if (!match.includes('data-portfolio-item')) {
                    return `<div${beforeClass}class="${classes}"${afterClass} data-portfolio-item="">`;
                }
                return match;
            });
            if (content !== originalContent) changes++;
        }
        
        // Save if changes were made
        if (changes > 0) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  ✅ Added ${changes} data attributes`);
            filesProcessed++;
        } else {
            console.log(`  ⏭️  No changes needed`);
        }
    });
    
    console.log(`\n🎉 Processed ${filesProcessed} files`);
    return filesProcessed;
}

// Run the processor
if (require.main === module) {
    simpleHtmlProcessor();
}

module.exports = { simpleHtmlProcessor };