// Global state
let bots = [];
let currentBotId = null;

// Helper function to show loading state
function showLoading(message) {
    return `
        <div class="flex flex-col items-center justify-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p class="mt-4 text-gray-500">${message}</p>
        </div>
    `;
}

// Helper function to show error state
function showError(botId, message) {
    return `
        <div class="text-center">
            <p class="text-red-500 mb-2">${message}</p>
            <button onclick="requestQRCode(${botId})" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                ${window.t('tryAgain')}
            </button>
        </div>
    `;
}

// Function to load bots
function loadBots() {
    const botListElement = document.getElementById('botList');
    if (!botListElement) return;

    botListElement.innerHTML = '';

    if (!bots.length) {
        // Show empty state
        const emptyState = document.createElement('div');
        emptyState.className = 'col-span-full text-center py-12';
        emptyState.innerHTML = `
            <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-robot text-primary text-2xl"></i>
            </div>
            <h3 class="text-lg font-semibold mb-2">${window.t('noBots')}</h3>
            <p class="text-gray-500 dark:text-gray-400">${window.t('createFirstBot')}</p>
        `;
        botListElement.appendChild(emptyState);
        return;
    }

    bots.forEach(bot => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-dark-200 rounded-lg shadow-sm p-6 space-y-4';
        
        // Create card content with proper translations
        const statusClass = bot.isConnected ? 'bg-green-500' : 'bg-gray-500';
        const buttonClass = bot.isConnected ? 
            'bg-red-500 hover:bg-red-600' : 
            'bg-primary hover:bg-primary/90';
        const statusText = bot.isConnected ? window.t('connected') : window.t('disconnected');
        const actionText = bot.isConnected ? window.t('disconnect') : window.t('connect');
        
        card.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="flex items-center space-x-3 mb-4">
                    <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <i class="fas fa-robot text-primary text-xl"></i>
                    </div>
                    <div class="flex-grow">
                        <h3 class="font-semibold">${bot.name}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${bot.number}</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="editBot(${bot.id})" class="p-2 text-gray-500 hover:text-primary" title="${window.t('editBot')}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <a href="/activity.html?bot=${bot.id}" class="p-2 text-gray-500 hover:text-primary" title="${window.t('viewLogs')}">
                            <i class="fas fa-history"></i>
                        </a>
                        <button onclick="openBotSettings(${bot.id})" class="p-2 text-gray-500 hover:text-primary" title="${window.t('settings')}">
                            <i class="fas fa-cog"></i>
                        </button>
                        <button onclick="deleteBot(${bot.id})" class="p-2 text-gray-500 hover:text-red-500" title="${window.t('confirmDelete')}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-dark-100">
                    <div class="flex items-center space-x-2">
                        <span class="w-2 h-2 rounded-full ${statusClass}"></span>
                        <span class="text-sm">${statusText}</span>
                    </div>
                    <button onclick="toggleBot(${bot.id}, ${!bot.isConnected})" 
                            class="px-4 py-2 rounded-lg ${buttonClass} text-white">
                        ${actionText}
                    </button>
                </div>
            </div>
        `;
        botListElement.appendChild(card);
    });
}

// Function to update UI text based on current language
window.updateUIText = function() {
    // Reload bots to update their text
    if (Array.isArray(bots)) {
        loadBots();
    }
    
    // Update modal texts
    const modalTitle = document.querySelector('#botModal h2');
    if (modalTitle) {
        modalTitle.textContent = currentBotId ? window.t('editBot') : window.t('createBot');
    }
    
    if (saveBotBtn) {
        saveBotBtn.textContent = currentBotId ? window.t('saveChanges') : window.t('save');
    }

    // Update login modal texts
    const loginTitle = document.querySelector('#loginMethodModal h3');
    if (loginTitle) {
        loginTitle.textContent = window.t('chooseLoginMethod');
    }

    const qrSpan = qrLoginBtn?.querySelector('span');
    if (qrSpan) {
        qrSpan.textContent = window.t('qrCode');
    }

    const pairSpan = pairingLoginBtn?.querySelector('span');
    if (pairSpan) {
        pairSpan.textContent = window.t('pairingCode');
    }
    
    // Update loading messages
    if (qrCode?.innerHTML.includes('animate-spin')) {
        qrCode.innerHTML = showLoading(window.t('generating'));
    }
    
    if (pairingCode?.textContent === 'Please wait...' || pairingCode?.textContent === 'Mohon tunggu...') {
        pairingCode.textContent = window.t('pleaseWait');
    }
};

// Language change handlers
document.addEventListener('languageChanged', window.updateUIText);

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    // Check if translations are loaded
    if (typeof window.t === 'undefined' || typeof window.showNotification === 'undefined') {
        console.error('Required dependencies not loaded');
        return;
    }

    // Check authentication first
    if (typeof authGuard === 'undefined') {
        console.error('authGuard is not defined. Please ensure authGuard.js is loaded correctly.');
    } else {
        const isAuthorized = await authGuard.guardRoute();
        if (!isAuthorized) return;
    }

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

    // Socket.io setup with authentication
    const socket = io({
        auth: {
            token: token
        }
    });

    // Handle socket authentication errors
    socket.on('connect_error', (error) => {
        if (error.message === 'Authentication failed') {
            authGuard.handleInvalidToken();
        }
    });

    // Initialize DOM Elements
    const botList = document.getElementById('botList');
    const createBotBtn = document.getElementById('createBotBtn');
    const botModal = document.getElementById('botModal');
    const loginMethodModal = document.getElementById('loginMethodModal');
    const botForm = document.getElementById('botForm');
    const botName = document.getElementById('botName');
    const botNumber = document.getElementById('botNumber');
    const closeBotModalBtn = document.getElementById('closeBotModalBtn');
    const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
    const saveBotBtn = document.getElementById('saveBotBtn');
    const qrLoginBtn = document.getElementById('qrLoginBtn');
    const pairingLoginBtn = document.getElementById('pairingLoginBtn');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const pairingCodeContainer = document.getElementById('pairingCodeContainer');
    const qrCode = document.getElementById('qrCode');
    const pairingCode = document.getElementById('pairingCode');

    // Event Listeners
    createBotBtn.addEventListener('click', () => {
        botModal.classList.remove('hidden');
    });

    // Modal close event listeners
    closeBotModalBtn.addEventListener('click', resetBotModal);
    closeLoginModalBtn.addEventListener('click', resetLoginModal);

    qrLoginBtn.addEventListener('click', () => {
        qrCodeContainer.classList.remove('hidden');
        pairingCodeContainer.classList.add('hidden');
        requestQRCode(currentBotId);
    });

    pairingLoginBtn.addEventListener('click', () => {
        qrCodeContainer.classList.add('hidden');
        pairingCodeContainer.classList.remove('hidden');
        requestPairingCode(currentBotId);
    });

    saveBotBtn.addEventListener('click', async () => {
        const formData = {
            name: botName.value.trim(),
            number: botNumber.value.trim()
        };
        
        try {
            const isEditing = Boolean(currentBotId);
            const url = isEditing ? `/api/v1/bots/${currentBotId}` : '/api/v1/bots';
            const method = isEditing ? 'PUT' : 'POST';
            
            const response = await fetchWithAuth(url, {
                method: method,
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                window.showNotification(
                    isEditing ? window.t('botUpdated') : window.t('botCreated'),
                    'success'
                );
                
                if (!isEditing) {
                    currentBotId = data.data.id;
                    loginMethodModal.classList.remove('hidden');
                }
                
                botModal.classList.add('hidden');
                botForm.reset();
                
                if (isEditing) {
                    currentBotId = null;
                }
                
                await fetchBots();
            } else {
                window.showNotification(data.message || window.t('botError'), 'error');
            }
        } catch (error) {
            console.error('Error saving bot:', error);
            window.showNotification(window.t('botError'), 'error');
        }
    });

    // Socket event handlers
    socket.on('qr', (data) => {
        if (data.botId === currentBotId) {
            try {
                // Create container for QR code
                const container = document.createElement('div');
                container.className = 'relative flex flex-col items-center w-full max-w-[280px] mx-auto';
                
                // Create QR wrapper
                const qrWrapper = document.createElement('div');
                qrWrapper.className = 'relative bg-white rounded-lg shadow-sm overflow-hidden w-full aspect-square';
                
                // Create QR display container
                const qrDisplay = document.createElement('div');
                qrDisplay.className = 'absolute inset-0 flex items-center justify-center bg-white';
                
                // Create QR code display with proper scaling
                const qrPre = document.createElement('pre');
                qrPre.className = 'font-mono text-center whitespace-pre select-none p-4';
                qrPre.style.fontSize = '12px';
                qrPre.style.lineHeight = '12px';
                qrPre.style.letterSpacing = '0';
                qrPre.style.transform = 'scale(0.45)';
                qrPre.style.transformOrigin = 'center';
                qrPre.style.margin = '-25%';
                
                // Process QR code data
                const qrText = data.qr
                    .split('\n')
                    .slice(1)
                    .map(line => 
                        Array.from(line)
                            .map(char => char === ' ' ? '  ' : '██')
                            .join('')
                    )
                    .join('\n');
                
                qrPre.textContent = qrText;
                qrDisplay.appendChild(qrPre);
                qrWrapper.appendChild(qrDisplay);
                container.appendChild(qrWrapper);
                
                // Update UI
                qrCode.innerHTML = '';
                qrCode.appendChild(container);
                qrCodeContainer.classList.remove('hidden');
                pairingCodeContainer.classList.add('hidden');

                console.log('QR code generated for bot:', currentBotId);
            } catch (error) {
                console.error('Error displaying QR code:', error);
                qrCode.innerHTML = showError(currentBotId, window.t('generating'));
            }
        }
    });

    socket.on('pairingCode', (data) => {
        if (data.botId === currentBotId && data.code) {
            pairingCode.textContent = data.code;
            qrCodeContainer.classList.add('hidden');
            pairingCodeContainer.classList.remove('hidden');
        }
    });

    socket.on('connection_update', async (data) => {
        if (data.botId === currentBotId) {
            if (data.status === 'connected') {
                loginMethodModal.classList.add('hidden');
                await fetchBots();
                window.showNotification(window.t('botCreated'), 'success');
            } else if (data.status === 'disconnected') {
                await fetchBots();
                window.showNotification(window.t('disconnected'), 'info');
            } else if (data.status === 'connecting') {
                window.showNotification(window.t('connecting'), 'info');
            }
        }
    });

    socket.on('error', (data) => {
        if (data.botId === currentBotId) {
            window.showNotification(data.message || window.t('botError'), 'error');
        }
    });

    // Function to reset bot modal state
    function resetBotModal() {
        botModal.classList.add('hidden');
        botForm.reset();
        currentBotId = null;
        
        // Reset modal title and button text
        const modalTitle = document.querySelector('#botModal h2');
        if (modalTitle) modalTitle.textContent = window.t('createBot');
        if (saveBotBtn) saveBotBtn.textContent = window.t('save');
    }

    // Function to reset login modal state
    async function resetLoginModal() {
        loginMethodModal.classList.add('hidden');
        qrCodeContainer.classList.add('hidden');
        pairingCodeContainer.classList.add('hidden');
        qrCode.innerHTML = '';
        pairingCode.textContent = '';
        
        // Disconnect the bot when modal is closed
        if (currentBotId) {
            try {
                const response = await fetchWithAuth(`/api/v1/bots/${currentBotId}/disconnect`, {
                    method: 'POST'
                });
                const data = await response.json();
                if (data.status === 'success') {
                    await fetchBots();
                    window.showNotification(window.t('disconnected'), 'info');
                }
            } catch (error) {
                console.error('Error disconnecting bot:', error);
                window.showNotification(window.t('botError'), 'error');
            }
        }
    }

    // Make functions globally accessible
    window.toggleBot = async function(id, shouldConnect) {
        try {
            if (shouldConnect) {
                currentBotId = id;
                qrCode.innerHTML = '';
                pairingCode.textContent = '';
                qrCodeContainer.classList.add('hidden');
                pairingCodeContainer.classList.add('hidden');
                loginMethodModal.classList.remove('hidden');
            } else {
                const response = await fetchWithAuth(`/api/v1/bots/${id}/disconnect`, {
                    method: 'POST'
                });
                const data = await response.json();
                if (data.status === 'success') {
                    window.showNotification(window.t('disconnected'), 'info');
                    await fetchBots();
                } else {
                    window.showNotification(window.t('botError'), 'error');
                }
            }
        } catch (error) {
            console.error('Error toggling bot:', error);
            window.showNotification(window.t('botError'), 'error');
        }
    };

    window.editBot = async function(id) {
        try {
            const response = await fetchWithAuth(`/api/v1/bots/${id}`);
            const data = await response.json();
            if (data.status === 'success') {
                const bot = data.data;
                currentBotId = bot.id;
                botName.value = bot.name;
                botNumber.value = bot.number;
                
                const modalTitle = document.querySelector('#botModal h2');
                if (modalTitle) modalTitle.textContent = window.t('editBot');
                if (saveBotBtn) saveBotBtn.textContent = window.t('saveChanges');
                
                botModal.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error fetching bot:', error);
            window.showNotification(window.t('botError'), 'error');
        }
    };

    window.deleteBot = async function(id) {
        if (!confirm(window.t('confirmDelete'))) return;
        
        try {
            const response = await fetchWithAuth(`/api/v1/bots/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            if (data.status === 'success') {
                window.showNotification(window.t('deleteSuccess'), 'success');
                await fetchBots();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error deleting bot:', error);
            window.showNotification(window.t('deleteError'), 'error');
        }
    };

    window.requestQRCode = async function(botId) {
        try {
            qrCode.innerHTML = showLoading(window.t('generating'));

            const response = await fetchWithAuth(`/api/v1/bots/${botId}/qr`);
            const data = await response.json();
            if (data.status === 'success') {
                window.showNotification(data.message, 'info');
            } else {
                throw new Error(data.message || 'Failed to generate QR code');
            }
        } catch (error) {
            console.error('Error requesting QR code:', error);
            qrCode.innerHTML = showError(botId, window.t('generating'));
        }
    };

    window.requestPairingCode = async function(botId) {
        try {
            pairingCode.textContent = window.t('pleaseWait');
            const response = await fetchWithAuth(`/api/v1/bots/${botId}/pair`);
            const data = await response.json();
            if (data.status === 'success') {
                window.showNotification(data.message, 'info');
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error requesting pairing code:', error);
            pairingCode.textContent = window.t('botError');
            window.showNotification(window.t('botError'), 'error');
        }
    };

    // Function to fetch bots
    async function fetchBots() {
        try {
            const response = await fetchWithAuth('/api/v1/bots');
            const data = await response.json();
            if (data.status === 'success') {
                bots = data.data;
                loadBots();
            } else {
                console.error('Failed to fetch bots:', data.message);
                window.showNotification(window.t('botError'), 'error');
            }
        } catch (error) {
            console.error('Error fetching bots:', error);
            window.showNotification(window.t('botError'), 'error');
        }
    }

    // Initialize
    fetchBots();
});
