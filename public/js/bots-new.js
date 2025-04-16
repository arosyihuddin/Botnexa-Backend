import { ui, api } from './utils/ui.js';

// Bots management module
const botsManager = {
    // Bot card template
    getBotCardHTML(bot) {
        return `
            <div class="bg-white dark:bg-dark-200 rounded-lg shadow-sm overflow-hidden" data-bot-id="${bot.id}">
                <div class="p-6 border-b border-gray-200 dark:border-dark-100">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">${bot.name}</h3>
                        <span class="px-2 py-1 text-xs rounded-full ${
                            bot.isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }">
                            ${bot.isConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${bot.description || 'No description'}</p>
                </div>
                <div class="p-4 bg-gray-50 dark:bg-dark-100 flex justify-between items-center">
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        Last active: ${bot.lastActivity ? new Date(bot.lastActivity).toLocaleString() : 'Never'}
                    </div>
                    <div class="flex space-x-2">
                        <button class="bot-action-btn" data-action="settings" data-bot-id="${bot.id}"
                            title="Settings">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button class="bot-action-btn ${bot.isConnected ? 'text-red-500' : 'text-green-500'}" 
                            data-action="${bot.isConnected ? 'disconnect' : 'connect'}"
                            data-bot-id="${bot.id}"
                            title="${bot.isConnected ? 'Disconnect' : 'Connect'}">
                            <i class="fas fa-${bot.isConnected ? 'stop-circle' : 'play-circle'}"></i>
                        </button>
                        <button class="bot-action-btn text-red-500" data-action="delete" data-bot-id="${bot.id}"
                            title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Modal handling
    modals: {
        create: document.getElementById('createBotModal'),
        settings: document.getElementById('botSettingsModal'),

        show(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                const firstInput = modal.querySelector('input:not([type="hidden"])');
                if (firstInput) firstInput.focus();
            }
        },

        hide(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                const form = modal.querySelector('form');
                if (form) form.reset();
            }
        }
    },

    // Bot actions
    async createBot(data) {
        try {
            const response = await api.fetch('/api/v1/bots', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            ui.showNotification('Bot created successfully');
            this.modals.hide('createBotModal');
            await this.loadBots();
        } catch (error) {
            ui.showNotification(error.message, 'error');
        }
    },

    async updateBot(botId, data) {
        try {
            const response = await api.fetch(`/api/v1/bots/${botId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            ui.showNotification('Bot updated successfully');
            this.modals.hide('botSettingsModal');
            await this.loadBots();
        } catch (error) {
            ui.showNotification(error.message, 'error');
        }
    },

    async deleteBot(botId) {
        try {
            await api.fetch(`/api/v1/bots/${botId}`, {
                method: 'DELETE'
            });
            
            ui.showNotification('Bot deleted successfully');
            await this.loadBots();
        } catch (error) {
            ui.showNotification(error.message, 'error');
        }
    },

    async connectBot(botId) {
        try {
            await api.fetch(`/api/v1/bots/${botId}/connect`, {
                method: 'POST'
            });
            
            ui.showNotification('Bot connected successfully');
            await this.loadBots();
        } catch (error) {
            ui.showNotification(error.message, 'error');
        }
    },

    async disconnectBot(botId) {
        try {
            await api.fetch(`/api/v1/bots/${botId}/disconnect`, {
                method: 'POST'
            });
            
            ui.showNotification('Bot disconnected successfully');
            await this.loadBots();
        } catch (error) {
            ui.showNotification(error.message, 'error');
        }
    },

    // Load and render bots
    async loadBots() {
        try {
            ui.setLoading(true);
            const response = await api.fetch('/api/v1/bots');
            const botsGrid = document.querySelector('.bots-grid');
            
            if (botsGrid) {
                botsGrid.innerHTML = response.data.length ? 
                    response.data.map(bot => this.getBotCardHTML(bot)).join('') :
                    `<div class="col-span-full text-center py-8 text-gray-500">
                        No bots available. Click "Create Bot" to add one.
                    </div>`;
            }
        } catch (error) {
            ui.showNotification('Failed to load bots', 'error');
        } finally {
            ui.setLoading(false);
        }
    },

    // Setup event handlers
    setupEventListeners() {
        // Create bot
        const createBotBtn = document.getElementById('createBotBtn');
        const createBotForm = document.getElementById('createBotForm');
        const cancelCreateBot = document.getElementById('cancelCreateBot');

        if (createBotBtn) {
            createBotBtn.addEventListener('click', () => this.modals.show('createBotModal'));
        }

        if (cancelCreateBot) {
            cancelCreateBot.addEventListener('click', () => this.modals.hide('createBotModal'));
        }

        if (createBotForm) {
            createBotForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = {
                    name: document.getElementById('botName').value.trim(),
                    description: document.getElementById('botDescription').value.trim()
                };
                await this.createBot(formData);
            });
        }

        // Bot settings
        const botSettingsForm = document.getElementById('botSettingsForm');
        const cancelBotSettings = document.getElementById('cancelBotSettings');

        if (cancelBotSettings) {
            cancelBotSettings.addEventListener('click', () => this.modals.hide('botSettingsModal'));
        }

        if (botSettingsForm) {
            botSettingsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const botId = document.getElementById('botId').value;
                const formData = {
                    name: document.getElementById('editBotName').value.trim(),
                    description: document.getElementById('editBotDescription').value.trim()
                };
                await this.updateBot(botId, formData);
            });
        }

        // Bot actions
        document.addEventListener('click', async (e) => {
            const button = e.target.closest('.bot-action-btn');
            if (!button) return;

            const action = button.dataset.action;
            const botId = button.dataset.botId;

            switch (action) {
                case 'settings':
                    const bot = await api.fetch(`/api/v1/bots/${botId}`).then(r => r.data);
                    document.getElementById('botId').value = bot.id;
                    document.getElementById('editBotName').value = bot.name;
                    document.getElementById('editBotDescription').value = bot.description || '';
                    this.modals.show('botSettingsModal');
                    break;
                case 'connect':
                    await this.connectBot(botId);
                    break;
                case 'disconnect':
                    await this.disconnectBot(botId);
                    break;
                case 'delete':
                    if (confirm('Are you sure you want to delete this bot?')) {
                        await this.deleteBot(botId);
                    }
                    break;
            }
        });

        // Socket events for real-time updates
        const socket = io({
            auth: { token: api.token }
        });

        socket.on('bot_update', () => this.loadBots());
        socket.on('bot_deleted', () => this.loadBots());
    },

    // Initialize
    async init() {
        try {
            await this.loadBots();
            this.setupEventListeners();
        } catch (error) {
            console.error('Failed to initialize bots page:', error);
            ui.showNotification('Failed to initialize page', 'error');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const isAuthorized = await authGuard.guardRoute();
        if (!isAuthorized) return;

        await botsManager.init();
    } catch (error) {
        console.error('Error initializing page:', error);
        ui.showNotification('Failed to initialize page', 'error');
    }
});
