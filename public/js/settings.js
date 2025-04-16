document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication first
    const isAuthorized = await authGuard.guardRoute();
    if (!isAuthorized) return;

    // Add authorization header to all fetch requests
    const token = localStorage.getItem('authToken');
    const fetchWithAuth = (url, options = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    };

    // Load user data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user) {
        document.getElementById('name').value = user.name || '';
        document.getElementById('email').value = user.email || '';
    }

    // Handle profile form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const response = await fetchWithAuth('/api/v1/users/profile', {
                    method: 'PUT',
                    body: JSON.stringify({
                        name: document.getElementById('name').value
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('user', JSON.stringify(data.user));
                    showNotification('Profile updated successfully', 'success');
                } else {
                    throw new Error('Failed to update profile');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showNotification('Failed to update profile', 'error');
            }
        });
    }

    // Handle password form submission
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }

            try {
                const response = await fetchWithAuth('/api/v1/users/password', {
                    method: 'PUT',
                    body: JSON.stringify({
                        currentPassword: document.getElementById('currentPassword').value,
                        newPassword: newPassword
                    })
                });

                if (response.ok) {
                    showNotification('Password updated successfully', 'success');
                    passwordForm.reset();
                } else {
                    throw new Error('Failed to update password');
                }
            } catch (error) {
                console.error('Error updating password:', error);
                showNotification('Failed to update password', 'error');
            }
        });
    }

    // Handle preferences form submission
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        // Set initial language value
        const languageSelect = document.getElementById('language');
        if (languageSelect) {
            languageSelect.value = localStorage.getItem('preferred_language') || 'en';
        }

        preferencesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const language = document.getElementById('language').value;
            localStorage.setItem('preferred_language', language);
            
            // Dispatch language change event
            document.dispatchEvent(new Event('languageChanged'));
            
            showNotification('Preferences saved successfully', 'success');
        });
    }

    // Handle theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const sunIcon = themeToggle.querySelector('.fa-sun');
        const moonIcon = themeToggle.querySelector('.fa-moon');
        const isDarkMode = document.documentElement.classList.contains('dark');

        // Set initial state
        if (isDarkMode) {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }

        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            sunIcon.classList.toggle('hidden');
            moonIcon.classList.toggle('hidden');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        });
    }

    // Helper function to show notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${
            type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 
            'bg-blue-500'
        } transition-opacity duration-500 z-50`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
});
