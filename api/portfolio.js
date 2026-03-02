// /api/portfolio.js - FIXED VERSION with robust HTML replacement
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to read portfolio data
const getPortfolioData = () => {
  const filePath = path.join(process.cwd(), 'data', 'portfolio.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { projects: [] };
  }
};

// Helper function to save portfolio data
const savePortfolioData = (data) => {
  const filePath = path.join(process.cwd(), 'data', 'portfolio.json');
  const dirPath = path.dirname(filePath);
  
  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Portfolio data saved to JSON');
  
  // Also update the portfolio.html page
  updatePortfolioPage(data.projects);
  
  // Trigger rebuild
  triggerRebuild();
};

// Function to trigger rebuild
const triggerRebuild = async () => {
  try {
    // Call the rebuild endpoint
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    await fetch(`${baseUrl}/api/rebuild`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer MADA2024',
        'Content-Type': 'application/json'
      }
    });
    console.log('🔄 Rebuild triggered');
  } catch (error) {
    console.error('Failed to trigger rebuild:', error);
  }
};

// Get category icon
const getCategoryIcon = (category) => {
  const icons = {
    'branding': '🏗️',
    'logo': '✨',
    'graphic': '🎨',
    'brand-identity': '🏗️'
  };
  return icons[category] || '📁';
};

// Get category display name
const getCategoryDisplay = (category) => {
  const displays = {
    'branding': 'Brand Identity',
    'brand-identity': 'Brand Identity',
    'logo': 'Logo Design',
    'graphic': 'Graphic Design'
  };
  return displays[category] || 'Design';
};

// Update the actual portfolio.html page
const updatePortfolioPage = (projects) => {
  const portfolioPath = path.join(process.cwd(), 'portfolio.html');
  
  if (!fs.existsSync(portfolioPath)) {
    console.error('❌ portfolio.html not found at:', portfolioPath);
    return;
  }
  
  let content = fs.readFileSync(portfolioPath, 'utf8');
  
  // Generate HTML for projects
  const projectsHTML = projects.map(project => `
    <div class="portfolio-item animate-on-scroll bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-blue-100 group" data-category="${project.category || 'branding'}">
      <div class="relative h-64 md:h-72 overflow-hidden">
        <img src="${project.images && project.images[0] ? project.images[0] : '/assets/images/placeholder.jpg'}" 
             alt="${project.title || 'Project'}" 
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
             onerror="this.src='/assets/images/placeholder.jpg'">
        <div class="absolute top-4 left-4">
          <span class="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-900 text-xs rounded-full font-semibold">
            ${getCategoryDisplay(project.category)}
          </span>
        </div>
      </div>
      <div class="p-6 md:p-8">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-xl md:text-2xl font-bold mb-2 text-gray-900 group-hover:text-blue-900 transition-colors">
              ${project.title || 'Untitled Project'}
            </h3>
            <p class="text-gray-500 text-sm">${project.industry || project.client || 'Design'}</p>
          </div>
          <div class="w-12 h-12 bg-blue-900/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-xl">${getCategoryIcon(project.category)}</span>
          </div>
        </div>
        <p class="text-gray-600 mb-6 leading-relaxed line-clamp-3">
          ${project.description || 'No description provided.'}
        </p>
        <a href="/portfolio/${project.id || '#'}" class="inline-flex items-center text-blue-900 font-semibold hover:text-blue-700 group-hover:translate-x-2 transition-all duration-300">
          View Project Details
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
      </div>
    </div>
  `).join('');
  
  // Multiple replacement strategies for robustness
  
  // Strategy 1: Look for projects container with specific class
  let updated = false;
  
  // Try to find the grid container by various possible class patterns
  const gridPatterns = [
    /<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">[\s\S]*?<\/div>\s*(?=<\/div>\s*<!--|\s*$)/,
    /<div class="projects-grid[\s\S]*?<\/div>/,
    /<div id="portfolio-grid[\s\S]*?<\/div>/,
    /<div class="grid[\s\S]*?gap-6[\s\S]*?<\/div>\s*(?=<\/div>|$)/
  ];
  
  for (const pattern of gridPatterns) {
    const match = content.match(pattern);
    if (match) {
      const newGrid = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">${projectsHTML}</div>`;
      content = content.replace(pattern, newGrid);
      updated = true;
      console.log('✅ Portfolio grid updated using pattern match');
      break;
    }
  }
  
  // Strategy 2: If no pattern matched, try to find by container ID or data attribute
  if (!updated) {
    const containerStart = content.indexOf('id="portfolio-container"') || 
                          content.indexOf('class="portfolio-grid"') ||
                          content.indexOf('data-portfolio-grid');
    
    if (containerStart !== -1) {
      // Find the opening tag and its closing tag
      const openingTag = content.substring(0, containerStart).lastIndexOf('<div');
      if (openingTag !== -1) {
        const openingTagEnd = content.indexOf('>', openingTag) + 1;
        let depth = 1;
        let pos = openingTagEnd;
        
        while (depth > 0 && pos < content.length) {
          if (content.substr(pos, 4) === '<div') depth++;
          if (content.substr(pos, 5) === '</div') depth--;
          pos++;
        }
        
        const beforeGrid = content.substring(0, openingTag);
        const afterGrid = content.substring(pos);
        const newGrid = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" id="portfolio-container">${projectsHTML}</div>`;
        
        content = beforeGrid + newGrid + afterGrid;
        updated = true;
        console.log('✅ Portfolio grid updated using container search');
      }
    }
  }
  
  // Strategy 3: Last resort - replace everything between body and footer
  if (!updated) {
    console.warn('⚠️ Could not find portfolio grid, using fallback replacement');
    
    // Find a safe insertion point (before footer)
    const footerIndex = content.indexOf('<!-- Footer -->') || content.indexOf('<footer') || content.indexOf('id="footer"');
    
    if (footerIndex !== -1) {
      const beforeFooter = content.substring(0, footerIndex);
      const afterFooter = content.substring(footerIndex);
      
      // Look for the last div before footer that might be the container
      const lastDivIndex = beforeFooter.lastIndexOf('<div class="grid');
      if (lastDivIndex !== -1) {
        const beforeDiv = beforeFooter.substring(0, lastDivIndex);
        const afterDiv = beforeFooter.substring(beforeFooter.indexOf('</div>', lastDivIndex) + 6);
        content = beforeDiv + `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">${projectsHTML}</div>` + afterDiv + afterFooter;
        updated = true;
      }
    }
  }
  
  if (updated) {
    // Write the updated content
    fs.writeFileSync(portfolioPath, content, 'utf8');
    console.log(`✅ Portfolio page updated with ${projects.length} projects at ${new Date().toISOString()}`);
    
    // Also update a timestamp file to verify updates
    const timestampPath = path.join(process.cwd(), 'data', 'last-update.txt');
    fs.writeFileSync(timestampPath, new Date().toISOString());
  } else {
    console.error('❌ Could not update portfolio.html - no matching pattern found');
    // Log first 500 chars of file for debugging
    console.log('File preview:', content.substring(0, 500));
  }
};

