// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
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
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateForm()) {
                // In production, replace with actual form submission
                alert('Thank you for your message! We\'ll get back to you soon.');
                contactForm.reset();
            }
        });
    }
    
    // Portfolio filtering
    const filterButtons = document.querySelectorAll('.portfolio-filter');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('bg-deep-blue', 'text-white'));
                filterButtons.forEach(btn => btn.classList.add('bg-gray-200', 'text-gray-700'));
                
                // Add active class to clicked button
                this.classList.remove('bg-gray-200', 'text-gray-700');
                this.classList.add('bg-deep-blue', 'text-white');
                
                const filterValue = this.getAttribute('data-filter');
                
                // Filter portfolio items
                portfolioItems.forEach(item => {
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

// ==================== ADMIN SYSTEM ====================
const ADMIN_CODE = "MADA2024"; // Change this to your secret code

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
    const lockAdminBtn = document.getElementById('lock-admin');
    const adminPanel = document.getElementById('admin-panel');
    
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
        submitAdminCode.addEventListener('click', function() {
            const enteredCode = adminCodeInput.value.trim();
            
            if (enteredCode === ADMIN_CODE) {
                // Correct code
                localStorage.setItem('adminUnlocked', 'true');
                unlockAdminFeatures();
                adminMessage.textContent = '✅ Admin access granted!';
                adminMessage.className = 'mt-4 text-sm text-green-600';
                
                // Close modal after 1 second
                setTimeout(() => {
                    closeAdminModalFunc();
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
    
    // Lock admin panel
    if (lockAdminBtn) {
        lockAdminBtn.addEventListener('click', function() {
            localStorage.removeItem('adminUnlocked');
            lockAdminFeatures();
            if (adminPanel) {
                adminPanel.classList.add('hidden');
            }
        });
    }
    
    // Add admin keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+Shift+A to toggle admin panel
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {
                adminPanel.classList.toggle('hidden');
            }
        }
        
        // Ctrl+Shift+L to lock admin
        if (e.ctrlKey && e.shiftKey && e.key === 'L') {
            e.preventDefault();
            localStorage.removeItem('adminUnlocked');
            lockAdminFeatures();
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel) {
                adminPanel.classList.add('hidden');
            }
        }
    });
}

// Unlock admin features
function unlockAdminFeatures() {
    console.log('🔓 Admin features unlocked');
    
    // Show admin panel if it exists
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.remove('hidden');
    }
    
    // Add admin indicators to page
    addAdminIndicators();
}

// Lock admin features
function lockAdminFeatures() {
    console.log('🔒 Admin features locked');
    
    // Hide admin panel
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.add('hidden');
    }
    
    // Remove admin indicators
    removeAdminIndicators();
}

// Add visual indicators for admin mode
function addAdminIndicators() {
    // Add admin badge to logo
    const logo = document.querySelector('a[href*="index.html"]');
    if (logo && !logo.querySelector('.admin-badge')) {
        const adminBadge = document.createElement('span');
        adminBadge.className = 'admin-badge ml-2 text-xs bg-gold text-black px-2 py-1 rounded-full';
        adminBadge.textContent = 'ADMIN';
        logo.appendChild(adminBadge);
    }
    
    // Add edit buttons to sections
    document.querySelectorAll('section').forEach((section, index) => {
        if (!section.id) {
            section.id = `section-${index}`;
        }
        
        // Check if edit button already exists
        if (!section.querySelector('.section-edit-btn')) {
            const editBtn = document.createElement('button');
            editBtn.className = 'section-edit-btn absolute top-4 right-4 bg-deep-blue/20 text-deep-blue text-xs px-3 py-1 rounded-lg hover:bg-deep-blue/30 transition opacity-0 group-hover:opacity-100';
            editBtn.innerHTML = '✏️ Edit';
            editBtn.onclick = () => editSection(section.id);
            
            section.classList.add('group', 'relative');
            section.appendChild(editBtn);
        }
    });
}

// Remove admin indicators
function removeAdminIndicators() {
    // Remove admin badge
    const adminBadge = document.querySelector('.admin-badge');
    if (adminBadge) {
        adminBadge.remove();
    }
    
    // Remove edit buttons
    document.querySelectorAll('.section-edit-btn').forEach(btn => {
        btn.remove();
    });
}

// Edit section function
function editSection(sectionId) {
    console.log(`Editing section: ${sectionId}`);
    // In a real implementation, this would open a content editor
    alert(`Edit mode for section: ${sectionId}\n\nIn a production environment, this would open a content management interface.`);
}