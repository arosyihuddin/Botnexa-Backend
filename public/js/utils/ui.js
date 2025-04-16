// Shared UI utilities
export const ui = {
    showNotification: (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
            type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
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

// API utilities
export const api = {
    token: localStorage.getItem('authToken'),

    async fetch(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || 'API request failed');
            }
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};

// Form utilities
export const forms = {
    validate(form) {
        const errors = [];
        form.querySelectorAll('input[required], select[required], textarea[required]').forEach(field => {
            if (!field.value.trim()) {
                errors.push(`${field.name || field.id} is required`);
                field.classList.add('input-error');
            }
        });
        return errors;
    },

    clearErrors(form) {
        form.querySelectorAll('.input-error').forEach(field => {
            field.classList.remove('input-error');
        });
    },

    setupValidation(form) {
        form.querySelectorAll('input, select, textarea').forEach(field => {
            field.addEventListener('input', () => {
                field.classList.remove('input-error');
            });
        });
    }
};

// Navigation utilities
export const navigation = {
    setupTabNavigation(containerSelector, buttonSelector, contentSelector, activeClass = 'active') {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const showTab = (tabId) => {
            container.querySelectorAll(contentSelector).forEach(content => {
                content.classList.add('hidden');
            });
            container.querySelectorAll(buttonSelector).forEach(btn => {
                btn.classList.remove(activeClass);
            });

            const selectedContent = container.querySelector(`${contentSelector}[data-tab="${tabId}"]`);
            const selectedButton = container.querySelector(`${buttonSelector}[data-tab="${tabId}"]`);

            if (selectedContent && selectedButton) {
                selectedContent.classList.remove('hidden');
                selectedButton.classList.add(activeClass);
            }
        };

        container.querySelectorAll(buttonSelector).forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.dataset.tab;
                if (tabId) showTab(tabId);
            });
        });

        // Show first tab by default
        const firstButton = container.querySelector(buttonSelector);
        if (firstButton) {
            showTab(firstButton.dataset.tab);
        }
    }
};
