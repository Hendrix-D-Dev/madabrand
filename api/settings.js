// /api/settings.js
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: true,
  },
};

const getSettings = () => {
  const filePath = path.join(process.cwd(), 'data', 'settings.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return {
      admin: {
        passcode: 'MADA2024',
        sessionTimeout: 30,
        lastLogin: null,
        allowedIPs: []
      },
      site: {
        title: 'MadaBrand',
        tagline: 'Premium Design Studio',
        description: 'Premium brand design, logo design, and graphic design services in Lagos, Nigeria',
        keywords: 'brand design, logo design, graphic design, Nigeria, Lagos',
        author: 'MadaBrand'
      },
      theme: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#3b82f6',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        accentColor: '#1e40af',
        fontFamily: 'Inter, Lato, sans-serif'
      },
      integrations: {
        googleAnalytics: '',
        facebookPixel: '',
        whatsapp: '2348104902357'
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        lastBackup: null,
        maxBackups: 30
      }
    };
  }
};

const saveSettings = (settings) => {
  const filePath = path.join(process.cwd(), 'data', 'settings.json');
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf8');
};

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      // Get all settings
      const settings = getSettings();
      // Don't send passcode in response
      if (settings.admin) {
        delete settings.admin.passcode;
      }
      res.status(200).json(settings);
      break;
      
    case 'POST':
      // Update settings
      try {
        const newSettings = req.body;
        const currentSettings = getSettings();
        
        // Keep passcode if not provided
        if (!newSettings.admin?.passcode) {
          newSettings.admin = {
            ...newSettings.admin,
            passcode: currentSettings.admin.passcode
          };
        }
        
        saveSettings(newSettings);
        
        // Update environment variables if needed
        if (newSettings.integrations) {
          // Update .env file or Vercel env vars
          console.log('Updating integrations:', newSettings.integrations);
        }
        
        res.status(200).json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;
      
    case 'PUT':
      // Update specific setting
      const { category, key, value } = req.body;
      const current = getSettings();
      
      if (current[category]) {
        current[category][key] = value;
        saveSettings(current);
        res.status(200).json({ success: true });
      } else {
        res.status(404).json({ error: 'Category not found' });
      }
      break;
      
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
}