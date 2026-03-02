// /admin/admin-api.js
const AdminAPI = {
  baseUrl: '/api',
  
  // Helper for making authenticated requests
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer MADA2024',
      ...options.headers
    };
    
    try {
      console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || 'Request failed';
        } catch {
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      throw error;
    }
  },

  // PORTFOLIO ENDPOINTS
  async getPortfolio() {
    try {
      const data = await this.request('/portfolio');
      return data.projects || data || [];
    } catch (error) {
      console.warn('Failed to fetch from API, using localStorage fallback');
      return JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
    }
  },

  async addProject(projectData) {
    const result = await this.request('/portfolio', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
    
    // Update localStorage as backup
    const current = JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
    current.push(projectData);
    localStorage.setItem('madabrandPortfolio', JSON.stringify(current));
    
    await this.triggerRebuild();
    return result;
  },

  async updateProject(id, projectData) {
    const result = await this.request('/portfolio', {
      method: 'PUT',
      body: JSON.stringify({ id, ...projectData })
    });
    
    // Update localStorage
    const current = JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
    const index = current.findIndex(p => p.id == id);
    if (index !== -1) {
      current[index] = { ...current[index], ...projectData };
      localStorage.setItem('madabrandPortfolio', JSON.stringify(current));
    }
    
    await this.triggerRebuild();
    return result;
  },

  async deleteProject(id) {
    const result = await this.request(`/portfolio?id=${id}`, {
      method: 'DELETE'
    });
    
    // Update localStorage
    const current = JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
    const filtered = current.filter(p => p.id != id);
    localStorage.setItem('madabrandPortfolio', JSON.stringify(filtered));
    
    await this.triggerRebuild();
    return result;
  },

  // CONTENT ENDPOINTS
  async getContent(page) {
    try {
      return await this.request(`/content?page=${page || 'all'}`);
    } catch (error) {
      return JSON.parse(localStorage.getItem('madabrandContent') || '{}');
    }
  },

  async updateContent(page, content) {
    const result = await this.request('/content', {
      method: 'POST',
      body: JSON.stringify({ page, content })
    });
    
    // Update localStorage
    const current = JSON.parse(localStorage.getItem('madabrandContent') || '{}');
    current[page] = content;
    localStorage.setItem('madabrandContent', JSON.stringify(current));
    
    await this.triggerRebuild();
    return result;
  },

  async updateContentSection(page, section, data) {
    const result = await this.request('/content', {
      method: 'PUT',
      body: JSON.stringify({ page, section, data })
    });
    
    await this.triggerRebuild();
    return result;
  },

  // MEDIA ENDPOINTS
  async getMedia() {
    try {
      return await this.request('/media');
    } catch (error) {
      return JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
    }
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('images', file);
    
    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer MADA2024'
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const result = await response.json();
    
    // Update localStorage
    const media = JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
    media.push(...result.files);
    localStorage.setItem('madabrandMedia', JSON.stringify(media));
    
    await this.triggerRebuild();
    return result;
  },

  async deleteImage(imageId) {
    const result = await this.request(`/media?id=${imageId}`, {
      method: 'DELETE'
    });
    
    // Update localStorage
    const media = JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
    const filtered = media.filter(img => img.id !== imageId);
    localStorage.setItem('madabrandMedia', JSON.stringify(filtered));
    
    await this.triggerRebuild();
    return result;
  },

  async deleteMultipleImages(imageIds) {
    const result = await this.request('/media', {
      method: 'PATCH',
      body: JSON.stringify({
        operation: 'delete',
        items: imageIds
      })
    });
    
    // Update localStorage
    const media = JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
    const idSet = new Set(imageIds);
    const filtered = media.filter(img => !idSet.has(img.id));
    localStorage.setItem('madabrandMedia', JSON.stringify(filtered));
    
    await this.triggerRebuild();
    return result;
  },

  // SETTINGS ENDPOINTS
  async getSettings() {
    try {
      return await this.request('/settings');
    } catch (error) {
      return JSON.parse(localStorage.getItem('madabrandSettings') || '{}');
    }
  },

  async updateSettings(settings) {
    const result = await this.request('/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    
    localStorage.setItem('madabrandSettings', JSON.stringify(settings));
    await this.triggerRebuild();
    return result;
  },

  async updateSetting(category, key, value) {
    const result = await this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify({ category, key, value })
    });
    
    await this.triggerRebuild();
    return result;
  },

  // PAGE ENDPOINTS
  async updatePage(pageName, html) {
    return await this.request('/pages', {
      method: 'POST',
      body: JSON.stringify({ page: pageName, html })
    });
  },

  // BACKUP ENDPOINTS
  async createBackup() {
    return await this.request('/backup', {
      method: 'POST'
    });
  },

  async downloadBackup() {
    window.location.href = `${this.baseUrl}/backup?token=MADA2024`;
  },

  // REBUILD ENDPOINT - CRITICAL FOR LIVE UPDATES
  async triggerRebuild() {
    try {
      const result = await this.request('/rebuild', {
        method: 'POST'
      });
      console.log('🔄 Rebuild triggered:', result);
      this.showNotification('Site rebuild triggered! Changes will be live in 1-2 minutes.', 'success');
      return result;
    } catch (error) {
      console.warn('Rebuild failed, but changes saved:', error);
      this.showNotification('Changes saved. ' + (error.message || 'Manual rebuild may be needed.'), 'warning');
      return { success: false, error: error.message };
    }
  },

  // UTILITY: Show notification
  showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existing = document.querySelector('.admin-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `admin-notification fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
      type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
      type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
      'bg-blue-100 text-blue-800 border border-blue-200'
    }`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  },

  // UTILITY: Check API health
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/portfolio`, {
        headers: { 'Authorization': 'Bearer MADA2024' }
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  // 🔍 NEW DEBUG FUNCTION - This will help identify issues
  async debugCheck() {
    console.log('🔍 Running admin debug check...');
    
    const results = {
      apiConnection: false,
      rebuildEndpoint: false,
      portfolioData: false,
      fileWriteAccess: false,
      timestamp: new Date().toISOString(),
      details: {}
    };
    
    try {
      // 1. Check basic API connection
      const healthCheck = await fetch(`${this.baseUrl}/portfolio`, {
        headers: { 'Authorization': 'Bearer MADA2024' }
      });
      
      results.apiConnection = healthCheck.ok;
      results.details.apiStatus = healthCheck.status;
      
      if (healthCheck.ok) {
        const data = await healthCheck.json();
        results.portfolioData = data.projects?.length > 0;
        results.details.projectCount = data.projects?.length || 0;
      }
      
      // 2. Test rebuild endpoint
      try {
        const rebuildTest = await fetch(`${this.baseUrl}/rebuild`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer MADA2024',
            'Content-Type': 'application/json'
          }
        });
        
        results.rebuildEndpoint = rebuildTest.ok;
        if (rebuildTest.ok) {
          const rebuildData = await rebuildTest.json();
          results.details.rebuildMethod = rebuildData.method;
          results.details.rebuildMessage = rebuildData.message;
        }
      } catch (e) {
        results.details.rebuildError = e.message;
      }
      
      // 3. Test file write by creating a test project
      try {
        const testProject = {
          title: 'Debug Test Project',
          category: 'debug',
          description: 'This is a test project - delete me',
          images: ['/assets/images/placeholder.jpg'],
          debug: true,
          timestamp: Date.now()
        };
        
        const writeTest = await fetch(`${this.baseUrl}/portfolio`, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer MADA2024',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testProject)
        });
        
        results.fileWriteAccess = writeTest.ok;
        
        if (writeTest.ok) {
          // Clean up - delete the test project
          const writeData = await writeTest.json();
          if (writeData.project?.id) {
            setTimeout(async () => {
              await fetch(`${this.baseUrl}/portfolio?id=${writeData.project.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer MADA2024' }
              });
            }, 1000);
          }
        }
      } catch (e) {
        results.details.writeError = e.message;
      }
      
      // 4. Get environment info
      results.details.userAgent = navigator.userAgent;
      results.details.url = window.location.href;
      results.details.apiBaseUrl = this.baseUrl;
      
      // 5. Check localStorage fallback
      const localPortfolio = localStorage.getItem('madabrandPortfolio');
      results.details.hasLocalBackup = !!localPortfolio;
      
      // Log results
      console.log('📊 Debug Results:', results);
      
      // Show notification with summary
      const allGood = results.apiConnection && results.rebuildEndpoint && results.fileWriteAccess;
      
      if (allGood) {
        this.showNotification('✅ All systems operational! Changes will go live.', 'success');
      } else {
        const issues = [];
        if (!results.apiConnection) issues.push('API unreachable');
        if (!results.rebuildEndpoint) issues.push('Rebuild not working');
        if (!results.fileWriteAccess) issues.push('Cannot write files');
        
        this.showNotification(`⚠️ Issues detected: ${issues.join(', ')}`, 'warning');
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Debug check failed:', error);
      this.showNotification('Debug check failed: ' + error.message, 'error');
      return { ...results, error: error.message };
    }
  },

  // 🔧 NEW FUNCTION: Force refresh the live site
  async forceRefresh() {
    this.showNotification('Attempting to force refresh...', 'info');
    
    try {
      // Try multiple methods to force update
      
      // 1. Trigger rebuild
      await this.triggerRebuild();
      
      // 2. Add cache-busting timestamp to portfolio
      const timestamp = Date.now();
      await fetch(`${this.baseUrl}/portfolio?t=${timestamp}`, {
        headers: { 'Authorization': 'Bearer MADA2024' }
      });
      
      // 3. Try to touch a file to force rebuild
      await fetch(`${this.baseUrl}/rebuild?force=${timestamp}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer MADA2024',
          'Content-Type': 'application/json'
        }
      });
      
      this.showNotification('Refresh triggered! Check live site in 2 minutes.', 'success');
      
    } catch (error) {
      console.error('Force refresh failed:', error);
      this.showNotification('Refresh failed: ' + error.message, 'error');
    }
  },

  // 📋 NEW FUNCTION: Get system status
  async getSystemStatus() {
    try {
      const status = {
        api: 'checking',
        rebuild: 'checking',
        data: 'checking',
        lastUpdate: null
      };
      
      // Check API
      try {
        const apiCheck = await fetch(`${this.baseUrl}/portfolio`, {
          headers: { 'Authorization': 'Bearer MADA2024' }
        });
        status.api = apiCheck.ok ? 'online' : 'offline';
      } catch {
        status.api = 'offline';
      }
      
      // Get last update time from data file
      try {
        const timestampCheck = await fetch('/data/last-update.txt?' + Date.now());
        if (timestampCheck.ok) {
          status.lastUpdate = await timestampCheck.text();
        }
      } catch {
        // Ignore - file might not exist
      }
      
      // Get portfolio count
      try {
        const portfolio = await this.getPortfolio();
        status.data = `${portfolio.length} projects`;
      } catch {
        status.data = 'unknown';
      }
      
      return status;
      
    } catch (error) {
      console.error('Status check failed:', error);
      return { error: error.message };
    }
  }
};

