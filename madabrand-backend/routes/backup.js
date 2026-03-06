// routes/backup.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');

router.get('/', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '..', 'backups');
    
    await fs.ensureDir(backupDir);
    
    const zipPath = path.join(backupDir, `backup-${timestamp}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`📦 Backup created: ${zipPath} (${archive.pointer()} bytes)`);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename=backup-${timestamp}.zip`);
      
      const fileStream = fs.createReadStream(zipPath);
      fileStream.pipe(res);
      
      fileStream.on('end', () => {
        fs.unlinkSync(zipPath);
      });
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    
    // Add important directories
    if (await fs.pathExists(path.join(__dirname, '..', 'data'))) {
      archive.directory('data/', 'data');
    }
    
    if (await fs.pathExists(path.join(__dirname, '..', 'uploads'))) {
      archive.directory('uploads/', 'uploads');
    }
    
    await archive.finalize();
    
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;