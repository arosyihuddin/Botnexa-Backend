// User menu dropdown manager
const userMenuManager = {
    init() {
        this.menuButton = document.getElementById('userMenu');
        if (this.menuButton) {
            this.setupDropdown();
            
            // Set static user name
            const userNameSpan = document.querySelector('#userMenu span');
            if (userNameSpan) {
                userNameSpan.textContent = 'John Doe';
            }
        }
    },

    setupDropdown() {
        // Create dropdown element
        const dropdown = document.createElement('div');
        dropdown.className = 'absolute right-0 mt-2 w-48 bg-white dark:bg-dark-200 rounded-lg shadow-lg border border-gray-200 dark:border-dark-100 hidden';
        dropdown.innerHTML = `
            <div class="p-2 space-y-1">
                <div class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-100">
                    <select id="languageSelect" class="w-full bg-transparent outline-none">
                        <option value="en">English</option>
                        <option value="id">Indonesia</option>
                    </select>
                </div>
                <button id="themeToggle" class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-100 rounded">
                    <i class="fas fa-sun text-yellow-500"></i>
                    <i class="fas fa-moon text-blue-500 hidden"></i>
                    <span>Toggle Theme</span>
                </button>
                <button class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-100 rounded">
                    <i class="fas fa-user"></i>
                    <span>Profile</span>
                </button>
                <button id="logoutBtn" class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-100 rounded">
                    <i class="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </div>
        `;

        // Add dropdown to DOM
        this.menuButton.parentNode.appendChild(dropdown);

        // Toggle dropdown
        this.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        // Setup logout handler
        const logoutBtn = dropdown.querySelector('#logoutBtn');
        logoutBtn.addEventListener('click', () => {
            authGuard.logout();
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.add('hidden');
        });

        // Prevent dropdown from closing when clicking inside
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Initialize theme toggle
        const themeToggle = dropdown.querySelector('#themeToggle');
        const sunIcon = themeToggle.querySelector('.fa-sun');
        const moonIcon = themeToggle.querySelector('.fa-moon');
        
        // Function to update theme icons
        const updateThemeIcons = (isDark, lang) => {
            sunIcon.classList.toggle('hidden', isDark);
            moonIcon.classList.toggle('hidden', !isDark);
            themeToggle.querySelector('span').textContent = lang === 'id' ? 'Ganti Tema' : 'Toggle Theme';
        };

        // Get initial states
        const isDark = document.documentElement.classList.contains('dark');
        const currentLang = localStorage.getItem('preferred_language') || 'en';
        
        // Set initial theme and text
        updateThemeIcons(isDark, currentLang);

        // Add theme toggle event listener
        themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const newIsDark = document.documentElement.classList.contains('dark');
            updateThemeIcons(newIsDark, currentLang);
            localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
        });

        // Update theme text when language changes
        document.addEventListener('languageChanged', (e) => {
            const currentIsDark = document.documentElement.classList.contains('dark');
            updateThemeIcons(currentIsDark, e.detail.language);
        });

        // Language management
        const translations = {
            en: {
                dashboard: 'Dashboard',
                bots: 'Bots',
                conversations: 'Conversations',
                settings: 'Settings',
                profile: 'Profile',
                logout: 'Logout',
                toggleTheme: 'Toggle Theme'
            },
            id: {
                dashboard: 'Dasbor',
                bots: 'Bot',
                conversations: 'Percakapan',
                settings: 'Pengaturan',
                profile: 'Profil',
                logout: 'Keluar',
                toggleTheme: 'Ganti Tema'
            }
        };

        // Initialize language selector
        const languageSelect = dropdown.querySelector('#languageSelect');
        const savedLang = localStorage.getItem('preferred_language') || 'en';
        languageSelect.value = savedLang;

        // Function to update UI text
        const updateLanguage = (lang) => {
            const t = translations[lang];
            
            // Function to update all UI text
            const updateUIText = () => {
                // Update sidebar navigation
                document.querySelectorAll('nav a span').forEach(span => {
                    const key = span.textContent.toLowerCase();
                    if (t[key]) span.textContent = t[key];
                });

                // Update dropdown menu items
                dropdown.querySelectorAll('button span').forEach(span => {
                    const key = span.textContent.toLowerCase();
                    if (t[key]) span.textContent = t[key];
                });

                // Emit custom event for page-specific translations
                const event = new CustomEvent('languageChanged', { 
                    detail: { language: lang } 
                });
                document.dispatchEvent(event);
            };

            // Update UI multiple times to ensure everything is translated
            updateUIText(); // Immediate update
            setTimeout(updateUIText, 50); // Short delay
            setTimeout(updateUIText, 150); // Longer delay
        };

        // Add language change listener
        languageSelect.addEventListener('change', (e) => {
            const newLang = e.target.value;
            localStorage.setItem('preferred_language', newLang);
            
            // Update theme text immediately
            const currentIsDark = document.documentElement.classList.contains('dark');
            updateThemeIcons(currentIsDark, newLang);
            
            // Update other language content
            updateLanguage(newLang);
        });

        // Initial language update
        updateLanguage(savedLang);
    }
};

// Sidebar manager
const sidebarManager = {
    init() {
        this.sidebar = document.querySelector('aside');
        this.openBtn = document.getElementById('openSidebar');
        this.closeBtn = document.getElementById('closeSidebar');

        if (this.sidebar && this.openBtn && this.closeBtn) {
            this.setupEventListeners();
            this.handleResize();
        }
    },

    setupEventListeners() {
        this.openBtn.addEventListener('click', () => this.openSidebar());
        this.closeBtn.addEventListener('click', () => this.closeSidebar());

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) {
                const isClickInside = this.sidebar.contains(e.target) || this.openBtn.contains(e.target);
                if (!isClickInside && !this.sidebar.classList.contains('-translate-x-full')) {
                    this.closeSidebar();
                }
            }
        });

        // Handle resize events
        window.addEventListener('resize', () => this.handleResize());
    },

    handleResize() {
        if (window.innerWidth >= 1024) {
            this.sidebar.classList.remove('-translate-x-full');
        } else {
            this.sidebar.classList.add('-translate-x-full');
        }
    },

    openSidebar() {
        this.sidebar.classList.remove('-translate-x-full');
    },

    closeSidebar() {
        this.sidebar.classList.add('-translate-x-full');
    }
};

// Initialize theme from localStorage
const initTheme = () => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    userMenuManager.init();
    sidebarManager.init();
});
