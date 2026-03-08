// /scripts/keep-alive.js
// Keep Render backend alive by pinging it every 5 minutes

const KEEP_ALIVE_URL = 'https://madabrand.onrender.com/api/health';
const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes (Render free tier spins down after 15 mins)

async function pingServer() {
    try {
        console.log('📡 Keep-alive ping to Render...');
        const response = await fetch(KEEP_ALIVE_URL, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (response.ok) {
            console.log('✅ Keep-alive successful at', new Date().toLocaleTimeString());
        } else {
            console.warn('⚠️ Keep-alive returned:', response.status);
        }
    } catch (error) {
        console.error('❌ Keep-alive failed:', error.message);
        // Try again in 1 minute if failed
        setTimeout(pingServer, 60000);
    }
}

// Ping immediately when page loads
pingServer();

// Then ping every 5 minutes
setInterval(pingServer, PING_INTERVAL);

// Also ping when user interacts with the page (shows activity)
document.addEventListener('click', () => {
    // Throttle to once per minute max
    const now = Date.now();
    if (!window.lastActivityPing || now - window.lastActivityPing > 60000) {
        window.lastActivityPing = now;
        pingServer();
    }
});

// Ping when page becomes visible again
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        pingServer();
    }
});