// Make it globally available
window.AdminAPI = AdminAPI;

// Auto-run health check on page load
AdminAPI.checkHealth().then(isHealthy => {
  if (!isHealthy) {
    console.warn('⚠️ API is not reachable. Running in offline mode.');
    AdminAPI.showNotification('⚠️ API offline - changes saved locally only', 'warning');
  } else {
    console.log('✅ API is connected and ready.');
    
    // Run quick debug check silently
    setTimeout(() => {
      AdminAPI.debugCheck().then(results => {
        if (!results.rebuildEndpoint) {
          console.warn('⚠️ Rebuild endpoint not working - live site may not update automatically');
        }
      });
    }, 2000);
  }
});

// Add keyboard shortcut for debug (Ctrl+Shift+D)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    AdminAPI.debugCheck().then(results => {
      console.table(results.details);
    });
  }
});

// Add debug button to admin pages (will appear in bottom right)
const debugButton = document.createElement('button');
debugButton.innerHTML = '🔍 Debug';
debugButton.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  background: #1e3a8a;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  opacity: 0.5;
  transition: opacity 0.3s;
`;
debugButton.onmouseover = () => debugButton.style.opacity = '1';
debugButton.onmouseout = () => debugButton.style.opacity = '0.5';
debugButton.onclick = () => AdminAPI.debugCheck();

// Only add button on admin pages
if (window.location.pathname.includes('/admin/')) {
  document.body.appendChild(debugButton);
}