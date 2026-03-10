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

// Ensure all required directories exist
const dirs = [
  'data',
  'uploads',
  'uploads/images',
  'uploads/temp',
  'backups',
  'assets',
  'assets/images'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  fs.ensureDirSync(dirPath);
  console.log(`📁 Directory ensured: ${dir}`);
});

// Initialize data files if they don't exist
const initDataFiles = async () => {
  const files = {
    'data/portfolio.json': { projects: [] },
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

  for (const [filePath, defaultContent] of Object.entries(files)) {
    const fullPath = path.join(__dirname, filePath);
    try {
      if (!await fs.pathExists(fullPath)) {
        await fs.writeFile(fullPath, JSON.stringify(defaultContent, null, 2));
        console.log(`✅ Created: ${filePath}`);
      } else {
        console.log(`📄 Found existing: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error creating ${filePath}:`, error.message);
    }
  }
};

// Run initialization
initDataFiles().catch(err => {
  console.error('❌ Failed to initialize data files:', err);
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

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    directories: {
      data: fs.existsSync(path.join(__dirname, 'data')),
      uploads: fs.existsSync(path.join(__dirname, 'uploads'))
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
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MadaBrand backend running on port ${PORT}`);
  console.log(`📁 Data directory: ${path.join(__dirname, 'data')}`);
  console.log(`📸 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
  console.log(`🌍 CORS enabled for: https://madabrand-e6hw.vercel.app`);
});