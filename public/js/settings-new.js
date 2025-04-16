// Utility functions
const utils = {
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    },

    setLoading: (() => {
        let loadingCount = 0;
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        overlay.innerHTML = `
            <div class="bg-white dark:bg-dark-200 p-4 rounded-lg shadow-lg">
                <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        return (show) => {
            loadingCount = Math.max(0, show ? loadingCount + 1 : loadingCount - 1);
            overlay.classList.toggle('hidden', loadingCount === 0);
        };
    })()
};

// API functions
const api = {
    token: localStorage.getItem('authToken'),

    async fetchUserData() {
        try {
            const response = await fetch('/api/v1/users/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch user data');
            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    },

    async updateProfile(name) {
        const response = await fetch('/api/v1/users/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (!response.ok) throw new Error('Failed to update profile');
        return response.json();
    },

    async updatePassword(currentPassword, newPassword) {
        const response = await fetch('/api/v1/users/password', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) throw new Error('Failed to update password');
        return response.json();
    }
};

// Form handlers
const forms = {
    async initializeForms() {
        try {
            utils.setLoading(true);
            const userData = await api.fetchUserData();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            if (nameInput) nameInput.value = userData.name || '';
            if (emailInput) emailInput.value = userData.email || '';

            const languageSelect = document.getElementById('language');
            if (languageSelect) {
                languageSelect.value = localStorage.getItem('preferred_language') || 'en';
            }
        } catch (error) {
            utils.showNotification('Failed to load user data', 'error');
        } finally {
            utils.setLoading(false);
        }
    },

    setupFormHandlers() {
        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                utils.setLoading(true);
                
                try {
                    const name = document.getElementById('name').value.trim();
                    if (!name) throw new Error('Name is required');
                    
                    await api.updateProfile(name);
                    utils.showNotification('Profile updated successfully');
                } catch (error) {
                    utils.showNotification(error.message, 'error');
                } finally {
                    utils.setLoading(false);
                }
            });
        }

        // Password form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const currentPassword = document.getElementById('currentPassword').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (!currentPassword || !newPassword || !confirmPassword) {
                    utils.showNotification('All password fields are required', 'error');
                    return;
                }

                if (newPassword !== confirmPassword) {
                    utils.showNotification('New passwords do not match', 'error');
                    return;
                }

                utils.setLoading(true);
                try {
                    await api.updatePassword(currentPassword, newPassword);
                    passwordForm.reset();
                    utils.showNotification('Password updated successfully');
                } catch (error) {
                    utils.showNotification(error.message, 'error');
                } finally {
                    utils.setLoading(false);
                }
            });
        }

        // Preferences form
        const preferencesForm = document.getElementById('preferencesForm');
        if (preferencesForm) {
            preferencesForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const language = document.getElementById('language').value;
                    localStorage.setItem('preferred_language', language);
                    
                    document.dispatchEvent(new CustomEvent('languageChanged', { 
                        detail: { language } 
                    }));

                    utils.showNotification('Preferences saved successfully');
                } catch (error) {
                    utils.showNotification('Failed to save preferences', 'error');
                }
            });
        }
    }
};

// Navigation handler
const navigation = {
    setupNavigation() {
        const showSection = (sectionId) => {
            try {
                document.querySelectorAll('.setting-section').forEach(section => {
                    section.classList.add('hidden');
                });

                const selectedSection = document.getElementById(sectionId);
                if (!selectedSection) {
                    console.error(`Section with id '${sectionId}' not found`);
                    return;
                }
                selectedSection.classList.remove('hidden');

                document.querySelectorAll('.settings-nav-btn').forEach(btn => {
                    btn.classList.remove('bg-primary/10', 'text-primary', 'active-setting');
                });
                
                const activeButton = document.querySelector(`button[data-section="${sectionId}"]`);
                if (activeButton) {
                    activeButton.classList.add('bg-primary/10', 'text-primary', 'active-setting');
                }

                history.replaceState(null, '', `#${sectionId}`);
            } catch (error) {
                console.error('Error in showSection:', error);
            }
        };

        document.querySelectorAll('.settings-nav-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const sectionId = e.currentTarget.dataset.section;
                if (sectionId) showSection(sectionId);
            });
        });

        const initialSection = window.location.hash.slice(1) || 'general';
        showSection(initialSection);

        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1) || 'general';
            showSection(hash);
        });
    }
};

// Initialize everything
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const isAuthorized = await authGuard.guardRoute();
        if (!isAuthorized) return;

        await forms.initializeForms();
        forms.setupFormHandlers();
        navigation.setupNavigation();
    } catch (error) {
        console.error('Error initializing settings page:', error);
        utils.showNotification('Failed to initialize settings page', 'error');
    }
});
