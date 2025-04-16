import { ui, api } from './utils/ui.js';

// Activity logs manager
const activityManager = {
    // State
    state: {
        currentPage: 1,
        totalPages: 1,
        pageSize: 10,
        filters: {
            botId: '',
            action: '',
            dateRange: ''
        }
    },

    // Format activity row
    getActivityRowHTML(activity) {
        const statusColors = {
            success: 'bg-green-100 text-green-800',
            error: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800'
        };

        return `
            <tr class="border-b border-gray-200 dark:border-dark-100">
                <td class="p-4">${new Date(activity.createdAt).toLocaleString()}</td>
                <td class="p-4">${activity.botName || 'System'}</td>
                <td class="p-4">${activity.action}</td>
                <td class="p-4">${activity.details}</td>
                <td class="p-4">
                    <span class="px-2 py-1 text-xs rounded-full ${statusColors[activity.status] || statusColors.pending}">
                        ${activity.status}
                    </span>
                </td>
            </tr>
        `;
    },

    // Update table with activities
    updateTable(activities) {
        const tbody = document.querySelector('.activity-table tbody');
        if (!tbody) return;

        if (!activities || activities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="p-4 text-center text-gray-500">
                        No activities found
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = activities.map(activity => this.getActivityRowHTML(activity)).join('');
    },

    // Update pagination controls
    updatePagination(total, page, limit) {
        const start = (page - 1) * limit + 1;
        const end = Math.min(start + limit - 1, total);
        
        const pageInfo = document.getElementById('pageInfo');
        if (pageInfo) {
            pageInfo.textContent = `${start}-${end} of ${total}`;
        }

        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) prevBtn.disabled = page === 1;
        if (nextBtn) nextBtn.disabled = end >= total;

        this.state.totalPages = Math.ceil(total / limit);
    },

    // Load bot options for filter
    async loadBotOptions() {
        try {
            const response = await api.fetch('/api/v1/bots');
            const botFilter = document.getElementById('botFilter');
            if (botFilter && response.data) {
                const options = response.data.map(bot => 
                    `<option value="${bot.id}">${bot.name}</option>`
                ).join('');
                botFilter.innerHTML += options;
            }
        } catch (error) {
            console.error('Failed to load bot options:', error);
        }
    },

    // Fetch activities with filters and pagination
    async fetchActivities() {
        try {
            ui.setLoading(true);
            const table = document.querySelector('.activity-table');
            if (table) table.classList.add('table-loading');

            const queryParams = new URLSearchParams({
                page: this.state.currentPage.toString(),
                limit: this.state.pageSize.toString()
            });

            // Add non-empty filters
            Object.entries(this.state.filters).forEach(([key, value]) => {
                if (value) queryParams.append(key, value);
            });

            const response = await api.fetch(`/api/v1/logs?${queryParams}`);
            
            if (response.status === 'success' && response.data) {
                this.updateTable(response.data.logs);
                this.updatePagination(
                    response.data.total,
                    response.data.page,
                    response.data.limit
                );
            }
        } catch (error) {
            console.error('Failed to load activities:', error);
            ui.showNotification('Failed to load activities', 'error');
        } finally {
            ui.setLoading(false);
            const table = document.querySelector('.activity-table');
            if (table) table.classList.remove('table-loading');
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Filter changes
        ['botFilter', 'typeFilter', 'statusFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => {
                    this.state.filters = {
                        botId: document.getElementById('botFilter').value,
                        action: document.getElementById('typeFilter').value,
                        status: document.getElementById('statusFilter').value
                    };
                    this.state.currentPage = 1;
                    this.fetchActivities();
                });
            }
        });

        // Pagination
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.state.currentPage > 1) {
                    this.state.currentPage--;
                    this.fetchActivities();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (this.state.currentPage < this.state.totalPages) {
                    this.state.currentPage++;
                    this.fetchActivities();
                }
            });
        }

        // Real-time updates
        const socket = io({
            auth: { token: api.token }
        });

        socket.on('activity_created', () => this.fetchActivities());
        
        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            if (error.message === 'Authentication failed') {
                authGuard.handleInvalidToken();
            }
        });
    },

    // Initialize
    async init() {
        try {
            await Promise.all([
                this.loadBotOptions(),
                this.fetchActivities()
            ]);
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize activity page:', error);
            ui.showNotification('Failed to initialize page', 'error');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const isAuthorized = await authGuard.guardRoute();
        if (!isAuthorized) return;

        await activityManager.init();
    } catch (error) {
        console.error('Error initializing page:', error);
        ui.showNotification('Failed to initialize page', 'error');
    }
});
