// /api/pages.js
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page, html } = req.body;
    
    if (!page || !html) {
      return res.status(400).json({ error: 'Missing page or html' });
    }
    
    // Validate page name
    const allowedPages = ['index', 'about', 'services', 'portfolio', 'contact'];
    if (!allowedPages.includes(page)) {
      return res.status(400).json({ error: 'Invalid page name' });
    }
    
    const filePath = path.join(process.cwd(), `${page}.html`);
    
    // Create backup of current file
    const backupDir = path.join(process.cwd(), 'backups', 'pages');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `${page}-${timestamp}.html`);
    
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    // Write new HTML
    fs.writeFileSync(filePath, html, 'utf8');
    
    res.status(200).json({ 
      success: true,
      message: `${page}.html updated successfully`,
      backup: backupPath
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}