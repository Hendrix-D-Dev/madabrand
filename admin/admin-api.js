// /scripts/admin/admin-api.js
const AdminAPI = {
  baseUrl: '/api',
  
  async request(endpoint, options = {}) {
    const token = sessionStorage.getItem('adminToken') || 'MADA2024';
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  },
  
  // Portfolio endpoints
  async getPortfolio() {
    return this.request('/portfolio');
  },
  
  async addProject(formData) {
    return this.request('/portfolio', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set content-type for FormData
    });
  },
  
  async updateProject(id, data) {
    return this.request('/portfolio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...data })
    });
  },
  
  async deleteProject(id) {
    return this.request(`/portfolio?id=${id}`, {
      method: 'DELETE'
    });
  },
  
  // Upload endpoint
  async uploadImages(files) {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    
    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  },
  
  // Rebuild endpoint
  async triggerRebuild() {
    return this.request('/rebuild', {
      method: 'POST'
    });
  }
};

// Make it global
window.AdminAPI = AdminAPI;