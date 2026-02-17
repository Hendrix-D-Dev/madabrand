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
    const index = current.findIndex(p => p.id === id);
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
    const filtered = current.filter(p => p.id !== id);
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
    
    localStorage.setItem('madabrandContent', JSON.stringify(content));
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
      this.showNotification('Changes saved locally. Manual rebuild may be needed.', 'warning');
      return { success: false, error: error.message };
    }
  },

  // UTILITY: Show notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
      type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
      'bg-blue-100 text-blue-800 border border-blue-200'
    }`;
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  // UTILITY: Check API health
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
};

// Make it globally available
window.AdminAPI = AdminAPI;

// Auto-run health check
AdminAPI.checkHealth().then(isHealthy => {
  if (!isHealthy) {
    console.warn('⚠️ API is not reachable. Running in offline mode.');
  } else {
    console.log('✅ API is connected and ready.');
  }
});