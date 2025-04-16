import { ui, api } from './utils/ui.js';

// Dashboard components
const dashboard = {
    // Stats component
    stats: {
        container: '.dashboard-stats',
        update(data) {
            const container = document.querySelector(this.container);
            if (!container) return;

            // Remove loading state
            container.querySelectorAll('.card-loading').forEach(card => {
                card.classList.remove('card-loading');
            });

            // Update statistics
            Object.entries(data).forEach(([key, value]) => {
                const statElement = container.querySelector(`[data-stat="${key}"]`);
                if (statElement) {
                    statElement.textContent = value;
                }
            });
        }
    },

    // Activities component
    activities: {
        container: '.recent-activities',
        update(activities) {
            const container = document.querySelector(this.container);
            if (!container) return;

            // Remove loading state
            container.classList.remove('table-loading');

            // Update activities table
            const tbody = container.querySelector('tbody');
            if (!tbody) return;
            
            tbody.innerHTML = activities.length ? activities.map(activity => `
                <tr class="border-b border-gray-200 dark:border-dark-100">
                    <td class="py-3">${new Date(activity.timestamp).toLocaleString()}</td>
                    <td class="py-3">${activity.type}</td>
                    <td class="py-3">${activity.description}</td>
                    <td class="py-3">
                        <span class="px-2 py-1 text-xs rounded-full ${
                            activity.status === 'success' ? 'bg-green-100 text-green-800' :
                            activity.status === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }">${activity.status}</span>
                    </td>
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="4" class="py-4 text-center text-gray-500">
                        No recent activities
                    </td>
                </tr>
            `;
        }
    },

    // Bots component
    bots: {
        container: '.bot-status',
        update(bots) {
            const container = document.querySelector(this.container);
            if (!container) return;

            // Remove loading state
            container.classList.remove('table-loading');

            // Update bots table
            const tbody = container.querySelector('tbody');
            if (!tbody) return;

            tbody.innerHTML = bots.length ? bots.map(bot => `
                <tr class="border-b border-gray-200 dark:border-dark-100">
                    <td class="py-3">${bot.name}</td>
                    <td class="py-3">
                        <span class="px-2 py-1 text-xs rounded-full ${
                            bot.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }">
                            ${bot.isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </td>
                    <td class="py-3">${bot.lastActivity ? new Date(bot.lastActivity).toLocaleString() : 'N/A'}</td>
                </tr>
            `).join('') : `
                <tr>
                    <td colspan="3" class="py-4 text-center text-gray-500">
                        No bots available
                    </td>
                </tr>
            `;
        }
    },

    // Socket handling
    socket: {
        instance: null,
        init(token) {
            this.instance = io({
                auth: { token }
            });

            this.setupEventHandlers();
        },
        setupEventHandlers() {
            if (!this.instance) return;

            // Handle connection errors
            this.instance.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                if (error.message === 'Authentication failed') {
                    authGuard.handleInvalidToken();
                } else {
                    ui.showNotification('Connection error: ' + error.message, 'error');
                }
            });

            // Handle disconnection
            this.instance.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                if (reason === 'io server disconnect') {
                    authGuard.handleInvalidToken();
                } else if (reason !== 'transport close') {
                    ui.showNotification('Connection lost. Attempting to reconnect...', 'error');
                }
            });

            // Handle real-time updates
            this.instance.on('stats_update', (data) => dashboard.stats.update(data));
            this.instance.on('activity_update', () => dashboard.fetchActivities());
            this.instance.on('bot_status_update', () => dashboard.fetchBots());
        },
        cleanup() {
            if (this.instance) {
                this.instance.disconnect();
                this.instance = null;
            }
        }
    },

    // Data fetching methods
    async fetchStats() {
        try {
            const response = await api.fetch('/api/v1/dashboard/stats');
            this.stats.update(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    },

    async fetchActivities() {
        try {
            const response = await api.fetch('/api/v1/activities/recent');
            this.activities.update(response.data);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        }
    },

    async fetchBots() {
        try {
            const response = await api.fetch('/api/v1/bots');
            this.bots.update(response.data);
        } catch (error) {
            console.error('Failed to fetch bots:', error);
        }
    },

    // Initialize dashboard
    async init() {
        try {
            ui.setLoading(true);
            
            // Fetch initial data
            await Promise.all([
                this.fetchStats(),
                this.fetchActivities(),
                this.fetchBots()
            ]);

            // Initialize socket connection
            this.socket.init(api.token);

        } catch (error) {
            console.error('Dashboard initialization error:', error);
            ui.showNotification('Failed to initialize dashboard', 'error');
        } finally {
            ui.setLoading(false);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check authentication
        const isAuthorized = await authGuard.guardRoute();
        if (!isAuthorized) return;

        // Initialize dashboard
        await dashboard.init();

        // Cleanup on page unload
        window.addEventListener('unload', () => {
            dashboard.socket.cleanup();
        });

    } catch (error) {
        console.error('Error initializing page:', error);
        ui.showNotification('Failed to initialize page', 'error');
    }
});
