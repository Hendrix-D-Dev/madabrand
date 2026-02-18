// ==================== ENHANCED ADMIN SYSTEM ====================
const ADMIN_CODE = "MADA2024"; // Change this to your secret code
let currentTheme = null;
let portfolioItems = [];

// API Base URL - adjust for production
const API_BASE = '/api';

// Helper for authenticated API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${ADMIN_CODE}`,
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Call failed:', error);
        showNotification('Failed to connect to server', 'error');
        return null;
    }
}

// Load data from server on startup
async function loadServerData() {
    try {
        // Load settings
        const settings = await apiCall('/settings');
        if (settings) {
            if (settings.theme) {
                currentTheme = settings.theme;
                applyTheme();
            }
            if (settings.site) {
                document.title = settings.site.title + ' | Premium Design Studio';
                const titleElements = document.querySelectorAll('[data-site-title]');
                titleElements.forEach(el => el.textContent = settings.site.title);
                
                const taglineElements = document.querySelectorAll('[data-site-tagline]');
                taglineElements.forEach(el => el.textContent = settings.site.tagline);
            }
        }
        
        // Load portfolio
        const portfolio = await apiCall('/portfolio');
        if (portfolio && portfolio.projects) {
            portfolioItems = portfolio.projects;
        }
        
        // Load content
        const content = await apiCall('/content');
        if (content) {
            updatePageContent(content);
        }
        
    } catch (error) {
        console.error('Failed to load server data:', error);
    }
}

// Update page content from API
function updatePageContent(content) {
    // Update contact info if on contact page
    if (window.location.pathname.includes('contact')) {
        if (content.global?.email) {
            const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
            emailLinks.forEach(link => {
                link.href = `mailto:${content.global.email}`;
                link.textContent = content.global.email;
            });
        }
        
        if (content.global?.phone) {
            const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
            phoneLinks.forEach(link => {
                link.href = `tel:${content.global.phone}`;
                link.textContent = content.global.phone;
            });
        }
    }
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', async function() {
    // Load server data first
    await loadServerData();
    
    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('animate-slide-up');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!mobileMenu.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
    
    // Form validation for contact page
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (validateForm()) {
                // Submit to API or email service
                const formData = new FormData(this);
                const data = Object.fromEntries(formData);
                
                try {
                    // Here you could send to your API or a service like Formspree
                    showNotification('Thank you for your message! We\'ll get back to you soon.', 'success');
                    contactForm.reset();
                } catch (error) {
                    showNotification('Failed to send message. Please try again.', 'error');
                }
            }
        });
    }
    
    // Portfolio filtering
    const filterButtons = document.querySelectorAll('.portfolio-filter');
    const portfolioItemsElements = document.querySelectorAll('.portfolio-item');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('bg-blue-900', 'text-white'));
                filterButtons.forEach(btn => btn.classList.add('bg-blue-100', 'text-blue-700'));
                
                // Add active class to clicked button
                this.classList.remove('bg-blue-100', 'text-blue-700');
                this.classList.add('bg-blue-900', 'text-white');
                
                const filterValue = this.getAttribute('data-filter');
                
                // Filter portfolio items
                portfolioItemsElements.forEach(item => {
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.classList.remove('hidden');
                        item.classList.add('animate-fade-in');
                    } else {
                        item.classList.add('hidden');
                    }
                });
            });
        });
    }
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Load saved data (fallback)
    loadSavedData();
    
    // Initialize admin system
    initAdminSystem();
});

// Form validation function
function validateForm() {
    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');
    let isValid = true;
    
    // Reset error states
    [name, email, message].forEach(field => {
        field.classList.remove('border-red-500');
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('text-red-500')) {
            errorElement.remove();
        }
    });
    
    // Validate name
    if (!name.value.trim()) {
        showError(name, 'Name is required');
        isValid = false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim()) {
        showError(email, 'Email is required');
        isValid = false;
    } else if (!emailRegex.test(email.value)) {
        showError(email, 'Please enter a valid email');
        isValid = false;
    }
    
    // Validate message
    if (!message.value.trim()) {
        showError(message, 'Message is required');
        isValid = false;
    } else if (message.value.trim().length < 10) {
        showError(message, 'Message must be at least 10 characters');
        isValid = false;
    }
    
    return isValid;
}

