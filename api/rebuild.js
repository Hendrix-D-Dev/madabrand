// /api/rebuild.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== 'Bearer MADA2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get Vercel deployment URL from environment
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    
    if (!VERCEL_TOKEN || !PROJECT_ID) {
      // If no token, simulate rebuild (for development)
      console.log('Simulating rebuild...');
      return res.status(200).json({ 
        success: true, 
        message: 'Rebuild triggered (simulated)',
        note: 'Add VERCEL_TOKEN and VERCEL_PROJECT_ID to environment for auto-rebuild'
      });
    }

    // Trigger Vercel deployment hook
    const response = await fetch(`https://api.vercel.com/v1/integrations/deploy/${PROJECT_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to trigger rebuild');
    }

    const data = await response.json();
    
    res.status(200).json({
      success: true,
      message: 'Rebuild triggered successfully',
      deployment: data
    });

  } catch (error) {
    console.error('Rebuild error:', error);
    res.status(500).json({ error: error.message });
  }
}