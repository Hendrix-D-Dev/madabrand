// routes/content.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

const CONTENT_FILE = path.join(__dirname, '..', 'data', 'content.json');

// Helper to read content data
const getContentData = async () => {
  try {
    const exists = await fs.pathExists(CONTENT_FILE);
    if (!exists) {
      return {
        home: {},
        about: {},
        services: {},
        global: {}
      };
    }
    const data = await fs.readFile(CONTENT_FILE, 'utf8');
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
const saveContentData = async (data) => {
  await fs.writeFile(CONTENT_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('✅ Content data saved');
};

// GET content (optional page parameter)
router.get('/', async (req, res) => {
  try {
    const content = await getContentData();
    const { page } = req.query;
    
    if (page && page !== 'all') {
      res.json(content[page] || {});
    } else {
      res.json(content);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST update content
router.post('/', async (req, res) => {
  try {
    const { page, content } = req.body;
    const currentContent = await getContentData();
    
    if (page && page !== 'all') {
      currentContent[page] = content;
    } else {
      // Replace entire content
      Object.assign(currentContent, content);
    }
    
    await saveContentData(currentContent);
    res.json({ success: true, message: 'Content updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update specific section
router.put('/', async (req, res) => {
  try {
    const { page, section, data } = req.body;
    const currentContent = await getContentData();
    
    if (!currentContent[page]) currentContent[page] = {};
    currentContent[page][section] = data;
    
    await saveContentData(currentContent);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;