// Show error message
function showError(field, message) {
    field.classList.add('border-red-500');
    const errorElement = document.createElement('p');
    errorElement.className = 'text-red-500 text-sm mt-1';
    errorElement.textContent = message;
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

// Intersection Observer for animations
if ('IntersectionObserver' in window) {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animate-on-scroll class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

// ==================== ADMIN FUNCTIONS ====================
function initAdminSystem() {
    // Check if admin is already unlocked
    if (localStorage.getItem('adminUnlocked') === 'true') {
        unlockAdminFeatures();
    }
    
    // Admin unlock buttons
    const adminUnlockBtn = document.getElementById('admin-unlock-btn');
    const adminUnlockBtnMobile = document.getElementById('admin-unlock-btn-mobile');
    const adminModal = document.getElementById('admin-modal');
    const closeAdminModal = document.getElementById('close-admin-modal');
    const cancelAdmin = document.getElementById('cancel-admin');
    const submitAdminCode = document.getElementById('submit-admin-code');
    const adminCodeInput = document.getElementById('admin-code');
    const adminMessage = document.getElementById('admin-message');
    
    // Open modal functions
    function openAdminModal() {
        if (adminModal) {
            adminModal.classList.remove('hidden');
            adminCodeInput.focus();
        }
    }
    
    function closeAdminModalFunc() {
        if (adminModal) {
            adminModal.classList.add('hidden');
            adminCodeInput.value = '';
            adminMessage.textContent = '';
        }
    }
    
    // Event listeners
    if (adminUnlockBtn) {
        adminUnlockBtn.addEventListener('click', openAdminModal);
    }
    
    if (adminUnlockBtnMobile) {
        adminUnlockBtnMobile.addEventListener('click', openAdminModal);
    }
    
    if (closeAdminModal) {
        closeAdminModal.addEventListener('click', closeAdminModalFunc);
    }
    
    if (cancelAdmin) {
        cancelAdmin.addEventListener('click', closeAdminModalFunc);
    }
    
    // Submit admin code
    if (submitAdminCode && adminCodeInput) {
        submitAdminCode.addEventListener('click', async function() {
            const enteredCode = adminCodeInput.value.trim();
            
            if (enteredCode === ADMIN_CODE) {
                // Correct code
                localStorage.setItem('adminUnlocked', 'true');
                await unlockAdminFeatures();
                adminMessage.textContent = '✅ Admin access granted!';
                adminMessage.className = 'mt-4 text-sm text-green-600';
                
                // Close modal after 1 second
                setTimeout(() => {
                    closeAdminModalFunc();
                    const adminPanel = document.getElementById('admin-panel');
                    if (adminPanel) {
                        adminPanel.classList.remove('hidden');
                    }
                }, 1000);
            } else {
                // Wrong code
                adminMessage.textContent = '❌ Invalid admin code';
                adminMessage.className = 'mt-4 text-sm text-red-600';
                adminCodeInput.value = '';
                adminCodeInput.focus();
            }
        });
        
        // Allow Enter key submission
        adminCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                submitAdminCode.click();
            }
        });
    }
    
    // Add admin keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+A to toggle admin panel
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel && localStorage.getItem('adminUnlocked') === 'true') {
                adminPanel.classList.toggle('hidden');
            } else {
                openAdminModal();
            }
        }
        
        // Ctrl+Shift+L to lock admin
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            lockAdminFeatures();
        }
    });
}

// Load saved data (fallback for when API fails)
function loadSavedData() {
    // Load saved theme
    const savedTheme = localStorage.getItem('madabrandTheme');
    if (savedTheme && !currentTheme) {
        currentTheme = JSON.parse(savedTheme);
        applyTheme();
    }
    
    // Load saved portfolio items
    const savedPortfolio = localStorage.getItem('madabrandPortfolio');
    if (savedPortfolio && portfolioItems.length === 0) {
        portfolioItems = JSON.parse(savedPortfolio);
    }
    
    // Load saved content
    const savedTitle = localStorage.getItem('madabrandSiteTitle');
    const savedTagline = localStorage.getItem('madabrandSiteTagline');
    
    if (savedTitle) {
        document.title = savedTitle + ' | Premium Design Studio';
        const siteTitleElements = document.querySelectorAll('[data-site-title]');
        siteTitleElements.forEach(el => el.textContent = savedTitle);
    }
    
    if (savedTagline) {
        const taglineElements = document.querySelectorAll('[data-site-tagline]');
        taglineElements.forEach(el => el.textContent = savedTagline);
    }
}

// Enhanced unlock admin features
async function unlockAdminFeatures() {
    console.log('🔓 Admin features unlocked');
    
    // Reload fresh data from server
    await loadServerData();
    
    // Show admin panel if it exists
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.remove('hidden');
        updateAdminPanel();
    }
    
    // Add admin indicators to page
    addAdminIndicators();
    
    // Show notification
    showNotification('Admin features unlocked!', 'success');
}

