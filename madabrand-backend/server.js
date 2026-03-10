// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://madabrand-e6hw.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Ensure all required directories exist and are writable
const dirs = [
  'data',
  'uploads',
  'uploads/images',
  'uploads/temp',
  'backups',
  'assets',
  'assets/images'
];

console.log('📁 Checking directories...');
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  try {
    fs.ensureDirSync(dirPath);
    console.log(`✅ Directory ensured: ${dir}`);
    
    // Test write permissions
    const testFile = path.join(dirPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.removeSync(testFile);
    console.log(`   ✅ Writable: ${dir}`);
  } catch (error) {
    console.error(`❌ Directory error (${dir}):`, error.message);
  }
});

// Initialize data files with proper error handling - NEVER overwrite existing data
const initDataFiles = async () => {
  console.log('📄 Initializing data files...');
  
  // Default empty data for other files
  const defaultData = {
    'data/content.json': { home: {}, about: {}, services: {}, global: {} },
    'data/media.json': [],
    'data/settings.json': {
      admin: { passcode: 'MADA2024' },
      site: { 
        title: 'MadaBrand',
        tagline: 'Premium Design Studio',
        description: 'Premium design services in Lagos, Nigeria'
      },
      theme: { primaryColor: '#1e3a8a' },
      integrations: { whatsapp: '2348104902357' }
    }
  };

  // Handle portfolio.json separately - ONLY create if it doesn't exist
  const portfolioPath = path.join(__dirname, 'data', 'portfolio.json');
  
  try {
    if (!await fs.pathExists(portfolioPath)) {
      // Check if we have a seed file to use
      const seedFile = path.join(__dirname, 'data', 'portfolio.seed.json');
      let initialData = { projects: [] };
      
      try {
        if (await fs.pathExists(seedFile)) {
          initialData = await fs.readJson(seedFile);
          console.log(`✅ Found seed file with ${initialData.projects?.length || 0} projects`);
        }
      } catch (error) {
        console.log('ℹ️ No seed file found, using empty portfolio');
      }
      
      await fs.writeJson(portfolioPath, initialData, { spaces: 2 });
      console.log(`✅ Created: data/portfolio.json with ${initialData.projects?.length || 0} projects`);
    } else {
      // File exists - read it to verify and show count
      const existingData = await fs.readJson(portfolioPath);
      console.log(`📄 Found existing: data/portfolio.json with ${existingData.projects?.length || 0} projects`);
    }
  } catch (error) {
    console.error(`❌ Error with data/portfolio.json:`, error.message);
  }

  // Handle other files - create if they don't exist
  for (const [filePath, defaultContent] of Object.entries(defaultData)) {
    const fullPath = path.join(__dirname, filePath);
    try {
      if (!await fs.pathExists(fullPath)) {
        await fs.writeJson(fullPath, defaultContent, { spaces: 2 });
        console.log(`✅ Created: ${filePath}`);
      } else {
        console.log(`📄 Found existing: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${filePath}:`, error.message);
    }
  }
};

// Run initialization with error handling
initDataFiles().catch(err => {
  console.error('❌ Fatal: Failed to initialize data files:', err);
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  console.log(`[${new Date().toISOString()}] 🔐 Auth Header:`, authHeader);
  
  if (!authHeader) {
    console.log('❌ No authorization header');
    return res.status(401).json({ error: 'No authorization header' });
  }
  
  if (!authHeader.startsWith('Bearer ')) {
    console.log('❌ Not Bearer token');
    return res.status(401).json({ error: 'Invalid authorization format' });
  }
  
  const token = authHeader.substring(7);
  
  if (token.trim() !== 'MADA2024') {
    console.log('❌ Invalid token:', token);
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  console.log('✅ Authentication successful');
  next();
};

// Import routes
const portfolioRoutes = require('./routes/portfolio');
const contentRoutes = require('./routes/content');
const mediaRoutes = require('./routes/media');
const uploadRoutes = require('./routes/upload');
const settingsRoutes = require('./routes/settings');
const backupRoutes = require('./routes/backup');
const rebuildRoutes = require('./routes/rebuild');

// Use routes (all protected by authentication)
app.use('/api/portfolio', authenticate, portfolioRoutes);
app.use('/api/content', authenticate, contentRoutes);
app.use('/api/media', authenticate, mediaRoutes);
app.use('/api/upload', authenticate, uploadRoutes);
app.use('/api/settings', authenticate, settingsRoutes);
app.use('/api/backup', authenticate, backupRoutes);
app.use('/api/rebuild', authenticate, rebuildRoutes);

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to check data file (no auth required for debugging)
app.get('/api/debug/data', async (req, res) => {
  try {
    const dataDir = path.join(__dirname, 'data');
    const portfolioFile = path.join(dataDir, 'portfolio.json');
    
    const dataExists = await fs.pathExists(portfolioFile);
    let content = null;
    let stats = null;
    let directoryContents = [];
    
    if (await fs.pathExists(dataDir)) {
      directoryContents = await fs.readdir(dataDir);
    }
    
    if (dataExists) {
      content = await fs.readJson(portfolioFile);
      stats = await fs.stat(portfolioFile);
    }
    
    res.json({
      timestamp: new Date().toISOString(),
      portfolio: {
        fileExists: dataExists,
        fileSize: stats?.size,
        fileModified: stats?.mtime,
        projectCount: content?.projects?.length || 0,
        projects: content?.projects?.map(p => ({
          id: p.id,
          title: p.title,
          category: p.category
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  const dataDir = path.join(__dirname, 'data');
  const portfolioFile = path.join(dataDir, 'portfolio.json');
  
  let portfolioExists = false;
  let projectCount = 0;
  
  try {
    portfolioExists = fs.existsSync(portfolioFile);
    if (portfolioExists) {
      const content = fs.readJsonSync(portfolioFile);
      projectCount = content.projects?.length || 0;
    }
  } catch (error) {
    console.error('Error reading portfolio for test:', error);
  }
  
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    portfolio: {
      exists: portfolioExists,
      projectCount: projectCount
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ❌ Server error:`, err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[${new Date().toISOString()}] 404: ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MadaBrand backend running on port ${PORT}`);
  console.log(`📁 Data directory: ${path.join(__dirname, 'data')}`);
  console.log(`📸 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔗 API URL: https://madabrand.onrender.com/api`);
  console.log(`🌍 CORS enabled for: https://madabrand-e6hw.vercel.app`);
  console.log(`🔍 Debug endpoint: /api/debug/data`);
});