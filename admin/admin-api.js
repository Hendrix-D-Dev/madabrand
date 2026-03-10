// /admin/admin-api.js
const AdminAPI = {
  // FIXED: Correct Render URL (no -backend suffix)
  baseUrl: 'https://madabrand.onrender.com/api',
  
  // Track if we're using local fallback
  usingLocalFallback: false,
  
  // ============================================
  // CORE REQUEST HANDLER
  // ============================================
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer MADA2024',
      ...options.headers
    };
    
    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }
    
    try {
      console.log(`📡 API Request: ${options.method || 'GET'} ${this.baseUrl}${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'omit'
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
      this.usingLocalFallback = false;
      return data;
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      this.usingLocalFallback = true;
      throw error;
    }
  },

  // ============================================
  // PORTFOLIO ENDPOINTS
  // ============================================
  async getPortfolio() {
    try {
      const data = await this.request('/portfolio');
      return data.projects || data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch from API, using localStorage fallback');
      return JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
    }
  },

  async addProject(projectData) {
    try {
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
    } catch (error) {
      console.error('Add project failed:', error);
      
      // Fallback to localStorage only
      const current = JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
      const newProject = { ...projectData, id: Date.now(), offline: true };
      current.push(newProject);
      localStorage.setItem('madabrandPortfolio', JSON.stringify(current));
      
      this.showNotification('Project saved locally. Will sync when API is available.', 'warning');
      return { success: true, project: newProject, offline: true };
    }
  },

  async updateProject(id, projectData) {
    try {
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
    } catch (error) {
      console.error('Update project failed:', error);
      
      // Fallback to localStorage only
      const current = JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
      const index = current.findIndex(p => p.id == id);
      if (index !== -1) {
        current[index] = { ...current[index], ...projectData, offline: true };
        localStorage.setItem('madabrandPortfolio', JSON.stringify(current));
      }
      
      this.showNotification('Project updated locally. Will sync when API is available.', 'warning');
      return { success: true, offline: true };
    }
  },

  async deleteProject(id) {
    try {
      const result = await this.request(`/portfolio?id=${id}`, {
        method: 'DELETE'
      });
      
      // Update localStorage
      const current = JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
      const filtered = current.filter(p => p.id != id);
      localStorage.setItem('madabrandPortfolio', JSON.stringify(filtered));
      
      await this.triggerRebuild();
      return result;
    } catch (error) {
      console.error('Delete project failed:', error);
      
      // Fallback to localStorage only
      const current = JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
      const filtered = current.filter(p => p.id != id);
      localStorage.setItem('madabrandPortfolio', JSON.stringify(filtered));
      
      this.showNotification('Project deleted locally. Will sync when API is available.', 'warning');
      return { success: true, offline: true };
    }
  },

  // ============================================
  // CONTENT ENDPOINTS
  // ============================================
  async getContent(page) {
    try {
      return await this.request(`/content?page=${page || 'all'}`);
    } catch (error) {
      console.warn('⚠️ Failed to fetch content from API, using localStorage fallback');
      return JSON.parse(localStorage.getItem('madabrandContent') || '{}');
    }
  },

  async updateContent(page, content) {
    try {
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
    } catch (error) {
      console.error('Update content failed:', error);
      
      // Fallback to localStorage only
      const current = JSON.parse(localStorage.getItem('madabrandContent') || '{}');
      current[page] = { ...content, offline: true };
      localStorage.setItem('madabrandContent', JSON.stringify(current));
      
      this.showNotification('Content saved locally. Will sync when API is available.', 'warning');
      return { success: true, offline: true };
    }
  },

  async updateContentSection(page, section, data) {
    try {
      const result = await this.request('/content', {
        method: 'PUT',
        body: JSON.stringify({ page, section, data })
      });
      
      await this.triggerRebuild();
      return result;
    } catch (error) {
      console.error('Update content section failed:', error);
      
      // Fallback to localStorage
      const current = JSON.parse(localStorage.getItem('madabrandContent') || '{}');
      if (!current[page]) current[page] = {};
      current[page][section] = { ...data, offline: true };
      localStorage.setItem('madabrandContent', JSON.stringify(current));
      
      this.showNotification('Section saved locally. Will sync when API is available.', 'warning');
      return { success: true, offline: true };
    }
  },

  // ============================================
  // MEDIA ENDPOINTS
  // ============================================
  async getMedia() {
    try {
      return await this.request('/media');
    } catch (error) {
      console.warn('⚠️ Failed to fetch media from API, using localStorage fallback');
      return JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
    }
  },

  async uploadImage(file) {
    const formData = new FormData();
    formData.append('images', file);
    
    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer MADA2024'
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Update localStorage
      const media = JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
      media.push(...result.files);
      localStorage.setItem('madabrandMedia', JSON.stringify(media));
      
      await this.triggerRebuild();
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Fallback: save to localStorage only (simulate)
      const fakeFile = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        offline: true,
        uploaded: new Date().toISOString()
      };
      
      const media = JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
      media.push(fakeFile);
      localStorage.setItem('madabrandMedia', JSON.stringify(media));
      
      this.showNotification('Image saved locally. Will upload when API is available.', 'warning');
      return { success: true, files: [fakeFile], offline: true };
    }
  },

  async deleteImage(imageId) {
    try {
      const result = await this.request(`/media?id=${imageId}`, {
        method: 'DELETE'
      });
      
      // Update localStorage
      const media = JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
      const filtered = media.filter(img => img.id !== imageId);
      localStorage.setItem('madabrandMedia', JSON.stringify(filtered));
      
      await this.triggerRebuild();
      return result;
    } catch (error) {
      console.error('Delete image failed:', error);
      
      // Fallback to localStorage only
      const media = JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
      const filtered = media.filter(img => img.id !== imageId);
      localStorage.setItem('madabrandMedia', JSON.stringify(filtered));
      
      this.showNotification('Image deleted locally. Will sync when API is available.', 'warning');
      return { success: true, offline: true };
    }
  },

  async deleteMultipleImages(imageIds) {
    try {
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
    } catch (error) {
      console.error('Bulk delete failed:', error);
      
      // Fallback to localStorage only
      const media = JSON.parse(localStorage.getItem('madabrandMedia') || '[]');
      const idSet = new Set(imageIds);
      const filtered = media.filter(img => !idSet.has(img.id));
      localStorage.setItem('madabrandMedia', JSON.stringify(filtered));
      
      this.showNotification('Images deleted locally. Will sync when API is available.', 'warning');
      return { success: true, offline: true };
    }
  },

  // ============================================
  // SETTINGS ENDPOINTS
  // ============================================
  async getSettings() {
    try {
      return await this.request('/settings');
    } catch (error) {
      console.warn('⚠️ Failed to fetch settings from API, using localStorage fallback');
      return JSON.parse(localStorage.getItem('madabrandSettings') || '{}');
    }
  },

  async updateSettings(settings) {
    try {
      const result = await this.request('/settings', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      
      localStorage.setItem('madabrandSettings', JSON.stringify(settings));
      await this.triggerRebuild();
      return result;
    } catch (error) {
      console.error('Update settings failed:', error);
      
      localStorage.setItem('madabrandSettings', JSON.stringify(settings));
      this.showNotification('Settings saved locally. Will sync when API is available.', 'warning');
      return { success: true, offline: true };
    }
  },

  async updateSetting(category, key, value) {
    try {
      const result = await this.request('/settings', {
        method: 'PUT',
        body: JSON.stringify({ category, key, value })
      });
      
      await this.triggerRebuild();
      return result;
    } catch (error) {
      console.error('Update setting failed:', error);
      
      // Update localStorage
      const settings = JSON.parse(localStorage.getItem('madabrandSettings') || '{}');
      if (!settings[category]) settings[category] = {};
      settings[category][key] = value;
      localStorage.setItem('madabrandSettings', JSON.stringify(settings));
      
      this.showNotification('Setting saved locally. Will sync when API is available.', 'warning');
      return { success: true, offline: true };
    }
  },

  // ============================================
  // BACKUP ENDPOINTS
  // ============================================
  async createBackup() {
    try {
      return await this.request('/backup', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Backup failed:', error);
      this.showNotification('Backup failed - API unavailable', 'error');
      throw error;
    }
  },

  async downloadBackup() {
    try {
      // For download, we need to handle it differently
      window.location.href = `${this.baseUrl}/backup?token=MADA2024`;
    } catch (error) {
      console.error('Download failed:', error);
      this.showNotification('Download failed - API unavailable', 'error');
    }
  },

  // ============================================
  // REBUILD ENDPOINT
  // ============================================
  async triggerRebuild() {
    try {
      const result = await this.request('/rebuild', {
        method: 'POST'
      });
      console.log('🔄 Rebuild triggered:', result);
      
      let message = 'Changes saved successfully!';
      if (this.usingLocalFallback) {
        message = 'Changes saved locally. Will sync when API is available.';
      } else if (result.note) {
        message = result.note;
      } else {
        message = 'Site rebuild triggered! Changes will be live in 1-2 minutes.';
      }
      
      this.showNotification(message, this.usingLocalFallback ? 'warning' : 'success');
      return result;
    } catch (error) {
      console.warn('Rebuild failed, but changes saved:', error);
      this.showNotification('Changes saved locally. Manual rebuild may be needed.', 'warning');
      return { success: false, error: error.message, offline: true };
    }
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
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

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: { 'Authorization': 'Bearer MADA2024' }
      });
      const isHealthy = response.ok;
      this.usingLocalFallback = !isHealthy;
      return isHealthy;
    } catch {
      this.usingLocalFallback = true;
      return false;
    }
  },

  // ============================================
  // DEBUG FUNCTIONS
  // ============================================
  async debugCheck() {
    console.log('🔍 Running admin debug check...');
    console.log('📍 API Base URL:', this.baseUrl);
    
    const results = {
      apiConnection: false,
      rebuildEndpoint: false,
      portfolioData: false,
      fileWriteAccess: false,
      timestamp: new Date().toISOString(),
      usingLocalFallback: this.usingLocalFallback,
      details: {}
    };
    
    try {
      // 1. Check basic API connection
      console.log('📡 Testing API connection...');
      const healthCheck = await fetch(`${this.baseUrl}/health`, {
        headers: { 'Authorization': 'Bearer MADA2024' }
      });
      
      results.apiConnection = healthCheck.ok;
      results.details.apiStatus = healthCheck.status;
      
      if (healthCheck.ok) {
        const healthData = await healthCheck.json();
        results.details.health = healthData;
        console.log('✅ API is reachable');
      } else {
        console.warn('⚠️ API returned:', healthCheck.status);
      }
      
      if (results.apiConnection) {
        // 2. Test portfolio endpoint
        const portfolioCheck = await fetch(`${this.baseUrl}/portfolio`, {
          headers: { 'Authorization': 'Bearer MADA2024' }
        });
        
        if (portfolioCheck.ok) {
          const data = await portfolioCheck.json();
          results.portfolioData = data.projects?.length > 0;
          results.details.projectCount = data.projects?.length || 0;
        }
        
        // 3. Test rebuild endpoint
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
            results.details.rebuildMessage = rebuildData.message;
          }
        } catch (e) {
          results.details.rebuildError = e.message;
        }
        
        // 4. Test file write by creating a test project
        try {
          const testProject = {
            title: 'Debug Test Project',
            category: 'debug',
            description: 'This is a test project - delete me',
            images: ['/uploads/placeholder.jpg'],
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
      }
      
      // 5. Get environment info
      results.details.userAgent = navigator.userAgent;
      results.details.url = window.location.href;
      results.details.apiBaseUrl = this.baseUrl;
      
      // 6. Check localStorage fallback
      const localPortfolio = localStorage.getItem('madabrandPortfolio');
      results.details.hasLocalBackup = !!localPortfolio;
      
      // Log results
      console.log('📊 Debug Results:', results);
      
      // Show notification with summary
      if (results.apiConnection) {
        if (results.rebuildEndpoint && results.fileWriteAccess) {
          this.showNotification('✅ All systems operational! Changes will go live.', 'success');
        } else {
          this.showNotification('⚠️ API connected but some endpoints failing', 'warning');
        }
      } else {
        this.showNotification('❌ API unreachable - using local storage only', 'error');
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ Debug check failed:', error);
      this.showNotification('Debug check failed: ' + error.message, 'error');
      return { ...results, error: error.message };
    }
  },

  async forceRefresh() {
    this.showNotification('Attempting to force refresh...', 'info');
    
    try {
      // Trigger rebuild
      await this.triggerRebuild();
      
      // Add cache-busting timestamp
      const timestamp = Date.now();
      await fetch(`${this.baseUrl}/portfolio?t=${timestamp}`, {
        headers: { 'Authorization': 'Bearer MADA2024' }
      });
      
      this.showNotification('Refresh triggered! Check site in 2 minutes.', 'success');
      
    } catch (error) {
      console.error('Force refresh failed:', error);
      this.showNotification('Refresh failed: ' + error.message, 'error');
    }
  },

  async getSystemStatus() {
    const status = {
      api: 'offline',
      mode: this.usingLocalFallback ? 'local' : 'online',
      data: 'unknown',
      lastUpdate: null
    };
    
    try {
      const apiCheck = await this.checkHealth();
      status.api = apiCheck ? 'online' : 'offline';
      
      const portfolio = await this.getPortfolio();
      status.data = `${portfolio.length} projects`;
      
      return status;
    } catch (error) {
      return { ...status, error: error.message };
    }
  },

  // ============================================
  // SYNC FUNCTION - Sync local changes to API
  // ============================================
  async syncLocalChanges() {
    this.showNotification('Syncing local changes...', 'info');
    
    try {
      const isHealthy = await this.checkHealth();
      if (!isHealthy) {
        this.showNotification('API still unavailable. Try again later.', 'error');
        return;
      }
      
      // Get local data
      const localPortfolio = JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
      const offlineProjects = localPortfolio.filter(p => p.offline);
      
      if (offlineProjects.length === 0) {
        this.showNotification('No local changes to sync.', 'info');
        return;
      }
      
      // Sync each offline project
      for (const project of offlineProjects) {
        const { offline, ...cleanProject } = project;
        await this.addProject(cleanProject);
      }
      
      this.showNotification(`Synced ${offlineProjects.length} items!`, 'success');
      
    } catch (error) {
      console.error('Sync failed:', error);
      this.showNotification('Sync failed: ' + error.message, 'error');
    }
  }
};

// ============================================
// INITIALIZATION
// ============================================
window.AdminAPI = AdminAPI;

// Auto-run health check on page load
AdminAPI.checkHealth().then(isHealthy => {
  if (!isHealthy) {
    console.warn('⚠️ API is not reachable. Running in offline mode.');
    AdminAPI.showNotification('⚠️ API offline - changes saved locally only', 'warning');
  } else {
    console.log('✅ API is connected and ready.');
    AdminAPI.showNotification('✅ Connected to backend', 'success');
    
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

// Add keyboard shortcut for sync (Ctrl+Shift+S)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    AdminAPI.syncLocalChanges();
  }
});

// Add debug button to admin pages
const debugButton = document.createElement('button');
debugButton.innerHTML = '🔍 Debug';
debugButton.title = 'Ctrl+Shift+D';
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

// Add sync button
const syncButton = document.createElement('button');
syncButton.innerHTML = '🔄 Sync';
syncButton.title = 'Ctrl+Shift+S';
syncButton.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 100px;
  z-index: 9999;
  background: #10b981;
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

syncButton.onmouseover = () => syncButton.style.opacity = '1';
syncButton.onmouseout = () => syncButton.style.opacity = '0.5';
syncButton.onclick = () => AdminAPI.syncLocalChanges();

// Only add buttons on admin pages
if (window.location.pathname.includes('/admin/')) {
  document.body.appendChild(debugButton);
  document.body.appendChild(syncButton);
}