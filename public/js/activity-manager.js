document.addEventListener('DOMContentLoaded', async () => {
    // Check if translations are loaded
    if (typeof window.activityT === 'undefined' || typeof window.showNotification === 'undefined') {
        console.error('Required dependencies not loaded');
        return;
    }

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

    // Get botId from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    const urlBotId = urlParams.get('bot');

    // State
    let currentPage = 1;
    let totalPages = 1;
    let filters = {
        dateRange: 'today',
        botId: urlBotId || '',
        action: ''
    };

    // DOM Elements
    const activityList = document.getElementById('activityList');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const dateFilter = document.getElementById('dateFilter');
    const botFilter = document.getElementById('botFilter');
    const actionFilter = document.getElementById('actionFilter');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const startCount = document.getElementById('startCount');
    const endCount = document.getElementById('endCount');
    const totalCount = document.getElementById('totalCount');

    // Update texts based on language
    function updateTexts() {
        // Update filter options
        dateFilter.innerHTML = `
            <option value="today">${window.activityT('today')}</option>
            <option value="yesterday">${window.activityT('yesterday')}</option>
            <option value="week">${window.activityT('lastWeek')}</option>
            <option value="month">${window.activityT('lastMonth')}</option>
            <option value="custom">${window.activityT('custom')}</option>
        `;

        actionFilter.innerHTML = `
            <option value="">${window.activityT('allActions')}</option>
            <option value="login">${window.activityT('login')}</option>
            <option value="connect">${window.activityT('connect')}</option>
            <option value="disconnect">${window.activityT('disconnect')}</option>
            <option value="message">${window.activityT('message')}</option>
        `;

        // Update loading state
        loadingState.querySelector('p').textContent = window.activityT('loading');

        // Update empty state
        emptyState.querySelector('h3').textContent = window.activityT('noLogs');
        emptyState.querySelector('p').textContent = window.activityT('noLogsDesc');

        // Update pagination
        prevPageBtn.textContent = window.activityT('previous');
        nextPageBtn.textContent = window.activityT('next');
    }

    // Helper function to format date
    function formatDate(date) {
        return new Intl.DateTimeFormat(localStorage.getItem('preferred_language') || 'en', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    // Helper function to show loading state
    function showLoading() {
        loadingState.classList.remove('hidden');
        emptyState.classList.add('hidden');
        activityList.innerHTML = '';
    }

    // Helper function to show empty state
    function showEmpty() {
        loadingState.classList.add('hidden');
        emptyState.classList.remove('hidden');
        activityList.innerHTML = '';
    }

    // Helper function to update pagination
    function updatePagination(total, page, limit) {
        totalPages = Math.ceil(total / limit);
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);

        startCount.textContent = total > 0 ? start : 0;
        endCount.textContent = end;
        totalCount.textContent = total;

        prevPageBtn.disabled = page <= 1;
        nextPageBtn.disabled = page >= totalPages;
    }

    // Function to fetch activity logs
    async function fetchLogs() {
        try {
            showLoading();

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '10'
            });

            // Only add filters if they have values
            if (filters.dateRange) params.append('dateRange', filters.dateRange);
            if (filters.botId) params.append('botId', filters.botId);
            if (filters.action) params.append('action', filters.action);

            const response = await fetchWithAuth(`/api/v1/logs?${params}`);
            const data = await response.json();

            if (data.status === 'success' && data.data && Array.isArray(data.data.logs)) {
                if (data.data.logs.length === 0) {
                    showEmpty();
                    return;
                }

                loadingState.classList.add('hidden');
                activityList.innerHTML = data.data.logs.map(log => `
                    <tr class="border-b border-gray-200 dark:border-dark-100 hover:bg-gray-50 dark:hover:bg-dark-100">
                        <td class="px-6 py-4 text-sm">${formatDate(log.createdAt)}</td>
                        <td class="px-6 py-4 text-sm">${log.botName || '-'}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded-full text-xs ${
                                log.action === 'login' ? 'bg-blue-100 text-blue-800' :
                                log.action === 'connect' ? 'bg-green-100 text-green-800' :
                                log.action === 'disconnect' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                            }">
                                ${window.activityT(log.action)}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-sm">${log.details || '-'}</td>
                        <td class="px-6 py-4 text-sm">
                            <span class="px-2 py-1 rounded-full text-xs ${
                                log.status === 'success' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                            }">
                                ${log.status}
                            </span>
                        </td>
                    </tr>
                `).join('');

                updatePagination(data.data.total, data.data.page, data.data.limit);
            } else {
                showEmpty();
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            showEmpty();
        }
    }

    // Function to fetch bots for filter
    async function fetchBots() {
        try {
            const response = await fetchWithAuth('/api/v1/bots');
            const data = await response.json();

            if (data.status === 'success') {
                botFilter.innerHTML = `<option value="">${window.activityT('allBots')}</option>` + 
                    data.data.map(bot => `
                        <option value="${bot.id}" ${bot.id.toString() === filters.botId ? 'selected' : ''}>${bot.name}</option>
                    `).join('');
            }
        } catch (error) {
            console.error('Error fetching bots:', error);
        }
    }

    // Event Listeners
    dateFilter.addEventListener('change', (e) => {
        filters.dateRange = e.target.value;
        currentPage = 1;
        fetchLogs();
    });

    botFilter.addEventListener('change', (e) => {
        filters.botId = e.target.value;
        currentPage = 1;
        fetchLogs();
    });

    actionFilter.addEventListener('change', (e) => {
        filters.action = e.target.value;
        currentPage = 1;
        fetchLogs();
    });

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchLogs();
        }
    });

    nextPageBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            fetchLogs();
        }
    });

    // Language change handler
    document.addEventListener('languageChanged', () => {
        updateTexts();
        fetchLogs();
    });

    // Initialize
    updateTexts();
    await fetchBots();
    fetchLogs();
});
