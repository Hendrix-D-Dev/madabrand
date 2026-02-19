// /api/portfolio.js
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
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  
  // Also update the portfolio.html page
  updatePortfolioPage(data.projects);
};

// Update the actual portfolio.html page
const updatePortfolioPage = (projects) => {
  const portfolioPath = path.join(process.cwd(), 'portfolio.html');
  let content = fs.readFileSync(portfolioPath, 'utf8');
  
  // Generate HTML for projects
  const projectsHTML = projects.map(project => `
    <div class="portfolio-item animate-on-scroll bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-blue-100 group" data-category="${project.category}">
      <div class="relative h-64 md:h-72 overflow-hidden">
        <img src="${project.images[0]}" alt="${project.title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
        <div class="absolute top-4 left-4">
          <span class="inline-block px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-900 text-xs rounded-full font-semibold">
            ${project.category === 'branding' ? 'Brand Identity' : project.category === 'logo' ? 'Logo Design' : 'Graphic Design'}
          </span>
        </div>
      </div>
      <div class="p-6 md:p-8">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h3 class="text-xl md:text-2xl font-bold mb-2 text-gray-900 group-hover:text-blue-900 transition-colors">
              ${project.title}
            </h3>
            <p class="text-gray-500 text-sm">${project.industry || 'Design'}</p>
          </div>
          <div class="w-12 h-12 bg-blue-900/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-xl">${getCategoryIcon(project.category)}</span>
          </div>
        </div>
        <p class="text-gray-600 mb-6 leading-relaxed">
          ${project.description}
        </p>
        <a href="#${project.id}" class="inline-flex items-center text-blue-900 font-semibold hover:text-blue-700 group-hover:translate-x-2 transition-all duration-300">
          View Project Details
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </a>
      </div>
    </div>
  `).join('');
  
  const getCategoryIcon = (category) => {
    const icons = {
      'branding': '🏗️',
      'logo': '✨',
      'graphic': '🎨'
    };
    return icons[category] || '📁';
  };
  
  // Find the portfolio grid section - look for the grid container
  const gridStart = content.indexOf('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">');
  const gridEnd = content.indexOf('</div>', gridStart) + 6;
  
  if (gridStart !== -1) {
    const beforeGrid = content.substring(0, gridStart);
    const afterGrid = content.substring(gridEnd);
    const newGrid = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">${projectsHTML}</div>`;
    
    content = beforeGrid + newGrid + afterGrid;
    fs.writeFileSync(portfolioPath, content, 'utf8');
    console.log('✅ Portfolio page updated with', projects.length, 'projects');
  } else {
    console.error('❌ Could not find portfolio grid in HTML');
  }
};

// Main API handler
export default async function handler(req, res) {
  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      // Get all projects
      const data = getPortfolioData();
      res.status(200).json(data);
      break;
      
    case 'POST':
      // Add new project - handle both JSON and form data
      if (req.headers['content-type']?.includes('multipart/form-data')) {
        // Handle file upload
        const form = new formidable.IncomingForm();
        form.uploadDir = path.join(process.cwd(), 'temp');
        form.keepExtensions = true;
        
        form.parse(req, async (err, fields, files) => {
          if (err) {
            return res.status(500).json({ error: 'Upload failed' });
          }
          
          try {
            const portfolio = getPortfolioData();
            
            // Process uploaded images
            const imageUrls = [];
            if (files.images) {
              const images = Array.isArray(files.images) ? files.images : [files.images];
              
              for (const image of images) {
                // Optimize image with sharp
                const filename = `project-${Date.now()}-${image.originalFilename}`;
                const outputPath = path.join(process.cwd(), 'assets', 'images', filename);
                
                await sharp(image.filepath)
                  .resize(1200, 800, { fit: 'cover' })
                  .jpeg({ quality: 85 })
                  .toFile(outputPath);
                
                imageUrls.push(`/assets/images/${filename}`);
                
                // Clean up temp file
                fs.unlinkSync(image.filepath);
              }
            }
            
            const newProject = {
              id: Date.now(),
              title: fields.title,
              category: fields.category,
              client: fields.client || '',
              industry: fields.industry || '',
              description: fields.description,
              images: imageUrls,
              featured: fields.featured === 'true',
              dateAdded: new Date().toISOString()
            };
            
            portfolio.projects.push(newProject);
            savePortfolioData(portfolio);
            
            res.status(200).json({ success: true, project: newProject });
          } catch (error) {
            res.status(500).json({ error: error.message });
          }
        });
      } else {
        // Handle JSON data
        try {
          const projectData = req.body;
          const portfolio = getPortfolioData();
          
          const newProject = {
            id: Date.now(),
            ...projectData,
            dateAdded: new Date().toISOString()
          };
          
          portfolio.projects.push(newProject);
          savePortfolioData(portfolio);
          
          res.status(200).json({ success: true, project: newProject });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
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
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'DELETE':
      // Delete project
      try {
        const projectId = req.query.id;
        const portfolio = getPortfolioData();
        portfolio.projects = portfolio.projects.filter(p => p.id != projectId);
        savePortfolioData(portfolio);
        res.status(200).json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}