// Lock admin features
function lockAdminFeatures() {
    localStorage.removeItem('adminUnlocked');
    
    // Hide admin panel
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.add('hidden');
    }
    
    // Remove admin indicators
    removeAdminIndicators();
    
    // Show notification
    showNotification('Admin features locked', 'info');
    
    console.log('🔒 Admin features locked');
}

// Enhanced admin panel
function updateAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (!adminPanel) return;
    
    adminPanel.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h4 class="font-bold text-lg text-blue-900">👑 Admin Panel</h4>
            <button id="close-admin-panel" class="text-gray-400 hover:text-gray-600">
                ✕
            </button>
        </div>
        <div class="space-y-3">
            <button onclick="openThemeEditor()" class="w-full bg-blue-50 text-blue-900 py-3 rounded-lg hover:bg-blue-100 transition border border-blue-200 flex items-center justify-center gap-2">
                <span>🎨</span>
                <span>Edit Theme</span>
            </button>
            <button onclick="openPortfolioManager()" class="w-full bg-blue-50 text-blue-900 py-3 rounded-lg hover:bg-blue-100 transition border border-blue-200 flex items-center justify-center gap-2">
                <span>📁</span>
                <span>Manage Portfolio</span>
            </button>
            <button onclick="openContentEditor()" class="w-full bg-blue-50 text-blue-900 py-3 rounded-lg hover:bg-blue-100 transition border border-blue-200 flex items-center justify-center gap-2">
                <span>✏️</span>
                <span>Edit Content</span>
            </button>
            <button onclick="openSettings()" class="w-full bg-blue-50 text-blue-900 py-3 rounded-lg hover:bg-blue-100 transition border border-blue-200 flex items-center justify-center gap-2">
                <span>⚙️</span>
                <span>Site Settings</span>
            </button>
            <div class="border-t border-blue-200 pt-3 space-y-2">
                <button onclick="exportData()" class="w-full bg-green-50 text-green-700 py-2 rounded-lg hover:bg-green-100 transition border border-green-200 flex items-center justify-center gap-2">
                    <span>💾</span>
                    <span>Export Data</span>
                </button>
                <button onclick="importData()" class="w-full bg-yellow-50 text-yellow-700 py-2 rounded-lg hover:bg-yellow-100 transition border border-yellow-200 flex items-center justify-center gap-2">
                    <span>📥</span>
                    <span>Import Data</span>
                </button>
                <button onclick="lockAdminFeatures()" class="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition border border-red-200 flex items-center justify-center gap-2">
                    <span>🔒</span>
                    <span>Lock Panel</span>
                </button>
            </div>
        </div>
    `;
    
    // Close panel button
    const closeBtn = document.getElementById('close-admin-panel');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            adminPanel.classList.add('hidden');
        });
    }
}

// Open settings
function openSettings() {
    closeModal();
    const modal = createModal('⚙️ Site Settings', 'large');
    
    modal.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Site Title</label>
                <input type="text" id="site-title-settings" value="${document.title.replace(' | Premium Design Studio', '')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Site Tagline</label>
                <input type="text" id="site-tagline-settings" value="${document.querySelector('[data-site-tagline]')?.textContent || 'Premium Design Studio'}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
                <textarea id="site-description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg">Premium brand design, logo design, and graphic design services in Lagos, Nigeria</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                    <input type="text" id="whatsapp-number" value="2348104902357" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input type="text" id="phone-number" value="08104902357" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            <div class="flex justify-end space-x-3 pt-4 border-t">
                <button onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                    Cancel
                </button>
                <button onclick="saveSettings()" class="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition">
                    Save Settings
                </button>
            </div>
        </div>
    `;
}

// Save settings to API
async function saveSettings() {
    const settings = {
        site: {
            title: document.getElementById('site-title-settings').value.trim(),
            tagline: document.getElementById('site-tagline-settings').value.trim(),
            description: document.getElementById('site-description').value.trim()
        },
        integrations: {
            whatsapp: document.getElementById('whatsapp-number').value.trim(),
            phone: document.getElementById('phone-number').value.trim()
        }
    };
    
    const result = await apiCall('/settings', 'POST', settings);
    
    if (result && result.success) {
        // Trigger rebuild
        await apiCall('/rebuild', 'POST');
        
        showNotification('Settings saved! Page will refresh...', 'success');
        setTimeout(() => location.reload(), 1500);
    } else {
        showNotification('Failed to save settings', 'error');
    }
    
    closeModal();
}

