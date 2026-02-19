// /scripts/portfolio-loader.js
// This script loads portfolio data from the API and renders it dynamically

async function loadPortfolioProjects() {
  try {
    // Try to fetch from API first
    const response = await fetch('/api/portfolio');
    const data = await response.json();
    const projects = data.projects || [];
    
    if (projects.length > 0) {
      renderPortfolioGrid(projects);
      updateStats(projects);
    } else {
      // Fallback to hardcoded data if API returns empty
      loadFallbackProjects();
    }
  } catch (error) {
    console.error('Error loading portfolio from API:', error);
    loadFallbackProjects();
  }
}

function renderPortfolioGrid(projects) {
  const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
  if (!grid) return;
  
  const projectsHTML = projects.map(project => `
    <div class="portfolio-item animate-on-scroll bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-blue-100 group" data-category="${project.category}">
      <div class="relative h-64 md:h-72 overflow-hidden">
        <img src="${project.images?.[0] || '/assets/images/placeholder.jpg'}" 
             alt="${project.title}" 
             class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
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
  
  grid.innerHTML = projectsHTML;
  
  // Reinitialize filters
  initPortfolioFilter();
}

function getCategoryIcon(category) {
  const icons = {
    'branding': '🏗️',
    'logo': '✨',
    'graphic': '🎨'
  };
  return icons[category] || '📁';
}

function updateStats(projects) {
  const statsContainer = document.querySelector('.flex.flex-wrap.justify-center.gap-6');
  if (!statsContainer) return;
  
  const totalProjects = projects.length;
  const categories = new Set(projects.map(p => p.category)).size;
  const featured = projects.filter(p => p.featured).length;
  
  statsContainer.innerHTML = `
    <div class="text-center">
      <div class="text-3xl font-bold text-blue-900 mb-1">${totalProjects}+</div>
      <div class="text-gray-600 text-sm">Premium Projects</div>
    </div>
    <div class="text-center">
      <div class="text-3xl font-bold text-blue-900 mb-1">${featured}+</div>
      <div class="text-gray-600 text-sm">Featured Projects</div>
    </div>
    <div class="text-center">
      <div class="text-3xl font-bold text-blue-900 mb-1">${categories}</div>
      <div class="text-gray-600 text-sm">Categories</div>
    </div>
    <div class="text-center">
      <div class="text-3xl font-bold text-blue-900 mb-1">3+</div>
      <div class="text-gray-600 text-sm">Years Excellence</div>
    </div>
  `;
}

function initPortfolioFilter() {
  const filterButtons = document.querySelectorAll('.portfolio-filter');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  
  if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active styles from all buttons
        filterButtons.forEach(btn => {
          btn.classList.remove('bg-gradient-to-r', 'from-blue-900', 'to-blue-800', 'text-white', 'hover:from-blue-800', 'hover:to-blue-700');
          btn.classList.add('bg-white', 'text-blue-900', 'border', 'border-blue-200', 'hover:bg-blue-50');
        });
        
        // Add active styles to clicked button
        this.classList.remove('bg-white', 'text-blue-900', 'border', 'border-blue-200', 'hover:bg-blue-50');
        this.classList.add('bg-gradient-to-r', 'from-blue-900', 'to-blue-800', 'text-white', 'hover:from-blue-800', 'hover:to-blue-700');
        
        const filterValue = this.getAttribute('data-filter');
        
        // Filter portfolio items
        portfolioItems.forEach(item => {
          if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
            item.classList.remove('hidden');
            item.classList.add('animate-fade-in');
          } else {
            item.classList.add('hidden');
          }
        });
      });
    });
  }
}

function loadFallbackProjects() {
  // Hardcoded fallback data
  const fallbackProjects = [
    {
      id: 1,
      title: "NuelArk Construction",
      category: "branding",
      industry: "Construction",
      description: "Complete brand identity system for a premium construction company.",
      images: ["/assets/images/photo_1_2025-12-10_09-45-08.jpg"]
    },
    {
      id: 2,
      title: "Havenbridge Development",
      category: "branding",
      industry: "Real Estate",
      description: "Premium brand identity for a real-estate development company.",
      images: ["/assets/images/photo_3_2025-12-10_09-45-08.jpg"]
    },
    {
      id: 3,
      title: "ADIVAS Eco-Brand",
      category: "branding",
      industry: "Sustainability",
      description: "Nature-inspired brand identity for sustainable living products.",
      images: ["/assets/images/photo_5_2025-12-10_09-49-24.jpg"]
    }
  ];
  
  renderPortfolioGrid(fallbackProjects);
}

// Load projects when page loads
document.addEventListener('DOMContentLoaded', loadPortfolioProjects);