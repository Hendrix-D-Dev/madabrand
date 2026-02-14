// /api/upload.js
import fs from 'fs';
import path from 'path';
import formidable from 'formidable';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(process.cwd(), 'temp');
  form.keepExtensions = true;
  form.maxFileSize = 10 * 1024 * 1024; // 10MB limit

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    try {
      const uploadedFiles = [];
      const images = Array.isArray(files.images) ? files.images : [files.images];

      for (const image of images) {
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(image.mimetype)) {
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(image.originalFilename);
        const filename = `upload-${timestamp}${ext}`;
        const outputPath = path.join(process.cwd(), 'assets', 'images', filename);

        // Optimize image
        let sharpInstance = sharp(image.filepath);
        
        // Get metadata
        const metadata = await sharpInstance.metadata();
        
        // Resize if too large
        if (metadata.width > 1920) {
          sharpInstance = sharpInstance.resize(1920, null, { withoutEnlargement: true });
        }
        
        // Compress based on format
        if (ext === '.jpg' || ext === '.jpeg') {
          await sharpInstance.jpeg({ quality: 85, progressive: true }).toFile(outputPath);
        } else if (ext === '.png') {
          await sharpInstance.png({ compressionLevel: 9, quality: 85 }).toFile(outputPath);
        } else if (ext === '.webp') {
          await sharpInstance.webp({ quality: 85 }).toFile(outputPath);
        } else {
          await sharpInstance.toFile(outputPath);
        }

        // Clean up temp file
        fs.unlinkSync(image.filepath);

        uploadedFiles.push({
          filename,
          url: `/assets/images/${filename}`,
          size: fs.statSync(outputPath).size,
          dimensions: {
            width: metadata.width,
            height: metadata.height
          }
        });
      }

      // Update media library in localStorage (optional)
      const mediaPath = path.join(process.cwd(), 'data', 'media.json');
      let media = [];
      try {
        media = JSON.parse(fs.readFileSync(mediaPath, 'utf8'));
      } catch (error) {
        media = [];
      }
      
      media.push(...uploadedFiles);
      fs.writeFileSync(mediaPath, JSON.stringify(media, null, 2), 'utf8');

      res.status(200).json({
        success: true,
        files: uploadedFiles
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message });
    }
  });
}