// THEME EDITOR
function openThemeEditor() {
    closeModal(); // Close any existing modal
    
    // Default theme values
    const defaultTheme = {
        primaryColor: '#1e3a8a', // blue-900
        secondaryColor: '#3b82f6', // blue-500
        accentColor: '#1e40af', // blue-800
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        headingColor: '#1e3a8a',
        fontFamily: 'Inter, Lato, sans-serif'
    };
    
    // Use saved theme or defaults
    const theme = currentTheme || defaultTheme;
    
    const modal = createModal('🎨 Theme Editor', 'large');
    modal.innerHTML += `
        <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <div class="flex gap-2">
                        <input type="color" id="primary-color" value="${theme.primaryColor}" class="w-12 h-10 rounded cursor-pointer flex-shrink-0">
                        <input type="text" id="primary-color-text" value="${theme.primaryColor}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                    <div class="flex gap-2">
                        <input type="color" id="secondary-color" value="${theme.secondaryColor}" class="w-12 h-10 rounded cursor-pointer flex-shrink-0">
                        <input type="text" id="secondary-color-text" value="${theme.secondaryColor}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                    <div class="flex gap-2">
                        <input type="color" id="bg-color" value="${theme.backgroundColor}" class="w-12 h-10 rounded cursor-pointer flex-shrink-0">
                        <input type="text" id="bg-color-text" value="${theme.backgroundColor}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                    <div class="flex gap-2">
                        <input type="color" id="text-color" value="${theme.textColor}" class="w-12 h-10 rounded cursor-pointer flex-shrink-0">
                        <input type="text" id="text-color-text" value="${theme.textColor}" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm">
                    </div>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                <select id="font-family" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="Inter, Lato, sans-serif" ${theme.fontFamily.includes('Inter') ? 'selected' : ''}>Inter (Current)</option>
                    <option value="Poppins, Montserrat, sans-serif" ${theme.fontFamily.includes('Poppins') ? 'selected' : ''}>Poppins</option>
                    <option value="'Helvetica Neue', Arial, sans-serif" ${theme.fontFamily.includes('Helvetica') ? 'selected' : ''}>Helvetica</option>
                    <option value="Georgia, serif" ${theme.fontFamily.includes('Georgia') ? 'selected' : ''}>Georgia</option>
                    <option value="'Courier New', monospace" ${theme.fontFamily.includes('Courier') ? 'selected' : ''}>Courier New</option>
                </select>
            </div>
            
            <div class="p-4 bg-gray-50 rounded-lg border">
                <h4 class="font-medium text-gray-700 mb-2">Live Preview</h4>
                <div id="theme-preview" class="p-4 rounded border bg-white" style="background: ${theme.backgroundColor}; color: ${theme.textColor}; font-family: ${theme.fontFamily}">
                    <h3 class="text-xl font-bold mb-2" style="color: ${theme.headingColor}">Sample Heading</h3>
                    <p class="mb-4">This is how your text will look with the selected theme. The quick brown fox jumps over the lazy dog.</p>
                    <div class="flex gap-2">
                        <button class="px-4 py-2 rounded text-white" style="background: ${theme.primaryColor}">Primary Button</button>
                        <button class="px-4 py-2 rounded border" style="border-color: ${theme.secondaryColor}; color: ${theme.secondaryColor}">Secondary Button</button>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-between pt-4 border-t">
                <button onclick="resetTheme()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                    Reset to Default
                </button>
                <div class="flex gap-3">
                    <button onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                        Cancel
                    </button>
                    <button onclick="saveTheme()" class="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition">
                        Save Theme
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add real-time preview and sync between color inputs
    ['primary', 'secondary', 'bg', 'text'].forEach(type => {
        const colorInput = document.getElementById(`${type}-color`);
        const textInput = document.getElementById(`${type}-color-text`);
        
        colorInput.addEventListener('input', function() {
            textInput.value = this.value;
            updateThemePreview();
        });
        
        textInput.addEventListener('input', function() {
            if (this.value.match(/^#[0-9A-F]{6}$/i)) {
                colorInput.value = this.value;
                updateThemePreview();
            }
        });
    });
    
    document.getElementById('font-family').addEventListener('change', updateThemePreview);
}

function updateThemePreview() {
    const preview = document.getElementById('theme-preview');
    if (!preview) return;
    
    const theme = {
        primaryColor: document.getElementById('primary-color').value,
        secondaryColor: document.getElementById('secondary-color').value,
        backgroundColor: document.getElementById('bg-color').value,
        textColor: document.getElementById('text-color').value,
        headingColor: document.getElementById('primary-color').value,
        fontFamily: document.getElementById('font-family').value
    };
    
    preview.style.background = theme.backgroundColor;
    preview.style.color = theme.textColor;
    preview.style.fontFamily = theme.fontFamily;
    preview.querySelector('h3').style.color = theme.headingColor;
    preview.querySelector('button').style.background = theme.primaryColor;
    preview.querySelectorAll('button')[1].style.borderColor = theme.secondaryColor;
    preview.querySelectorAll('button')[1].style.color = theme.secondaryColor;
}

function resetTheme() {
    currentTheme = null;
    localStorage.removeItem('madabrandTheme');
    
    // Remove custom theme styles
    const customStyle = document.getElementById('custom-theme-style');
    if (customStyle) customStyle.remove();
    
    closeModal();
    showNotification('Theme reset to default', 'success');
}

async function saveTheme() {
    currentTheme = {
        primaryColor: document.getElementById('primary-color').value,
        secondaryColor: document.getElementById('secondary-color').value,
        accentColor: document.getElementById('primary-color').value.replace(/../, c => (parseInt(c, 16) * 0.8).toString(16).padStart(2, '0')),
        backgroundColor: document.getElementById('bg-color').value,
        textColor: document.getElementById('text-color').value,
        headingColor: document.getElementById('primary-color').value,
        fontFamily: document.getElementById('font-family').value
    };
    
    // Save to API
    const result = await apiCall('/settings', 'POST', { theme: currentTheme });
    
    if (result && result.success) {
        localStorage.setItem('madabrandTheme', JSON.stringify(currentTheme));
        applyTheme();
        
        // Trigger rebuild
        await apiCall('/rebuild', 'POST');
        
        closeModal();
        showNotification('Theme saved successfully!', 'success');
    } else {
        showNotification('Failed to save theme', 'error');
    }
}

function applyTheme() {
    if (!currentTheme) return;
    
    // Remove existing custom theme
    const existingStyle = document.getElementById('custom-theme-style');
    if (existingStyle) existingStyle.remove();
    
    const style = document.createElement('style');
    style.id = 'custom-theme-style';
    style.textContent = `
        :root {
            --primary-color: ${currentTheme.primaryColor};
            --secondary-color: ${currentTheme.secondaryColor};
            --bg-color: ${currentTheme.backgroundColor};
            --text-color: ${currentTheme.textColor};
        }
        
        body {
            background-color: var(--bg-color) !important;
            color: var(--text-color) !important;
            font-family: ${currentTheme.fontFamily} !important;
        }
        
        .bg-blue-900, .bg-blue-700, button.bg-blue-900, a.bg-blue-900 {
            background-color: var(--primary-color) !important;
        }
        
        .bg-blue-900:hover, .bg-blue-700:hover {
            background-color: ${currentTheme.accentColor} !important;
        }
        
        .text-blue-900, h1.text-blue-900, h2.text-blue-900, h3.text-blue-900 {
            color: var(--primary-color) !important;
        }
        
        .border-blue-900, .border-blue-200 {
            border-color: var(--primary-color) !important;
        }
        
        .bg-blue-50 {
            background-color: color-mix(in srgb, var(--primary-color) 10%, white) !important;
        }
        
        .border-blue-100 {
            border-color: color-mix(in srgb, var(--primary-color) 20%, white) !important;
        }
    `;
    
    document.head.appendChild(style);
}

// PORTFOLIO MANAGER
function openPortfolioManager() {
    closeModal();
    
    const modal = createModal('📁 Portfolio Manager', 'extra-large');
    
    modal.innerHTML += `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-medium text-gray-900">Manage Portfolio Projects</h3>
                    <p class="text-sm text-gray-600">${portfolioItems.length} project${portfolioItems.length !== 1 ? 's' : ''} saved</p>
                </div>
                <button onclick="openAddPortfolioItem()" class="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition flex items-center gap-2">
                    <span>+</span>
                    <span>Add New Project</span>
                </button>
            </div>
            
            <div id="portfolio-items-list" class="space-y-3 max-h-96 overflow-y-auto pr-2">
                ${portfolioItems.length > 0 ? portfolioItems.map((item, index) => `
                    <div class="p-4 border rounded-lg hover:bg-gray-50 group relative">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900">${item.title || 'Untitled Project'}</h4>
                                <p class="text-sm text-gray-600 mt-1">${item.category || 'branding'} • ${item.date || 'No date'}</p>
                                <p class="text-sm text-gray-500 mt-2 line-clamp-2">${item.description || 'No description'}</p>
                            </div>
                            <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button onclick="editPortfolioItem(${index})" class="text-blue-600 hover:text-blue-800 p-1" title="Edit">
                                    ✏️
                                </button>
                                <button onclick="deletePortfolioItem(${item.id || index})" class="text-red-600 hover:text-red-800 p-1" title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="text-center py-12">
                        <div class="text-4xl mb-4">📂</div>
                        <h4 class="text-lg font-medium text-gray-700 mb-2">No projects yet</h4>
                        <p class="text-gray-500">Add your first portfolio project to get started</p>
                    </div>
                `}
            </div>
            
            ${portfolioItems.length > 0 ? `
                <div class="flex justify-between items-center pt-4 border-t">
                    <span class="text-sm text-gray-600">Projects will appear on your portfolio page</span>
                    <button onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                        Close
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

function openAddPortfolioItem(editIndex = null) {
    const isEdit = editIndex !== null;
    const item = isEdit ? portfolioItems[editIndex] : {
        id: Date.now(),
        title: '',
        category: 'branding',
        description: '',
        images: [],
        date: new Date().toISOString().split('T')[0],
        link: '#'
    };
    
    closeModal();
    const modal = createModal(isEdit ? '✏️ Edit Project' : '➕ Add Project', 'large');
    
    modal.innerHTML += `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Project Title *</label>
                <input type="text" id="portfolio-title" value="${item.title}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., NuelArk Construction Company">
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select id="portfolio-category" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="branding" ${item.category === 'branding' ? 'selected' : ''}>Brand Identity</option>
                        <option value="logo" ${item.category === 'logo' ? 'selected' : ''}>Logo Design</option>
                        <option value="graphic" ${item.category === 'graphic' ? 'selected' : ''}>Graphic Design</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Project Date</label>
                    <input type="date" id="portfolio-date" value="${item.date}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea id="portfolio-description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Describe the project...">${item.description}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Image URL</label>
                <input type="text" id="portfolio-image" value="${item.images && item.images[0] || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="/assets/images/photo_1.jpg">
                <p class="text-xs text-gray-500 mt-1">Path to your image file in the assets folder</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Project Link</label>
                <input type="text" id="portfolio-link" value="${item.link}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="#case-study">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Client (Optional)</label>
                <input type="text" id="portfolio-client" value="${item.client || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., NuelArk Construction">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Industry (Optional)</label>
                <input type="text" id="portfolio-industry" value="${item.industry || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Construction, Technology">
            </div>
            
            <div class="flex items-center">
                <input type="checkbox" id="portfolio-featured" ${item.featured ? 'checked' : ''} class="w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900">
                <label for="portfolio-featured" class="ml-2 text-sm text-gray-700">Feature this project</label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t">
                <button onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                    Cancel
                </button>
                <button onclick="savePortfolioItem(${isEdit ? JSON.stringify(item.id) : 'null'})" class="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition">
                    ${isEdit ? 'Update' : 'Save'} Project
                </button>
            </div>
        </div>
    `;
}

async function savePortfolioItem(editId = null) {
    const item = {
        title: document.getElementById('portfolio-title').value.trim(),
        category: document.getElementById('portfolio-category').value,
        description: document.getElementById('portfolio-description').value.trim(),
        images: document.getElementById('portfolio-image').value.trim() ? [document.getElementById('portfolio-image').value.trim()] : [],
        date: document.getElementById('portfolio-date').value,
        link: document.getElementById('portfolio-link').value.trim() || '#',
        client: document.getElementById('portfolio-client').value.trim(),
        industry: document.getElementById('portfolio-industry').value.trim(),
        featured: document.getElementById('portfolio-featured').checked
    };
    
    if (!item.title) {
        showNotification('Project title is required', 'error');
        document.getElementById('portfolio-title').focus();
        return;
    }
    
    if (!item.description) {
        showNotification('Project description is required', 'error');
        document.getElementById('portfolio-description').focus();
        return;
    }
    
    let result;
    if (editId) {
        // Update existing project
        item.id = editId;
        result = await apiCall('/portfolio', 'PUT', item);
    } else {
        // Add new project
        result = await apiCall('/portfolio', 'POST', item);
    }
    
    if (result && result.success) {
        // Trigger rebuild
        await apiCall('/rebuild', 'POST');
        
        showNotification(`Project ${editId ? 'updated' : 'added'} successfully!`, 'success');
        
        // Reload portfolio data
        const portfolio = await apiCall('/portfolio');
        if (portfolio && portfolio.projects) {
            portfolioItems = portfolio.projects;
        }
        
        closeModal();
        setTimeout(() => openPortfolioManager(), 300);
    } else {
        showNotification(`Failed to ${editId ? 'update' : 'add'} project`, 'error');
    }
}

function editPortfolioItem(index) {
    openAddPortfolioItem(index);
}

async function deletePortfolioItem(id) {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        const result = await apiCall(`/portfolio?id=${id}`, 'DELETE');
        
        if (result && result.success) {
            // Trigger rebuild
            await apiCall('/rebuild', 'POST');
            
            // Reload portfolio data
            const portfolio = await apiCall('/portfolio');
            if (portfolio && portfolio.projects) {
                portfolioItems = portfolio.projects;
            }
            
            showNotification('Project deleted successfully!', 'success');
            openPortfolioManager();
        } else {
            showNotification('Failed to delete project', 'error');
        }
    }
}

function updatePortfolioDisplay() {
    showNotification('Portfolio data updated. Refresh page to see changes.', 'info');
}

// CONTENT EDITOR
function openContentEditor() {
    closeModal();
    
    const modal = createModal('✏️ Content Editor', 'large');
    
    modal.innerHTML += `
        <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
                <button onclick="editPageContent('home')" class="p-4 border rounded-lg hover:bg-blue-50 text-left transition group">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                        <span class="text-xl">🏠</span>
                    </div>
                    <h4 class="font-medium text-gray-900">Home Page</h4>
                    <p class="text-sm text-gray-600 mt-1">Edit hero, featured projects, services</p>
                </button>
                
                <button onclick="editPageContent('about')" class="p-4 border rounded-lg hover:bg-blue-50 text-left transition group">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                        <span class="text-xl">👤</span>
                    </div>
                    <h4 class="font-medium text-gray-900">About Page</h4>
                    <p class="text-sm text-gray-600 mt-1">Edit team info, story, values</p>
                </button>
                
                <button onclick="editPageContent('services')" class="p-4 border rounded-lg hover:bg-blue-50 text-left transition group">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                        <span class="text-xl">🎯</span>
                    </div>
                    <h4 class="font-medium text-gray-900">Services Page</h4>
                    <p class="text-sm text-gray-600 mt-1">Edit service descriptions, pricing</p>
                </button>
                
                <button onclick="editPageContent('contact')" class="p-4 border rounded-lg hover:bg-blue-50 text-left transition group">
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                        <span class="text-xl">📞</span>
                    </div>
                    <h4 class="font-medium text-gray-900">Contact Page</h4>
                    <p class="text-sm text-gray-600 mt-1">Edit contact info, form settings</p>
                </button>
            </div>
            
            <div class="border-t pt-6">
                <h4 class="font-medium text-gray-700 mb-4">Quick Text Edits</h4>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm text-gray-600 mb-2">Site Title</label>
                        <input type="text" id="site-title" value="${localStorage.getItem('madabrandSiteTitle') || document.title.replace(' | Premium Design Studio', '')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-2">Tagline</label>
                        <input type="text" id="site-tagline" value="${localStorage.getItem('madabrandSiteTagline') || document.querySelector('[data-site-tagline]')?.textContent || 'Premium Design Studio'}" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-2">Email Address</label>
                        <input type="email" id="site-email" value="macaulaymadalene@gmail.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                    <div>
                        <label class="block text-sm text-gray-600 mb-2">Phone Number</label>
                        <input type="text" id="site-phone" value="08104902357" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4 border-t">
                <button onclick="closeModal()" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                    Cancel
                </button>
                <button onclick="saveContentEdits()" class="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition">
                    Save Changes
                </button>
            </div>
        </div>
    `;
}

async function saveContentEdits() {
    const siteTitle = document.getElementById('site-title').value.trim();
    const siteTagline = document.getElementById('site-tagline').value.trim();
    const siteEmail = document.getElementById('site-email').value.trim();
    const sitePhone = document.getElementById('site-phone').value.trim();
    
    if (!siteTitle) {
        showNotification('Site title cannot be empty', 'error');
        return;
    }
    
    // Save to localStorage as backup
    localStorage.setItem('madabrandSiteTitle', siteTitle);
    localStorage.setItem('madabrandSiteTagline', siteTagline);
    
    // Save to API
    const contentData = {
        global: {
            siteTitle,
            siteTagline,
            email: siteEmail,
            phone: sitePhone
        }
    };
    
    const result = await apiCall('/content', 'POST', contentData);
    
    if (result && result.success) {
        // Trigger rebuild
        await apiCall('/rebuild', 'POST');
        
        // Update page
        document.title = siteTitle + ' | Premium Design Studio';
        
        const titleElements = document.querySelectorAll('[data-site-title]');
        titleElements.forEach(el => el.textContent = siteTitle);
        
        const taglineElements = document.querySelectorAll('[data-site-tagline]');
        taglineElements.forEach(el => el.textContent = siteTagline);
        
        closeModal();
        showNotification('Content saved successfully! Page will refresh...', 'success');
        setTimeout(() => location.reload(), 1500);
    } else {
        showNotification('Failed to save content', 'error');
    }
}

function editPageContent(page) {
    closeModal();
    
    const modal = createModal(`Editing ${page.charAt(0).toUpperCase() + page.slice(1)} Page`, 'large');
    modal.innerHTML += `
        <div class="space-y-4">
            <p class="text-gray-600">This is a preview of the content editor. In a full implementation, this would include:</p>
            <ul class="list-disc pl-5 text-gray-600 space-y-1">
                <li>WYSIWYG editor for text content</li>
                <li>Image upload and management</li>
                <li>Section reordering</li>
                <li>Live preview</li>
            </ul>
            <div class="pt-4 border-t">
                <p class="text-gray-500 text-sm">For now, use the "Quick Text Edits" in the main content editor for basic changes.</p>
            </div>
            <div class="flex justify-end pt-4">
                <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
                    Close
                </button>
            </div>
        </div>
    `;
}

// DATA IMPORT/EXPORT
async function exportData() {
    const data = {
        theme: currentTheme,
        portfolio: portfolioItems,
        settings: {
            siteTitle: localStorage.getItem('madabrandSiteTitle') || 'MadaBrand',
            siteTagline: localStorage.getItem('madabrandSiteTagline') || 'Premium Design Studio'
        },
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `madabrand-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.version || !data.exportDate) {
                    throw new Error('Invalid backup file format');
                }
                
                if (confirm('Importing data will replace your current theme, portfolio, and settings. Continue?')) {
                    // Import theme via API
                    if (data.theme) {
                        await apiCall('/settings', 'POST', { theme: data.theme });
                    }
                    
                    // Import portfolio via API
                    if (data.portfolio) {
                        for (const project of data.portfolio) {
                            await apiCall('/portfolio', 'POST', project);
                        }
                    }
                    
                    // Import settings via API
                    if (data.settings) {
                        await apiCall('/settings', 'POST', { site: data.settings });
                    }
                    
                    // Trigger rebuild
                    await apiCall('/rebuild', 'POST');
                    
                    showNotification('Data imported successfully! Page will refresh...', 'success');
                    setTimeout(() => location.reload(), 1500);
                }
                
            } catch (error) {
                showNotification('Error importing data: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// UTILITY FUNCTIONS
function createModal(title, size = 'medium') {
    closeModal(); // Close any existing modal
    
    const modal = document.createElement('div');
    modal.id = 'custom-modal-overlay';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl ${size === 'large' ? 'w-full max-w-2xl' : size === 'extra-large' ? 'w-full max-w-4xl' : 'w-full max-w-md'} max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
                <h3 class="text-xl font-bold text-gray-900">${title}</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                    ×
                </button>
            </div>
            <div class="p-6">
                <!-- Content will be inserted here -->
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    return modal.querySelector('.p-6');
}

function closeModal() {
    const modal = document.getElementById('custom-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.custom-notification');
    if (existing) existing.remove();
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    const notification = document.createElement('div');
    notification.className = `custom-notification fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-[100] transform transition-all duration-300 translate-x-full ${
        type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
        type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
        type === 'warning' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
        'bg-blue-100 text-blue-800 border border-blue-200'
    }`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-lg">${icons[type] || 'ℹ️'}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add admin indicators
function addAdminIndicators() {
    // Add admin badge to logo
    const logo = document.querySelector('nav a[href="/"]');
    if (logo && !logo.querySelector('.admin-indicator')) {
        const adminBadge = document.createElement('span');
        adminBadge.className = 'admin-indicator absolute -top-1 -right-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full animate-pulse-gentle';
        adminBadge.textContent = 'ADMIN';
        adminBadge.style.fontSize = '10px';
        adminBadge.style.zIndex = '10';
        logo.style.position = 'relative';
        logo.appendChild(adminBadge);
    }
    
    // Add edit buttons to portfolio items on portfolio page
    if (window.location.pathname.includes('portfolio')) {
        document.querySelectorAll('.portfolio-item').forEach((item, index) => {
            if (!item.querySelector('.portfolio-edit-btn')) {
                const editBtn = document.createElement('button');
                editBtn.className = 'portfolio-edit-btn absolute top-4 right-4 bg-blue-900/20 text-blue-900 text-xs px-3 py-1 rounded-lg hover:bg-blue-900/30 transition opacity-0 group-hover:opacity-100 z-10';
                editBtn.innerHTML = '✏️ Edit';
                editBtn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    openAddPortfolioItem(index);
                };
                
                item.classList.add('group', 'relative');
                item.style.position = 'relative';
                item.appendChild(editBtn);
            }
        });
    }
}

// Remove admin indicators
function removeAdminIndicators() {
    // Remove admin badge
    const adminBadge = document.querySelector('.admin-indicator');
    if (adminBadge) {
        adminBadge.remove();
    }
    
    // Remove edit buttons
    document.querySelectorAll('.portfolio-edit-btn').forEach(btn => {
        btn.remove();
    });
}