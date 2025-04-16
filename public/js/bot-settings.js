// Bot Settings functionality
let currentBotSettings = null;

// Initialize bot settings functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check if translations and notifications are available
    if (typeof window.t === 'undefined' || typeof window.showNotification === 'undefined') {
        console.error('Required dependencies not loaded');
        return;
    }

    const botSettingsModal = document.getElementById('botSettingsModal');
    const closeBotSettingsBtn = document.getElementById('closeBotSettingsBtn');
    const saveBotSettingsBtn = document.getElementById('saveBotSettingsBtn');
    const botSettingsForm = document.getElementById('botSettingsForm');

    // Form elements
    const enableAutoReply = document.getElementById('enableAutoReply');
    const replyDelay = document.getElementById('replyDelay');
    const customReply = document.getElementById('customReply');
    const enableNotifications = document.getElementById('enableNotifications');
    const notifyOnMessage = document.getElementById('notifyOnMessage');
    const notifyOnConnect = document.getElementById('notifyOnConnect');

    if (!botSettingsModal || !botSettingsForm) {
        console.error('Required elements not found');
        return;
    }

    // Close modal handler
    closeBotSettingsBtn?.addEventListener('click', () => {
        botSettingsModal.classList.add('hidden');
        resetForm();
    });

    // Save settings handler
    saveBotSettingsBtn?.addEventListener('click', async () => {
        if (!currentBotSettings?.botId) return;

        const settings = {
            enableAutoReply: enableAutoReply.checked,
            replyDelay: parseInt(replyDelay.value) || 0,
            customReply: customReply.value,
            enableNotifications: enableNotifications.checked,
            notifyOnMessage: notifyOnMessage.checked,
            notifyOnConnect: notifyOnConnect.checked
        };

        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/v1/bots/${currentBotSettings.botId}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ settings })
            });

            const data = await response.json();
            if (data.status === 'success') {
                window.showNotification(window.t('settingsSaved'), 'success');
                botSettingsModal.classList.add('hidden');
                resetForm();
                // Refresh bot list to show updated settings
                if (typeof window.fetchBots === 'function') {
                    await window.fetchBots();
                }
            } else {
                throw new Error(data.message || window.t('settingsError'));
            }
        } catch (error) {
            console.error('Error saving bot settings:', error);
            window.showNotification(window.t('settingsError'), 'error');
        }
    });

    // Enable/disable notification settings based on main notification toggle
    enableNotifications?.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        if (notifyOnMessage && notifyOnConnect) {
            notifyOnMessage.disabled = !isEnabled;
            notifyOnConnect.disabled = !isEnabled;
            if (!isEnabled) {
                notifyOnMessage.checked = false;
                notifyOnConnect.checked = false;
            }
        }
    });

    // Reset form helper
    function resetForm() {
        currentBotSettings = null;
        botSettingsForm.reset();
    }
});

// Function to open bot settings
window.openBotSettings = async function(botId) {
    const botSettingsModal = document.getElementById('botSettingsModal');
    const enableAutoReply = document.getElementById('enableAutoReply');
    const replyDelay = document.getElementById('replyDelay');
    const customReply = document.getElementById('customReply');
    const enableNotifications = document.getElementById('enableNotifications');
    const notifyOnMessage = document.getElementById('notifyOnMessage');
    const notifyOnConnect = document.getElementById('notifyOnConnect');

    if (!botSettingsModal || !enableAutoReply || !replyDelay || !customReply || 
        !enableNotifications || !notifyOnMessage || !notifyOnConnect) {
        console.error('Required elements not found');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/v1/bots/${botId}/settings`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (data.status === 'success') {
            const settings = data.data || {};
            currentBotSettings = { botId, ...settings };

            // Populate form with current settings
            enableAutoReply.checked = settings.enableAutoReply || false;
            replyDelay.value = settings.replyDelay || 0;
            customReply.value = settings.customReply || '';
            enableNotifications.checked = settings.enableNotifications || false;
            notifyOnMessage.checked = settings.notifyOnMessage || false;
            notifyOnConnect.checked = settings.notifyOnConnect || false;

            // Update disabled state of notification settings
            notifyOnMessage.disabled = !settings.enableNotifications;
            notifyOnConnect.disabled = !settings.enableNotifications;

            botSettingsModal.classList.remove('hidden');
        } else {
            throw new Error(data.message || window.t('loadError'));
        }
    } catch (error) {
        console.error('Error loading bot settings:', error);
        window.showNotification(window.t('loadError'), 'error');
    }
};
