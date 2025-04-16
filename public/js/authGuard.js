// Auth Guard utility functions
const authGuard = {
    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        return !!token;
    },

    // Centralized logout function
    async logout(message = '') {
        try {
            // First try to disconnect all bots
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const response = await fetch('/api/v1/bots', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    const data = await response.json();
                    if (data.status === 'success' && data.data) {
                        // Disconnect all connected bots
                        await Promise.all(data.data
                            .filter(bot => bot.isConnected)
                            .map(bot => 
                                fetch(`/api/v1/bots/${bot.id}/disconnect`, {
                                    method: 'POST',
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                })
                            )
                        );
                    }
                } catch (error) {
                    console.error('Error disconnecting bots during logout:', error);
                }

                // Attempt server-side logout
                try {
                    await fetch('/api/v1/auth/logout', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                } catch (error) {
                    console.error('Error during server logout:', error);
                }
            }

            // Clear all local storage and session data
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            sessionStorage.clear();

            // Set logout message if provided
            if (message) {
                sessionStorage.setItem('auth_error', message);
            }

            // Redirect to login page
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Error during logout process:', error);
            // Ensure redirect happens even if there are errors
            window.location.href = '/login.html';
        }
    },

    // Redirect if authenticated
    async redirectIfAuthenticated() {
        try {
            if (this.isAuthenticated()) {
                const isValid = await this.verifyToken();
                if (isValid) {
                    window.location.href = '/dashboard.html';
                }
            }
        } catch (error) {
            console.error('Error in redirectIfAuthenticated:', error);
        }
    },

    // Verify token with server
    async verifyToken() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No token found');
            }

            const response = await fetch('/api/v1/users/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Token verification failed');
            }

            return true;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    },

    // Redirect to login if not authenticated
    async guardRoute() {
        if (!this.isAuthenticated()) {
            this.redirectToLogin();
            return false;
        }

        const isValid = await this.verifyToken();
        if (!isValid) {
            this.handleInvalidToken();
            return false;
        }

        return true;
    },

    // Handle invalid token
    handleInvalidToken() {
        localStorage.removeItem('authToken');
        this.redirectToLogin('Your session has expired. Please login again.');
    },

    // Redirect to login with optional error message
    redirectToLogin(message = '') {
        if (message) {
            sessionStorage.setItem('auth_error', message);
        }
        window.location.href = '/login.html';
    }
};

// Export for use in other files
window.authGuard = authGuard;
