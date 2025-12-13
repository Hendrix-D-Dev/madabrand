// Template for consistent HTML structure
const HTML_TEMPLATE = {
    head: (title, description) => `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | MadaBrand</title>
    <link href="/dist/output.css" rel="stylesheet">
    <link rel="icon" type="image/x-icon" href="/assets/icons/favicon.ico">
    <meta name="description" content="${description}">
    <meta name="keywords" content="brand design, logo design, graphic design, brand identity, visual identity">
    <meta name="author" content="MadaBrand">
    <meta property="og:title" content="${title} | MadaBrand">
    <meta property="og:description" content="${description}">
    <meta property="og:type" content="website">
    `,
    
    body: (content) => `
    <body class="font-body bg-white text-gray-800" data-page="{{PAGE_NAME}}">
        <!-- Navigation -->
        <div id="navbar"></div>
        
        ${content}
        
        <!-- Footer -->
        <div id="footer"></div>
        
        <!-- Admin Panel -->
        <div id="admin-panel" class="hidden fixed bottom-4 right-4 bg-white shadow-2xl rounded-2xl p-6 w-80 z-50 border border-blue-200">
            <!-- Admin panel content will be injected by main.js -->
        </div>
        
        <!-- Scripts -->
        <script src="/scripts/main.js"></script>
    </body>
    `,
    
    heroSection: (title, subtitle) => `
    <section class="pt-32 pb-20 bg-gradient-to-r from-blue-50 to-white">
        <div class="container mx-auto px-4">
            <div class="max-w-4xl mx-auto text-center">
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in text-blue-900" data-site-title>
                    ${title}
                </h1>
                <p class="text-xl text-gray-600 mb-8" data-site-tagline>
                    ${subtitle}
                </p>
            </div>
        </div>
    </section>
    `
};

// Function to generate page with consistent structure
function generatePage(title, description, heroTitle, heroSubtitle, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    ${HTML_TEMPLATE.head(title, description)}
</head>
${HTML_TEMPLATE.body(HTML_TEMPLATE.heroSection(heroTitle, heroSubtitle) + content)}
</html>`;
}

module.exports = {
    HTML_TEMPLATE,
    generatePage
};