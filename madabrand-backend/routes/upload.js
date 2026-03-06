// routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const sharp = require('sharp');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'temp');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper to update media library
const updateMediaLibrary = async (newFiles) => {
  const mediaFilePath = path.join(__dirname, '..', 'data', 'media.json');
  let mediaData = [];
  
  try {
    if (await fs.pathExists(mediaFilePath)) {
      mediaData = JSON.parse(await fs.readFile(mediaFilePath, 'utf8'));
    }
  } catch (e) {
    mediaData = [];
  }
  
  mediaData.push(...newFiles);
  await fs.writeFile(mediaFilePath, JSON.stringify(mediaData, null, 2), 'utf8');
};

router.post('/', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files;
    const uploadedFiles = [];
    
    const imagesDir = path.join(__dirname, '..', 'uploads', 'images');
    await fs.ensureDir(imagesDir);
    
    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `upload-${timestamp}${ext}`;
      const outputPath = path.join(imagesDir, filename);
      
      try {
        // Optimize image with sharp
        const sharpInstance = sharp(file.path);
        const metadata = await sharpInstance.metadata();
        
        // Resize if too large
        let pipeline = sharpInstance;
        if (metadata.width > 1920) {
          pipeline = pipeline.resize(1920, null, { withoutEnlargement: true });
        }
        
        // Compress based on format
        if (ext === '.jpg' || ext === '.jpeg') {
          await pipeline.jpeg({ quality: 85, progressive: true }).toFile(outputPath);
        } else if (ext === '.png') {
          await pipeline.png({ compressionLevel: 9, quality: 85 }).toFile(outputPath);
        } else if (ext === '.webp') {
          await pipeline.webp({ quality: 85 }).toFile(outputPath);
        } else {
          await pipeline.toFile(outputPath);
        }
        
        // Get final metadata
        const finalMetadata = await sharp(outputPath).metadata();
        
        uploadedFiles.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: filename,
          name: file.originalname,
          url: `/uploads/images/${filename}`,
          size: fs.statSync(outputPath).size,
          dimensions: {
            width: finalMetadata.width,
            height: finalMetadata.height
          },
          uploaded: new Date().toISOString()
        });
        
        // Clean up temp file
        await fs.remove(file.path);
        
      } catch (sharpError) {
        console.error('Sharp processing error:', sharpError);
        // Fallback: just copy the file
        await fs.copy(file.path, outputPath);
        uploadedFiles.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          filename: filename,
          name: file.originalname,
          url: `/uploads/images/${filename}`,
          size: fs.statSync(outputPath).size,
          uploaded: new Date().toISOString()
        });
      }
    }
    
    // Update media library
    await updateMediaLibrary(uploadedFiles);
    
    res.json({ 
      success: true, 
      files: uploadedFiles,
      message: `Successfully uploaded ${uploadedFiles.length} files`
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;