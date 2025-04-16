document.addEventListener('DOMContentLoaded', () => {
    // Update sidebar with enhanced accessibility and transitions
    const currentPath = window.location.pathname;
    const sidebarContent = `
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-100">
            <a href="/dashboard.html" class="text-2xl font-bold text-primary transition-colors duration-200 hover:text-primary/80" aria-label="BotNexa Dashboard">BotNexa</a>
            <button id="closeSidebar" class="lg:hidden text-gray-500 hover:text-primary transition-colors duration-200 p-2 rounded-lg" aria-label="Close Sidebar">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <nav class="p-4" aria-label="Main Navigation">
            <ul class="space-y-2" role="list">
                <li>
                    <a href="/dashboard.html" 
                       class="flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${currentPath === '/dashboard.html' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-dark-100'}"
                       aria-current="${currentPath === '/dashboard.html' ? 'page' : 'false'}">
                        <i class="fas fa-chart-line" aria-hidden="true"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="/bots.html" 
                       class="flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${currentPath === '/bots.html' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-dark-100'}"
                       aria-current="${currentPath === '/bots.html' ? 'page' : 'false'}">
                        <i class="fas fa-robot" aria-hidden="true"></i>
                        <span>Bots</span>
                    </a>
                </li>
                <li>
                    <a href="/activity.html" 
                       class="flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${currentPath === '/activity.html' ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-dark-100'}"
                       aria-current="${currentPath === '/activity.html' ? 'page' : 'false'}">
                        <i class="fas fa-history" aria-hidden="true"></i>
                        <span>Activity Logs</span>
                    </a>
                </li>
            </ul>
        </nav>
    `;

    // Update user menu with enhanced accessibility and animations
    const userMenuContent = `
        <div class="relative">
            <button id="userMenu" 
                    class="flex items-center space-x-2 rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-dark-100"
                    aria-expanded="false"
                    aria-haspopup="true"
                    aria-controls="userMenuDropdown">
                <img src="https://ui-avatars.com/api/?name=User&background=6366f1&color=fff" 
                     alt="" 
                     class="w-8 h-8 rounded-full"
                     aria-hidden="true">
                <span id="userName" class="hidden md:inline">User Name</span>
                <i class="fas fa-chevron-down ml-1 text-xs transition-transform duration-200" aria-hidden="true"></i>
            </button>
            <div id="userMenuDropdown" 
                 class="hidden absolute right-0 mt-2 w-48 bg-white dark:bg-dark-200 rounded-lg shadow-lg py-2 z-50 transform opacity-0 scale-95 transition-all duration-200"
                 role="menu"
                 aria-orientation="vertical"
                 aria-labelledby="userMenu">
                <a href="/account.html" 
                   class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors duration-200"
                   role="menuitem">
                    <i class="fas fa-user mr-2" aria-hidden="true"></i>
                    <span>Profile</span>
                </a>
                <a href="/account.html#preferences" 
                   class="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors duration-200"
                   role="menuitem">
                    <i class="fas fa-cog mr-2" aria-hidden="true"></i>
                    <span>Settings</span>
                </a>
                <hr class="my-2 border-gray-200 dark:border-dark-100" role="separator">
                <button id="logoutBtn" 
                        class="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-dark-100 transition-colors duration-200"
                        role="menuitem">
                    <i class="fas fa-sign-out-alt mr-2" aria-hidden="true"></i>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    `;

    // Update sidebar and user menu content
    const sidebar = document.querySelector('aside');
    const userMenuContainer = document.querySelector('#userMenu').parentElement;
    
    if (sidebar) {
        sidebar.innerHTML = sidebarContent;
    }
    
    if (userMenuContainer) {
        userMenuContainer.outerHTML = userMenuContent;
    }

    // Enhanced dropdown menu functionality with transitions
    const userMenu = document.getElementById('userMenu');
    const userMenuDropdown = document.getElementById('userMenuDropdown');
    const userMenuIcon = userMenu?.querySelector('.fa-chevron-down');
    
    if (userMenu && userMenuDropdown) {
        const toggleDropdown = (show) => {
            // Update ARIA attributes
            userMenu.setAttribute('aria-expanded', show ? 'true' : 'false');
            
            // Toggle visibility with animation
            if (show) {
                userMenuDropdown.classList.remove('hidden');
                // Trigger animation
                setTimeout(() => {
                    userMenuDropdown.classList.remove('opacity-0', 'scale-95');
                    userMenuDropdown.classList.add('opacity-100', 'scale-100');
                    // Rotate chevron icon
                    userMenuIcon?.classList.add('rotate-180');
                }, 10);
            } else {
                userMenuDropdown.classList.add('opacity-0', 'scale-95');
                userMenuDropdown.classList.remove('opacity-100', 'scale-100');
                // Rotate chevron icon back
                userMenuIcon?.classList.remove('rotate-180');
                // Hide after animation
                setTimeout(() => {
                    userMenuDropdown.classList.add('hidden');
                }, 200);
            }
        };

        // Toggle on button click
        userMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = userMenu.getAttribute('aria-expanded') === 'true';
            toggleDropdown(!isExpanded);
        });

        // Handle keyboard navigation
        userMenu.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const isExpanded = userMenu.getAttribute('aria-expanded') === 'true';
                toggleDropdown(!isExpanded);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            toggleDropdown(false);
        });

        // Prevent dropdown from closing when clicking inside
        userMenuDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Handle escape key to close dropdown
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && userMenu.getAttribute('aria-expanded') === 'true') {
                toggleDropdown(false);
            }
        });
    }

    // Enhanced mobile sidebar functionality with transitions and overlay
    const openSidebarBtn = document.getElementById('openSidebar');
    const closeSidebarBtn = document.getElementById('closeSidebar');
    
    // Create overlay for mobile sidebar
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-40 hidden transition-opacity duration-300 ease-in-out opacity-0';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    const toggleSidebar = (show) => {
        if (show) {
            // Show sidebar with transition
            sidebar.classList.remove('-translate-x-full');
            sidebar.setAttribute('aria-hidden', 'false');
            
            // Show overlay with fade
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.remove('opacity-0');
            }, 10);

            // Trap focus within sidebar
            const focusableElements = sidebar.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];
            firstFocusable?.focus();

            // Handle tab key navigation
            sidebar.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                    if (e.shiftKey && document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable?.focus();
                    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable?.focus();
                    }
                }
            });
        } else {
            // Hide sidebar with transition
            sidebar.classList.add('-translate-x-full');
            sidebar.setAttribute('aria-hidden', 'true');
            
            // Hide overlay with fade
            overlay.classList.add('opacity-0');
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 300);
        }
    };

    if (openSidebarBtn && sidebar) {
        openSidebarBtn.addEventListener('click', () => {
            toggleSidebar(true);
        });
    }
    
    if (closeSidebarBtn && sidebar) {
        closeSidebarBtn.addEventListener('click', () => {
            toggleSidebar(false);
        });
    }

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        toggleSidebar(false);
    });

    // Handle escape key to close sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !sidebar.classList.contains('-translate-x-full')) {
            toggleSidebar(false);
        }
    });

    // Handle resize events with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth >= 1024) {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.add('hidden', 'opacity-0');
            } else {
                sidebar.classList.add('-translate-x-full');
            }
        }, 100);
    });

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authGuard.logout();
        });
    }

    // Update username if available
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.name) {
            userNameElement.textContent = user.name;
        }
    }

    // Enhanced theme management
    const initializeTheme = () => {
        // Check for system preference first, then stored preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const storedTheme = localStorage.getItem('theme');
        const prefersDark = storedTheme === 'dark' || (!storedTheme && systemPrefersDark);

        // Apply theme
        document.documentElement.classList.toggle('dark', prefersDark);

        // Update any theme toggles in the UI
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = prefersDark;
        }

        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { isDark: prefersDark } 
        }));
    };

    // Handle theme toggle
    const handleThemeToggle = (isDark) => {
        // Update theme
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');

        // Update any theme toggles in the UI
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.checked = isDark;
        }

        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { isDark } 
        }));
    };

    // Set up theme toggle listeners
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', (e) => {
            handleThemeToggle(e.target.checked);
        });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            // Only auto-switch if user hasn't set a preference
            handleThemeToggle(e.matches);
        }
    });

    // Initialize theme on load
    initializeTheme();
});
