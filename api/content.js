// /api/content.js
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: true,
  },
};

// Helper to read content data
const getContentData = () => {
  const filePath = path.join(process.cwd(), 'data', 'content.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      home: {},
      about: {},
      services: {},
      global: {}
    };
  }
};

// Helper to save content data
const saveContentData = (data) => {
  const filePath = path.join(process.cwd(), 'data', 'content.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

// Update specific HTML pages with new content
const updateHtmlPages = (content) => {
  const pages = ['index.html', 'about.html', 'services.html', 'contact.html'];
  
  pages.forEach(page => {
    const pagePath = path.join(process.cwd(), page);
    if (!fs.existsSync(pagePath)) return;
    
    let html = fs.readFileSync(pagePath, 'utf8');
    
    // Update meta tags
    if (content.global?.siteTitle) {
      html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${content.global.siteTitle}</title>`
      );
    }
    
    if (content.global?.metaDescription) {
      html = html.replace(
        /<meta name="description" content=".*?"/,
        `<meta name="description" content="${content.global.metaDescription}"`
      );
    }
    
    // Update contact info on all pages
    if (content.global?.email) {
      html = html.replace(
        /href="mailto:[^"]*"/g,
        `href="mailto:${content.global.email}"`
      );
    }
    
    if (content.global?.phone) {
      html = html.replace(
        /href="tel:[^"]*"/g,
        `href="tel:${content.global.phone}"`
      );
      html = html.replace(
        /tel:\+?\d+/g,
        `tel:${content.global.phone}`
      );
    }
    
    // Update WhatsApp links
    if (content.global?.whatsapp) {
      html = html.replace(
        /https:\/\/wa\.me\/\d+/g,
        `https://wa.me/${content.global.whatsapp}`
      );
    }
    
    fs.writeFileSync(pagePath, html, 'utf8');
  });
  
  // Update services page specifically
  if (content.services?.services) {
    const servicesPath = path.join(process.cwd(), 'services.html');
    let servicesHtml = fs.readFileSync(servicesPath, 'utf8');
    
    // Generate service cards HTML
    const servicesHTML = content.services.services.map(service => `
      <div class="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-blue-100 group">
        <div class="w-16 h-16 bg-gradient-to-br from-blue-900/10 to-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <span class="text-3xl text-blue-900">${service.icon}</span>
        </div>
        <h3 class="text-xl md:text-2xl font-bold mb-4 text-gray-900">${service.title}</h3>
        <p class="text-gray-600 mb-6 leading-relaxed">${service.description}</p>
        <a href="/contact" class="inline-flex items-center text-blue-900 font-semibold group-hover:text-blue-800">
          Learn More
          <svg class="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
      </div>
    `).join('');
    
    // Replace the services grid
    const gridRegex = /<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">.*?<\/div>\s*<\/div>/s;
    const newGrid = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">${servicesHTML}</div>`;
    
    servicesHtml = servicesHtml.replace(gridRegex, newGrid);
    fs.writeFileSync(servicesPath, servicesHtml, 'utf8');
  }
};

export default async function handler(req, res) {
  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      // Get content
      const content = getContentData();
      res.status(200).json(content);
      break;
      
    case 'POST':
      // Update content
      try {
        const newContent = req.body;
        saveContentData(newContent);
        updateHtmlPages(newContent);
        
        // Trigger rebuild
        await fetch(`${process.env.VERCEL_URL}/api/rebuild`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer MADA2024' }
        });
        
        res.status(200).json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'PUT':
      // Update specific section
      const { page, section, data } = req.body;
      const currentContent = getContentData();
      
      if (!currentContent[page]) currentContent[page] = {};
      currentContent[page][section] = data;
      
      saveContentData(currentContent);
      updateHtmlPages(currentContent);
      
      res.status(200).json({ success: true });
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}