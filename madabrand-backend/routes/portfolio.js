// routes/portfolio.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

const DATA_FILE = path.join(__dirname, '..', 'data', 'portfolio.json');

// Helper to read portfolio data
const getPortfolioData = async () => {
  try {
    const exists = await fs.pathExists(DATA_FILE);
    if (!exists) {
      console.log('📄 portfolio.json not found, creating default');
      const defaultData = { projects: [] };
      await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading portfolio:', error);
    return { projects: [] };
  }
};

// Helper to save portfolio data
const savePortfolioData = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`[${new Date().toISOString()}] ✅ Portfolio data saved - ${data.projects.length} projects`);
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Error saving portfolio:`, error);
    return false;
  }
};

// GET all projects
router.get('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const data = await getPortfolioData();
    console.log(`[${new Date().toISOString()}] 📤 GET /portfolio - ${data.projects.length} projects (${Date.now() - startTime}ms)`);
    res.json(data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ GET /portfolio error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// POST new project
router.post('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const projectData = req.body;
    const data = await getPortfolioData();
    
    const newProject = {
      id: Date.now(),
      ...projectData,
      images: projectData.images || ['/uploads/placeholder.jpg'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.projects = data.projects || [];
    data.projects.push(newProject);
    
    const saved = await savePortfolioData(data);
    
    if (saved) {
      console.log(`[${new Date().toISOString()}] ✅ Project added: "${newProject.title}" (ID: ${newProject.id}) - ${Date.now() - startTime}ms`);
      
      // Trigger rebuild notification
      try {
        const rebuildResult = await fetch('https://api.vercel.com/v1/integrations/deploy/prj_GhZ4ej6v9wgMC4eNO8jwQEuLHeW0/iCp20wQE96', {
          method: 'POST'
        });
        console.log(`[${new Date().toISOString()}] 🔄 Vercel rebuild triggered: ${rebuildResult.status}`);
      } catch (rebuildError) {
        console.log(`[${new Date().toISOString()}] ⚠️ Rebuild trigger failed:`, rebuildError.message);
      }
      
      res.json({ success: true, project: newProject });
    } else {
      throw new Error('Failed to save project');
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ POST /portfolio error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update project
router.put('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const updates = req.body;
    const { id } = updates;
    const data = await getPortfolioData();
    
    const index = data.projects.findIndex(p => p.id == id);
    if (index !== -1) {
      data.projects[index] = { 
        ...data.projects[index], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      const saved = await savePortfolioData(data);
      
      if (saved) {
        console.log(`[${new Date().toISOString()}] ✅ Project updated: ID ${id} - ${Date.now() - startTime}ms`);
        
        // Trigger rebuild notification
        try {
          const rebuildResult = await fetch('https://api.vercel.com/v1/integrations/deploy/prj_GhZ4ej6v9wgMC4eNO8jwQEuLHeW0/iCp20wQE96', {
            method: 'POST'
          });
          console.log(`[${new Date().toISOString()}] 🔄 Vercel rebuild triggered: ${rebuildResult.status}`);
        } catch (rebuildError) {
          console.log(`[${new Date().toISOString()}] ⚠️ Rebuild trigger failed:`, rebuildError.message);
        }
        
        res.json({ success: true });
      } else {
        throw new Error('Failed to save project');
      }
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ PUT /portfolio error:`, error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE project
router.delete('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Project ID required' });
    }
    
    const data = await getPortfolioData();
    const projectToDelete = data.projects.find(p => p.id == id);
    data.projects = data.projects.filter(p => p.id != id);
    
    const saved = await savePortfolioData(data);
    
    if (saved) {
      console.log(`[${new Date().toISOString()}] ✅ Project deleted: "${projectToDelete?.title}" (ID: ${id}) - ${Date.now() - startTime}ms`);
      
      // Trigger rebuild notification
      try {
        const rebuildResult = await fetch('https://api.vercel.com/v1/integrations/deploy/prj_GhZ4ej6v9wgMC4eNO8jwQEuLHeW0/iCp20wQE96', {
          method: 'POST'
        });
        console.log(`[${new Date().toISOString()}] 🔄 Vercel rebuild triggered: ${rebuildResult.status}`);
      } catch (rebuildError) {
        console.log(`[${new Date().toISOString()}] ⚠️ Rebuild trigger failed:`, rebuildError.message);
      }
      
      res.json({ success: true });
    } else {
      throw new Error('Failed to save project');
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ DELETE /portfolio error:`, error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;