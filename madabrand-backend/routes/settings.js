// routes/settings.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

// Helper to read settings
const getSettings = async () => {
  try {
    const exists = await fs.pathExists(SETTINGS_FILE);
    if (!exists) {
      return {
        admin: { passcode: 'MADA2024' },
        site: { title: 'MadaBrand' },
        theme: { primaryColor: '#1e3a8a' },
        integrations: { whatsapp: '2348104902357' }
      };
    }
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      admin: { passcode: 'MADA2024' },
      site: { title: 'MadaBrand' }
    };
  }
};

// Helper to save settings
const saveSettings = async (settings) => {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  console.log('✅ Settings saved');
};

// GET settings
router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    // Don't send passcode
    if (settings.admin) {
      delete settings.admin.passcode;
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST update settings
router.post('/', async (req, res) => {
  try {
    const newSettings = req.body;
    const currentSettings = await getSettings();
    
    // Keep passcode if not provided
    if (!newSettings.admin?.passcode) {
      newSettings.admin = {
        ...newSettings.admin,
        passcode: currentSettings.admin.passcode
      };
    }
    
    await saveSettings(newSettings);
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update specific category/key
router.put('/', async (req, res) => {
  try {
    const { category, key, value } = req.body;
    const current = await getSettings();
    
    if (current[category]) {
      current[category][key] = value;
      await saveSettings(current);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;