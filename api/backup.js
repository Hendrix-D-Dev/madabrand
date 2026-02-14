// /api/backup.js
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      // Create backup
      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(process.cwd(), 'backups');
        
        // Ensure backup directory exists
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const zipPath = path.join(backupDir, `backup-${timestamp}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        archive.pipe(output);
        
        // Add all important files
        archive.directory('data/', 'data');
        archive.directory('assets/images/', 'assets/images');
        archive.file('portfolio.html', { name: 'portfolio.html' });
        archive.file('services.html', { name: 'services.html' });
        archive.file('about.html', { name: 'about.html' });
        archive.file('contact.html', { name: 'contact.html' });
        archive.file('index.html', { name: 'index.html' });
        
        await archive.finalize();
        
        output.on('close', () => {
          res.setHeader('Content-Type', 'application/zip');
          res.setHeader('Content-Disposition', `attachment; filename=backup-${timestamp}.zip`);
          
          const fileStream = fs.createReadStream(zipPath);
          fileStream.pipe(res);
          
          // Clean up after sending
          fileStream.on('end', () => {
            fs.unlinkSync(zipPath);
          });
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'POST':
      // Restore from backup
      // This would handle uploading a backup file and restoring
      res.status(200).json({ message: 'Restore endpoint - implement with file upload' });
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}