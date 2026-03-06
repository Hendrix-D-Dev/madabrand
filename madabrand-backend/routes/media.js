// routes/media.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');

const MEDIA_FILE = path.join(__dirname, '..', 'data', 'media.json');

// Helper to read media data
const getMediaData = async () => {
  try {
    const exists = await fs.pathExists(MEDIA_FILE);
    if (!exists) {
      return [];
    }
    const data = await fs.readFile(MEDIA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading media:', error);
    return [];
  }
};

// Helper to save media data
const saveMediaData = async (data) => {
  await fs.writeFile(MEDIA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Helper to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// GET all media
router.get('/', async (req, res) => {
  try {
    const media = await getMediaData();
    
    // Add formatted size
    const itemsWithFormat = media.map(item => ({
      ...item,
      sizeFormatted: formatFileSize(item.size || 0)
    }));
    
    res.json(itemsWithFormat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE media item
router.delete('/', async (req, res) => {
  try {
    const { id } = req.query;
    const media = await getMediaData();
    const itemToDelete = media.find(item => item.id === id);
    
    if (itemToDelete) {
      // Delete the actual file
      const filePath = path.join(__dirname, '..', itemToDelete.url);
      try {
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          console.log(`Deleted file: ${filePath}`);
        }
      } catch (e) {
        console.error('Error deleting file:', e);
      }
      
      // Remove from list
      const filtered = media.filter(item => item.id !== id);
      await saveMediaData(filtered);
      
      res.json({ success: true, message: 'Media item deleted' });
    } else {
      res.status(404).json({ error: 'Media item not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH bulk delete
router.patch('/', async (req, res) => {
  try {
    const { operation, items } = req.body;
    
    if (operation === 'delete') {
      const media = await getMediaData();
      const idsToDelete = new Set(items);
      
      // Delete files
      for (const id of items) {
        const item = media.find(i => i.id === id);
        if (item) {
          const filePath = path.join(__dirname, '..', item.url);
          try {
            if (await fs.pathExists(filePath)) {
              await fs.remove(filePath);
            }
          } catch (e) {
            console.error('Error deleting file:', e);
          }
        }
      }
      
      // Remove from list
      const filtered = media.filter(item => !idsToDelete.has(item.id));
      await saveMediaData(filtered);
      
      res.json({ 
        success: true, 
        message: `Deleted ${items.length} items` 
      });
    } else {
      res.status(400).json({ error: 'Unsupported operation' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;