// Main API handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      // Get all projects
      try {
        const data = getPortfolioData();
        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'POST':
      // Add new project - handle both JSON and form data
      try {
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('multipart/form-data')) {
          // Handle file upload
          const form = new formidable.IncomingForm();
          form.uploadDir = path.join(process.cwd(), 'temp');
          form.keepExtensions = true;
          
          // Ensure temp directory exists
          if (!fs.existsSync(form.uploadDir)) {
            fs.mkdirSync(form.uploadDir, { recursive: true });
          }
          
          form.parse(req, async (err, fields, files) => {
            if (err) {
              console.error('Form parse error:', err);
              return res.status(500).json({ error: 'Upload failed: ' + err.message });
            }
            
            try {
              const portfolio = getPortfolioData();
              
              // Process uploaded images
              const imageUrls = [];
              if (files.images) {
                const images = Array.isArray(files.images) ? files.images : [files.images];
                
                // Ensure images directory exists
                const imagesDir = path.join(process.cwd(), 'assets', 'images');
                if (!fs.existsSync(imagesDir)) {
                  fs.mkdirSync(imagesDir, { recursive: true });
                }
                
                for (const image of images) {
                  // Generate unique filename
                  const timestamp = Date.now();
                  const ext = path.extname(image.originalFilename || '.jpg');
                  const filename = `project-${timestamp}${ext}`;
                  const outputPath = path.join(imagesDir, filename);
                  
                  try {
                    // Optimize image with sharp
                    await sharp(image.filepath)
                      .resize(1200, 800, { fit: 'cover', withoutEnlargement: true })
                      .jpeg({ quality: 85, progressive: true })
                      .toFile(outputPath);
                    
                    imageUrls.push(`/assets/images/${filename}`);
                    
                    // Clean up temp file
                    if (fs.existsSync(image.filepath)) {
                      fs.unlinkSync(image.filepath);
                    }
                  } catch (sharpError) {
                    console.error('Sharp processing error:', sharpError);
                    // Fallback: just copy the file
                    fs.copyFileSync(image.filepath, outputPath);
                    imageUrls.push(`/assets/images/${filename}`);
                  }
                }
              }
              
              const newProject = {
                id: Date.now(),
                title: fields.title || 'Untitled Project',
                category: fields.category || 'branding',
                client: fields.client || '',
                industry: fields.industry || '',
                description: fields.description || '',
                images: imageUrls,
                featured: fields.featured === 'true',
                dateAdded: new Date().toISOString()
              };
              
              portfolio.projects = portfolio.projects || [];
              portfolio.projects.push(newProject);
              savePortfolioData(portfolio);
              
              res.status(200).json({ success: true, project: newProject });
            } catch (error) {
              console.error('Project creation error:', error);
              res.status(500).json({ error: error.message });
            }
          });
        } else {
          // Handle JSON data
          const projectData = req.body;
          const portfolio = getPortfolioData();
          
          const newProject = {
            id: Date.now(),
            ...projectData,
            images: projectData.images || ['/assets/images/placeholder.jpg'],
            dateAdded: new Date().toISOString()
          };
          
          portfolio.projects = portfolio.projects || [];
          portfolio.projects.push(newProject);
          savePortfolioData(portfolio);
          
          res.status(200).json({ success: true, project: newProject });
        }
      } catch (error) {
        console.error('POST error:', error);
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'PUT':
      // Update project
      try {
        const updates = req.body;
        const { id } = updates;
        const portfolio = getPortfolioData();
        const index = portfolio.projects.findIndex(p => p.id == id);
        
        if (index !== -1) {
          portfolio.projects[index] = { ...portfolio.projects[index], ...updates };
          savePortfolioData(portfolio);
          res.status(200).json({ success: true });
        } else {
          res.status(404).json({ error: 'Project not found' });
        }
      } catch (error) {
        console.error('PUT error:', error);
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'DELETE':
      // Delete project
      try {
        const projectId = req.query.id;
        if (!projectId) {
          return res.status(400).json({ error: 'Project ID required' });
        }
        
        const portfolio = getPortfolioData();
        portfolio.projects = portfolio.projects.filter(p => p.id != projectId);
        savePortfolioData(portfolio);
        
        res.status(200).json({ success: true });
      } catch (error) {
        console.error('DELETE error:', error);
        res.status(500).json({ error: error.message });
      }
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}