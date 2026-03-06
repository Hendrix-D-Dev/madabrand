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
  fs.ensureDirSync(path.join(__dirname, dir));
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
    if (!await fs.pathExists(fullPath)) {
      await fs.writeFile(fullPath, JSON.stringify(defaultContent, null, 2));
      console.log(`✅ Created: ${filePath}`);
    }
  }
};

initDataFiles();

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 MadaBrand backend running on port ${PORT}`);
  console.log(`📁 Data directory: ${path.join(__dirname, 'data')}`);
  console.log(`📸 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`🔗 API URL: http://localhost:${PORT}/api`);
});