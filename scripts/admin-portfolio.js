// Portfolio Management System
const PortfolioManager = {
    // Get all projects
    getAll() {
        return JSON.parse(localStorage.getItem('madabrandPortfolio') || '[]');
    },
    
    // Save all projects
    saveAll(projects) {
        localStorage.setItem('madabrandPortfolio', JSON.stringify(projects));
        this.updatePortfolioPage();
    },
    
    // Add new project
    add(project) {
        const projects = this.getAll();
        const newProject = {
            id: 'proj-' + Date.now(),
            title: project.title || 'Untitled Project',
            category: project.category || 'branding',
            description: project.description || '',
            imageUrl: project.imageUrl || '/assets/images/placeholder.jpg',
            date: project.date || new Date().toISOString().split('T')[0],
            featured: project.featured || false,
            order: projects.length
        };
        
        projects.push(newProject);
        this.saveAll(projects);
        return newProject;
    },
    
    // Update project
    update(id, updates) {
        const projects = this.getAll();
        const index = projects.findIndex(p => p.id === id);
        if (index !== -1) {
            projects[index] = { ...projects[index], ...updates };
            this.saveAll(projects);
            return true;
        }
        return false;
    },
    
    // Delete project
    delete(id) {
        const projects = this.getAll().filter(p => p.id !== id);
        this.saveAll(projects);
        return true;
    },
    
    // Get featured projects
    getFeatured() {
        return this.getAll().filter(p => p.featured);
    },
    
    // Update portfolio page HTML
    updatePortfolioPage() {
        // This would update the actual portfolio page
        // For now, just log
        console.log('Portfolio updated');
    },
    
    // Export to JSON
    export() {
        return JSON.stringify(this.getAll(), null, 2);
    },
    
    // Import from JSON
    import(jsonData) {
        try {
            const projects = JSON.parse(jsonData);
            if (Array.isArray(projects)) {
                this.saveAll(projects);
                return true;
            }
        } catch (e) {
            console.error('Invalid JSON');
        }
        return false;
    }
};

// Make available globally
window.PortfolioManager = PortfolioManager;