// Admin Authentication System
const ADMIN_CONFIG = {
    passcode: "MADA2024", // Change this in settings
    sessionTimeout: 30, // minutes
    adminPath: "/madabrand-admin"
};

// Check if current URL is admin path
function isAdminPath() {
    return window.location.pathname.startsWith(ADMIN_CONFIG.adminPath) || 
           window.location.pathname.includes('/admin/');
}

// Authentication check
function checkAdminAuth() {
    // Skip check on login page
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    const sessionAuth = sessionStorage.getItem('adminAuth');
    const rememberAuth = localStorage.getItem('adminRemember');
    const loginTime = sessionStorage.getItem('adminLoginTime');
    
    // Check session timeout
    if (sessionAuth === 'true' && loginTime) {
        const elapsed = (Date.now() - parseInt(loginTime)) / 60000; // minutes
        if (elapsed > ADMIN_CONFIG.sessionTimeout) {
            logoutAdmin();
            return;
        }
    }
    
    // Valid auth
    if (sessionAuth === 'true' || rememberAuth === 'true') {
        return;
    }
    
    // Not authenticated - redirect to login
    window.location.href = '/admin/login.html';
}

// Login function
function loginAdmin(passcode, remember = false) {
    if (passcode === ADMIN_CONFIG.passcode) {
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('adminLoginTime', Date.now().toString());
        
        if (remember) {
            localStorage.setItem('adminRemember', 'true');
        }
        
        return true;
    }
    return false;
}

// Logout function
function logoutAdmin() {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('adminLoginTime');
    localStorage.removeItem('adminRemember');
    window.location.href = '/admin/login.html';
}

// Change passcode
function changePasscode(oldCode, newCode) {
    if (oldCode === ADMIN_CONFIG.passcode && newCode.length >= 6) {
        ADMIN_CONFIG.passcode = newCode;
        // In production, save to server/database
        localStorage.setItem('adminPasscode', newCode);
        return true;
    }
    return false;
}

// Run auth check on every page
document.addEventListener('DOMContentLoaded', checkAdminAuth);

// Auto logout on tab close
window.addEventListener('beforeunload', function() {
    if (!localStorage.getItem('adminRemember')) {
        sessionStorage.removeItem('adminAuth');
    }
});

// Keyboard shortcut to lock (Ctrl+Shift+L)
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        logoutAdmin();
    }
});