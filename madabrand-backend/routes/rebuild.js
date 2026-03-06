// routes/rebuild.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

router.post('/', async (req, res) => {
  try {
    // Since we're now using Render for backend, rebuild just notifies
    // that changes have been saved. Frontend (Vercel) can be rebuilt
    // manually or via webhook if needed.
    
    console.log('🔄 Rebuild triggered at:', new Date().toISOString());
    
    // Update a timestamp file to track last rebuild
    const timestampPath = path.join(__dirname, '..', 'data', 'last-rebuild.txt');
    await fs.writeFile(timestampPath, new Date().toISOString());
    
    res.json({ 
      success: true, 
      message: 'Changes saved successfully',
      note: 'Data has been saved on Render backend. Frontend will reflect changes on next load.'
    });

  } catch (error) {
    console.error('Rebuild error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;