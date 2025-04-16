// Activity page translations
window.activityTranslations = {
    en: {
        loading: 'Loading activity logs...',
        noLogs: 'No Activity Logs',
        noLogsDesc: 'No activity logs found for the selected filters.',
        today: 'Today',
        yesterday: 'Yesterday',
        lastWeek: 'Last 7 days',
        lastMonth: 'Last 30 days',
        custom: 'Custom Range',
        allBots: 'All Bots',
        allActions: 'All Actions',
        login: 'Login',
        connect: 'Connect',
        disconnect: 'Disconnect',
        message: 'Message',
        showing: 'Showing',
        of: 'of',
        logs: 'logs',
        previous: 'Previous',
        next: 'Next'
    },
    id: {
        loading: 'Memuat log aktivitas...',
        noLogs: 'Tidak Ada Log Aktivitas',
        noLogsDesc: 'Tidak ada log aktivitas untuk filter yang dipilih.',
        today: 'Hari Ini',
        yesterday: 'Kemarin',
        lastWeek: '7 hari terakhir',
        lastMonth: '30 hari terakhir',
        custom: 'Rentang Kustom',
        allBots: 'Semua Bot',
        allActions: 'Semua Aksi',
        login: 'Login',
        connect: 'Hubungkan',
        disconnect: 'Putuskan',
        message: 'Pesan',
        showing: 'Menampilkan',
        of: 'dari',
        logs: 'log',
        previous: 'Sebelumnya',
        next: 'Berikutnya'
    }
};

// Activity translation helper function
window.activityT = function(key) {
    const lang = localStorage.getItem('preferred_language') || 'en';
    return window.activityTranslations[lang]?.[key] || window.activityTranslations.en[key] || key;
};
