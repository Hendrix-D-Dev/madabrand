// /api/media.js
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: true,
  },
};

// Helper to read media library data
const getMediaData = () => {
  const filePath = path.join(process.cwd(), 'data', 'media.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, scan the assets/images directory
    const imagesDir = path.join(process.cwd(), 'assets', 'images');
    const mediaItems = [];
    
    try {
      if (fs.existsSync(imagesDir)) {
        const files = fs.readdirSync(imagesDir);
        
        files.forEach(file => {
          // Only include image files
          if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)) {
            const filePath = path.join(imagesDir, file);
            const stats = fs.statSync(filePath);
            
            mediaItems.push({
              id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file,
              url: `/assets/images/${file}`,
              type: `image/${path.extname(file).slice(1)}`,
              size: stats.size,
              uploaded: stats.birthtime.toISOString(),
              dimensions: { width: 1200, height: 800 } // Default, would need sharp to get actual
            });
          }
        });
      }
    } catch (e) {
      console.error('Error scanning images directory:', e);
    }
    
    return mediaItems;
  }
};

// Helper to save media data
const saveMediaData = (mediaItems) => {
  const filePath = path.join(process.cwd(), 'data', 'media.json');
  const dirPath = path.dirname(filePath);
  
  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  fs.writeFileSync(filePath, JSON.stringify(mediaItems, null, 2), 'utf8');
};

// Helper to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default async function handler(req, res) {
  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      // Get all media items
      try {
        const mediaItems = getMediaData();
        
        // Add formatted size for display
        const itemsWithFormat = mediaItems.map(item => ({
          ...item,
          sizeFormatted: formatFileSize(item.size)
        }));
        
        res.status(200).json(itemsWithFormat);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'POST':
      // Add new media item (called from upload.js)
      try {
        const newItem = req.body;
        const mediaItems = getMediaData();
        
        // Generate ID if not provided
        if (!newItem.id) {
          newItem.id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        mediaItems.push(newItem);
        saveMediaData(mediaItems);
        
        res.status(200).json({ success: true, item: newItem });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'PUT':
      // Update media item (e.g., rename, update metadata)
      try {
        const { id, updates } = req.body;
        const mediaItems = getMediaData();
        const index = mediaItems.findIndex(item => item.id === id);
        
        if (index !== -1) {
          mediaItems[index] = { ...mediaItems[index], ...updates };
          saveMediaData(mediaItems);
          res.status(200).json({ success: true });
        } else {
          res.status(404).json({ error: 'Media item not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'DELETE':
      // Delete media item
      try {
        const { id } = req.query;
        const mediaItems = getMediaData();
        const itemToDelete = mediaItems.find(item => item.id === id);
        
        if (itemToDelete) {
          // Delete the actual file
          const filePath = path.join(process.cwd(), itemToDelete.url.replace(/^\//, ''));
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            console.error('Error deleting file:', e);
          }
          
          // Remove from media list
          const filtered = mediaItems.filter(item => item.id !== id);
          saveMediaData(filtered);
          
          res.status(200).json({ success: true });
        } else {
          res.status(404).json({ error: 'Media item not found' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'PATCH':
      // Bulk operations (delete multiple, update multiple)
      try {
        const { operation, items } = req.body;
        
        if (operation === 'delete') {
          const mediaItems = getMediaData();
          const idsToDelete = new Set(items);
          
          // Delete files
          items.forEach(id => {
            const item = mediaItems.find(i => i.id === id);
            if (item) {
              const filePath = path.join(process.cwd(), item.url.replace(/^\//, ''));
              try {
                if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
                }
              } catch (e) {
                console.error('Error deleting file:', e);
              }
            }
          });
          
          // Remove from list
          const filtered = mediaItems.filter(item => !idsToDelete.has(item.id));
          saveMediaData(filtered);
          
          res.status(200).json({ 
            success: true, 
            message: `Deleted ${items.length} items` 
          });
        } else {
          res.status(400).json({ error: 'Unsupported operation' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}