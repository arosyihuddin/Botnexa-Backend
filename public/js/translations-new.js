// Global translations
window.translations = {
    en: {
        // Bot operations
        createBot: 'Create New Bot',
        editBot: 'Edit Bot',
        save: 'Save',
        saveChanges: 'Save Changes',
        settings: 'Bot Settings',
        viewLogs: 'View Activity Logs',
        cancel: 'Cancel',
        settingsSaved: 'Settings saved successfully',
        settingsError: 'Error saving settings',
        loadError: 'Error loading settings',
        
        // Bot status
        connected: 'Connected',
        disconnected: 'Disconnected',
        connect: 'Connect',
        disconnect: 'Disconnect',

        // Settings
        botSettings: 'Bot Settings',
        generalSettings: 'General Settings',
        notificationSettings: 'Notification Settings',
        autoReply: 'Auto Reply',
        enableAutoReply: 'Enable Auto Reply',
        replyDelay: 'Reply Delay (seconds)',
        customReply: 'Custom Reply Message',
        enableNotifications: 'Enable Notifications',
        notifyOnMessage: 'Notify on New Message',
        notifyOnConnect: 'Notify on Connect/Disconnect',
        
        // Empty state
        noBots: 'No Bots Found',
        createFirstBot: 'Create your first bot to get started',
        
        // Actions
        confirmDelete: 'Are you sure you want to delete this bot?',
        deleteSuccess: 'Bot deleted successfully',
        deleteError: 'Error deleting bot',
        botCreated: 'Bot created successfully',
        botUpdated: 'Bot updated successfully',
        botError: 'Error occurred',
        
        // Loading states
        generating: 'Generating QR Code...',
        pleaseWait: 'Please wait...',
        connecting: 'Connecting...',
        tryAgain: 'Try Again',
        
        // QR Code
        scanQr: 'Scan QR Code',
        enterPairingCode: 'Enter Pairing Code',
        chooseLoginMethod: 'Choose Login Method',
        qrCode: 'QR Code',
        pairingCode: 'Pairing Code',

        // Account settings
        profile: 'Profile',
        updateProfile: 'Update Profile',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        preferences: 'Preferences',
        language: 'Language',
        theme: 'Theme',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        passwordChanged: 'Password changed successfully',
        passwordError: 'Error changing password',
        profileUpdated: 'Profile updated successfully',
        profileError: 'Error updating profile'
    },
    id: {
        // Bot operations
        createBot: 'Buat Bot Baru',
        editBot: 'Edit Bot',
        save: 'Simpan',
        saveChanges: 'Simpan Perubahan',
        settings: 'Pengaturan Bot',
        viewLogs: 'Lihat Log Aktivitas',
        cancel: 'Batal',
        settingsSaved: 'Pengaturan berhasil disimpan',
        settingsError: 'Gagal menyimpan pengaturan',
        loadError: 'Gagal memuat pengaturan',
        
        // Bot status
        connected: 'Terhubung',
        disconnected: 'Terputus',
        connect: 'Hubungkan',
        disconnect: 'Putuskan',

        // Settings
        botSettings: 'Pengaturan Bot',
        generalSettings: 'Pengaturan Umum',
        notificationSettings: 'Pengaturan Notifikasi',
        autoReply: 'Balas Otomatis',
        enableAutoReply: 'Aktifkan Balas Otomatis',
        replyDelay: 'Jeda Balasan (detik)',
        customReply: 'Pesan Balasan Kustom',
        enableNotifications: 'Aktifkan Notifikasi',
        notifyOnMessage: 'Notifikasi Pesan Baru',
        notifyOnConnect: 'Notifikasi Koneksi/Putus',
        
        // Empty state
        noBots: 'Tidak Ada Bot',
        createFirstBot: 'Buat bot pertama Anda untuk memulai',
        
        // Actions
        confirmDelete: 'Apakah Anda yakin ingin menghapus bot ini?',
        deleteSuccess: 'Bot berhasil dihapus',
        deleteError: 'Gagal menghapus bot',
        botCreated: 'Bot berhasil dibuat',
        botUpdated: 'Bot berhasil diperbarui',
        botError: 'Terjadi kesalahan',
        
        // Loading states
        generating: 'Membuat Kode QR...',
        pleaseWait: 'Mohon tunggu...',
        connecting: 'Menghubungkan...',
        tryAgain: 'Coba Lagi',
        
        // QR Code
        scanQr: 'Pindai Kode QR',
        enterPairingCode: 'Masukkan Kode Pemasangan',
        chooseLoginMethod: 'Pilih Metode Login',
        qrCode: 'Kode QR',
        pairingCode: 'Kode Pemasangan',

        // Account settings
        profile: 'Profil',
        updateProfile: 'Perbarui Profil',
        changePassword: 'Ubah Kata Sandi',
        currentPassword: 'Kata Sandi Saat Ini',
        newPassword: 'Kata Sandi Baru',
        confirmPassword: 'Konfirmasi Kata Sandi',
        preferences: 'Preferensi',
        language: 'Bahasa',
        theme: 'Tema',
        darkMode: 'Mode Gelap',
        lightMode: 'Mode Terang',
        passwordChanged: 'Kata sandi berhasil diubah',
        passwordError: 'Gagal mengubah kata sandi',
        profileUpdated: 'Profil berhasil diperbarui',
        profileError: 'Gagal memperbarui profil'
    }
};

// Translation helper function
window.t = function(key) {
    const lang = localStorage.getItem('preferred_language') || 'en';
    return window.translations[lang]?.[key] || window.translations.en[key] || key;
};

// Notification helper
window.showNotification = function(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg text-white ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } transition-opacity duration-500 z-50`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
};
