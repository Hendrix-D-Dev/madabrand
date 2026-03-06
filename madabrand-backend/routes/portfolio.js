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
      return { projects: [] };
    }
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading portfolio:', error);
    return { projects: [] };
  }
};

// Helper to save portfolio data
const savePortfolioData = async (data) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Portfolio data saved');
};

// GET all projects
router.get('/', async (req, res) => {
  try {
    const data = await getPortfolioData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new project
router.post('/', async (req, res) => {
  try {
    const projectData = req.body;
    const data = await getPortfolioData();
    
    const newProject = {
      id: Date.now(),
      ...projectData,
      images: projectData.images || ['/uploads/placeholder.jpg'],
      dateAdded: new Date().toISOString()
    };
    
    data.projects = data.projects || [];
    data.projects.push(newProject);
    await savePortfolioData(data);
    
    res.json({ success: true, project: newProject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update project
router.put('/', async (req, res) => {
  try {
    const updates = req.body;
    const { id } = updates;
    const data = await getPortfolioData();
    
    const index = data.projects.findIndex(p => p.id == id);
    if (index !== -1) {
      data.projects[index] = { ...data.projects[index], ...updates };
      await savePortfolioData(data);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Project not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE project
router.delete('/', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Project ID required' });
    }
    
    const data = await getPortfolioData();
    data.projects = data.projects.filter(p => p.id != id);
    await savePortfolioData(data);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;