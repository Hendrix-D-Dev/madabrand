// scripts/seed-data.js
const fs = require('fs-extra');
const path = require('path');

const initialData = {
  "projects": [
    {
      "id": 1,
      "title": "NuelArk Construction",
      "category": "branding",
      "client": "Nuel Ark",
      "industry": "Construction",
      "description": "Complete brand identity system for a premium construction company.",
      "images": ["/assets/images/photo_1_2025-12-10_09-45-08.jpg"],
      "featured": true,
      "date": "2025-02-14",
      "createdAt": "2025-02-14T10:00:00.000Z",
      "updatedAt": "2025-02-14T10:00:00.000Z"
    },
    {
      "id": 2,
      "title": "Havenbridge Development",
      "category": "branding",
      "client": "Haven Bridge",
      "industry": "Real Estate",
      "description": "Premium brand identity for a real-estate development company.",
      "images": ["/assets/images/photo_3_2025-12-10_09-45-08.jpg"],
      "featured": true,
      "date": "2025-02-13",
      "createdAt": "2025-02-13T10:00:00.000Z",
      "updatedAt": "2025-02-13T10:00:00.000Z"
    },
    {
      "id": 3,
      "title": "ADIVAS Eco-Brand",
      "category": "branding",
      "client": "Adi Vas",
      "industry": "Sustainability",
      "description": "Nature-inspired brand identity for sustainable living products.",
      "images": ["/assets/images/photo_5_2025-12-10_09-49-24.jpg"],
      "featured": true,
      "date": "2025-02-12",
      "createdAt": "2025-02-12T10:00:00.000Z",
      "updatedAt": "2025-02-12T10:00:00.000Z"
    },
    {
      "id": 4,
      "title": "Logo Collection",
      "category": "logo",
      "client": "Various",
      "industry": "Design",
      "description": "Collection of custom logo designs for diverse businesses.",
      "images": ["/assets/images/photo_2_2025-12-10_09-45-08.jpg"],
      "featured": false,
      "date": "2025-02-11",
      "createdAt": "2025-02-11T10:00:00.000Z",
      "updatedAt": "2025-02-11T10:00:00.000Z"
    },
    {
      "id": 5,
      "title": "Brand Guidelines",
      "category": "graphic",
      "client": "Multiple Brands",
      "industry": "Design",
      "description": "Comprehensive brand guidelines and style guides.",
      "images": ["/assets/images/photo_4_2025-12-10_09-45-08.jpg"],
      "featured": false,
      "date": "2025-02-10",
      "createdAt": "2025-02-10T10:00:00.000Z",
      "updatedAt": "2025-02-10T10:00:00.000Z"
    },
    {
      "id": 6,
      "title": "Social Media Graphics",
      "category": "graphic",
      "client": "Various",
      "industry": "Digital",
      "description": "Engaging social media visuals and templates.",
      "images": ["/assets/images/photo_6_2025-12-10_09-49-24.jpg"],
      "featured": false,
      "date": "2025-02-09",
      "createdAt": "2025-02-09T10:00:00.000Z",
      "updatedAt": "2025-02-09T10:00:00.000Z"
    },
    {
      "id": 7,
      "title": "Print Design Portfolio",
      "category": "graphic",
      "client": "Various",
      "industry": "Print",
      "description": "Business cards, brochures, and stationery design.",
      "images": ["/assets/images/photo_7_2025-12-10_09-49-24.jpg"],
      "featured": false,
      "date": "2025-02-08",
      "createdAt": "2025-02-08T10:00:00.000Z",
      "updatedAt": "2025-02-08T10:00:00.000Z"
    },
    {
      "id": 8,
      "title": "Web Design Projects",
      "category": "web",
      "client": "Various",
      "industry": "Digital",
      "description": "Modern website designs and UI/UX projects.",
      "images": ["/assets/images/photo_8_2025-12-10_09-49-24.jpg"],
      "featured": false,
      "date": "2025-02-07",
      "createdAt": "2025-02-07T10:00:00.000Z",
      "updatedAt": "2025-02-07T10:00:00.000Z"
    },
    {
      "id": 9,
      "title": "Packaging Design",
      "category": "graphic",
      "client": "Various",
      "industry": "Product",
      "description": "Creative packaging solutions for products.",
      "images": ["/assets/images/photo_9_2025-12-10_09-49-24.jpg"],
      "featured": false,
      "date": "2025-02-06",
      "createdAt": "2025-02-06T10:00:00.000Z",
      "updatedAt": "2025-02-06T10:00:00.000Z"
    },
    {
      "id": 10,
      "title": "Brand Identity",
      "category": "branding",
      "client": "Tech Startup",
      "industry": "Technology",
      "description": "Complete rebrand for a Lagos tech company.",
      "images": ["/assets/images/photo_10_2025-12-10_09-49-24.jpg"],
      "featured": false,
      "date": "2025-02-05",
      "createdAt": "2025-02-05T10:00:00.000Z",
      "updatedAt": "2025-02-05T10:00:00.000Z"
    }
  ]
};

async function seed() {
  const dataDir = path.join(__dirname, '..', 'data');
  const portfolioFile = path.join(dataDir, 'portfolio.json');
  
  // Ensure data directory exists
  await fs.ensureDir(dataDir);
  
  // Write the initial data
  await fs.writeFile(portfolioFile, JSON.stringify(initialData, null, 2));
  console.log('✅ Seeded portfolio.json with initial data');
  
  // Verify the file was written
  const exists = await fs.pathExists(portfolioFile);
  if (exists) {
    const content = await fs.readFile(portfolioFile, 'utf8');
    const data = JSON.parse(content);
    console.log(`📊 Portfolio has ${data.projects.length} projects`);
  }
}

seed().catch(console.error);