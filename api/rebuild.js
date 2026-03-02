// /api/rebuild.js - FIXED VERSION with actual Vercel deployment trigger
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // For Vercel, we need to trigger a new deployment
    // Get the deployment hook URL from environment variables
    const DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK;
    
    // Also try to get from common Vercel env vars
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID;
    
    let rebuildTriggered = false;
    let rebuildMethod = 'none';
    
    // Method 1: Use Deployment Hook (simplest)
    if (DEPLOY_HOOK_URL) {
      console.log('🔄 Triggering Vercel deploy hook...');
      const response = await fetch(DEPLOY_HOOK_URL, {
        method: 'POST'
      });
      
      if (response.ok) {
        rebuildTriggered = true;
        rebuildMethod = 'hook';
        console.log('✅ Deploy hook triggered successfully');
      } else {
        console.error('❌ Deploy hook failed:', await response.text());
      }
    }
    
    // Method 2: Use Vercel API (if hook not available)
    if (!rebuildTriggered && VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      console.log('🔄 Triggering Vercel API deployment...');
      const response = await fetch(`https://api.vercel.com/v1/deployments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: VERCEL_PROJECT_ID,
          projectId: VERCEL_PROJECT_ID,
          target: 'production'
        })
      });
      
      if (response.ok) {
        rebuildTriggered = true;
        rebuildMethod = 'api';
        console.log('✅ Vercel API deployment triggered');
      }
    }
    
    // Method 3: For development/fallback, touch a file to force rebuild
    if (!rebuildTriggered) {
      console.log('⚠️ No Vercel credentials found, using file timestamp method');
      
      // Touch a file to force rebuild on some platforms
      const timestampFile = path.join(process.cwd(), '.last-update');
      fs.writeFileSync(timestampFile, new Date().toISOString());
      
      // Also try to invalidate cache by updating a meta file
      const buildInfoPath = path.join(process.cwd(), 'data', 'build-info.json');
      const buildInfo = {
        lastBuild: new Date().toISOString(),
        triggeredBy: 'admin-api'
      };
      fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
      
      rebuildMethod = 'timestamp';
    }

    // Return success with details
    return res.status(200).json({ 
      success: true, 
      message: 'Site rebuild triggered',
      method: rebuildMethod,
      note: rebuildTriggered ? 
        'Changes will be live in 1-2 minutes' : 
        'Manual Vercel deployment may be needed. Add VERCEL_DEPLOY_HOOK to environment variables for auto-rebuild.'
    });

  } catch (error) {
    console.error('Rebuild error:', error);
    res.status(500).json({ error: error.message });
  }
}