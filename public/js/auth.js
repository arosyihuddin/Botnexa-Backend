// Wait for DOM to be fully loaded
// API Configuration
const API_CONFIG = {
    BASE_URL: '/api/v1',
    ENDPOINTS: {
        LOGIN: '/users/login',
        REGISTER: '/users/register'
    }
};

// API utility functions
const api = {
        async request(endpoint, data) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                
                const responseData = await response.json();
                return {
                    ok: response.ok,
                    data: responseData.data,
                    status: response.status
                };
            } catch (error) {
                console.error('API request failed:', error);
                return {
                    ok: false,
                    error: 'Network error. Please check your connection and try again.'
                };
            }
        },

    async login(email, password) {
        return this.request(API_CONFIG.ENDPOINTS.LOGIN, { email, password });
    },

    async register(userData) {
        return this.request(API_CONFIG.ENDPOINTS.REGISTER, userData);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Initializing authentication page...');
        
        // Check for auth error messages
        const authError = sessionStorage.getItem('auth_error');
        if (authError) {
            // Create and show error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
            errorMessage.setAttribute('role', 'alert');
            errorMessage.textContent = authError;
            
            // Add to form
            const form = document.querySelector('form');
            if (form) {
                form.insertBefore(errorMessage, form.firstChild);
            }
            
            // Clear the message from session storage
            sessionStorage.removeItem('auth_error');
        }
        
        // Theme management
        const themeManager = {
            init() {
                console.log('Initializing theme manager...');
                this.root = document.documentElement;
                this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
                this.savedTheme = localStorage.getItem('theme');
                
                // Set initial theme
                const shouldBeDark = this.savedTheme === 'dark' || (!this.savedTheme && this.prefersDark.matches);
                this.setTheme(shouldBeDark ? 'dark' : 'light', true);
                
                // Set up event listeners
                this.setupEventListeners();
            },
            
            setTheme(theme, isInitial = false) {
                console.log('Setting theme to:', theme);
                const isDark = theme === 'dark';
                
                // Update classes
                this.root.classList.toggle('dark', isDark);
                
                // Update icons
                const sunIcons = document.querySelectorAll('.fa-sun');
                const moonIcons = document.querySelectorAll('.fa-moon');
                
                sunIcons.forEach(icon => icon.classList.toggle('hidden', isDark));
                moonIcons.forEach(icon => icon.classList.toggle('hidden', !isDark));
                
                // Save preference
                localStorage.setItem('theme', theme);
            },
            
            toggleTheme(e) {
                if (e) e.preventDefault();
                const newTheme = this.root.classList.contains('dark') ? 'light' : 'dark';
                this.setTheme(newTheme);
            },
            
            setupEventListeners() {
                const themeToggle = document.getElementById('themeToggle');
                if (themeToggle) {
                    themeToggle.addEventListener('click', (e) => this.toggleTheme(e));
                }
                
                this.prefersDark.addEventListener('change', (e) => {
                    if (!this.savedTheme) {
                        this.setTheme(e.matches ? 'dark' : 'light');
                    }
                });
            }
        };

        // Initialize theme management
        themeManager.init();

        // Form validation and submission
        const form = document.querySelector('form');
        const isRegisterPage = window.location.pathname.includes('register');

        // Helper function to show error message with enhanced accessibility
        function showError(inputElement, message) {
            console.log('Showing error for:', inputElement.id, 'Message:', message);
            // Remove any existing error message
            const existingError = inputElement.parentElement.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            // Create and add new error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message text-red-500 text-sm mt-1';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.setAttribute('aria-live', 'polite');
            errorDiv.id = `${inputElement.id}-error`;
            errorDiv.textContent = message;
            
            inputElement.parentElement.appendChild(errorDiv);
            inputElement.classList.add('border-red-500');
            
            // Enhanced accessibility attributes
            inputElement.setAttribute('aria-invalid', 'true');
            inputElement.setAttribute('aria-describedby', errorDiv.id);
            inputElement.focus();
        }

        // Password strength indicator
        function checkPasswordStrength(password) {
            let strength = 0;
            const feedback = [];

            // Length check
            if (password.length >= 8) {
                strength += 1;
            } else {
                feedback.push('At least 8 characters');
            }

            // Uppercase check
            if (/[A-Z]/.test(password)) {
                strength += 1;
            } else {
                feedback.push('At least 1 uppercase letter');
            }

            // Lowercase check
            if (/[a-z]/.test(password)) {
                strength += 1;
            } else {
                feedback.push('At least 1 lowercase letter');
            }

            // Number check
            if (/\d/.test(password)) {
                strength += 1;
            } else {
                feedback.push('At least 1 number');
            }

            // Special character check
            if (/[!@#$%^&*]/.test(password)) {
                strength += 1;
            } else {
                feedback.push('At least 1 special character (!@#$%^&*)');
            }

            return {
                score: strength,
                feedback: feedback
            };
        }

        // Update password strength indicator UI
        function updatePasswordStrength(password) {
            const strengthResult = checkPasswordStrength(password);
            const strengthIndicator = document.getElementById('password-strength');
            
            if (!strengthIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'password-strength';
                indicator.className = 'mt-2';
                document.getElementById('password').parentElement.appendChild(indicator);
            }

            const indicator = document.getElementById('password-strength');
            const strengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
            const strengthColors = {
                0: 'bg-red-500',
                1: 'bg-orange-500',
                2: 'bg-yellow-500',
                3: 'bg-blue-500',
                4: 'bg-green-500',
                5: 'bg-green-600'
            };

            // Create progress bar with improved styling
            const strengthScore = strengthResult.score;
            const percentage = (strengthScore / 5) * 100;
            
            indicator.innerHTML = `
                <div class="mt-2 space-y-2">
                    <div class="flex items-center justify-between">
                        <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div class="h-full transition-all duration-300 ${strengthColors[strengthScore]}" 
                                 style="width: ${percentage}%" 
                                 role="progressbar" 
                                 aria-valuenow="${strengthScore}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="5">
                            </div>
                        </div>
                        <span class="ml-3 text-sm font-medium ${strengthScore <= 1 ? 'text-red-600' : strengthScore <= 2 ? 'text-yellow-600' : 'text-green-600'}">
                            ${strengthText[strengthScore]}
                        </span>
                    </div>
                    ${strengthResult.feedback.length > 0 ? 
                        `<div class="text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                            <ul class="list-disc pl-4 space-y-1">
                                ${strengthResult.feedback.map(f => `<li>${f}</li>`).join('')}
                            </ul>
                        </div>` : 
                        ''
                    }
                </div>
            `;

            // Add ARIA live region for accessibility
            indicator.setAttribute('aria-live', 'polite');
        }

        // Helper function to clear error message
        function clearError(inputElement) {
            const errorDiv = inputElement.parentElement.querySelector('.error-message');
            if (errorDiv) {
                errorDiv.remove();
            }
            inputElement.classList.remove('border-red-500');
        }

        // Helper function to validate email format
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        // Helper function to validate password strength
        function isValidPassword(password) {
            // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
            return passwordRegex.test(password);
        }

        if (form) {
            console.log('Form found:', form);
            
            // Clear errors when input changes
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    clearError(input);
                });
            });

            // Real-time password strength check
            if (isRegisterPage) {
                const passwordInput = document.getElementById('password');
                if (passwordInput) {
                    passwordInput.addEventListener('input', (e) => {
                        updatePasswordStrength(e.target.value);
                    });
                }
            }

            // Enhanced form validation with real-time feedback
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    validateField(input);
                });
            });

            // Field-specific validation
            function validateField(input) {
                const id = input.id;
                
                switch(id) {
                    case 'email':
                        if (!input.value) {
                            showError(input, 'Email is required');
                        } else if (!isValidEmail(input.value)) {
                            showError(input, 'Please enter a valid email address');
                        } else {
                            clearError(input);
                        }
                        break;
                    case 'password':
                        if (!input.value) {
                            showError(input, 'Password is required');
                        } else if (!isValidPassword(input.value)) {
                            showError(input, 'Password must meet the strength requirements');
                        } else {
                            clearError(input);
                        }
                        break;
                    case 'confirmPassword':
                        const password = document.getElementById('password');
                        if (!input.value) {
                            showError(input, 'Please confirm your password');
                        } else if (input.value !== password.value) {
                            showError(input, 'Passwords do not match');
                        } else {
                            clearError(input);
                        }
                        break;
                    case 'firstName':
                    case 'lastName':
                        if (!input.value.trim()) {
                            showError(input, `${id === 'firstName' ? 'First' : 'Last'} name is required`);
                        } else {
                            clearError(input);
                        }
                        break;
                }
            }

            // Add form submit handler with enhanced validation
            form.addEventListener('submit', async (e) => {
                // Prevent default form submission
                e.preventDefault();
                console.log('Form submission initiated');
                console.log('Form type:', isRegisterPage ? 'Registration' : 'Login');
                const submitButton = form.querySelector('button[type="submit"]');
                // Enhanced loading state with better animation
                submitButton.disabled = true;
                const originalText = submitButton.innerHTML;
                submitButton.innerHTML = `
                    <div class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </div>
                `;

                try {
                    // Reset any existing messages
                    const existingMessages = form.querySelectorAll('.success-message, .error-message');
                    existingMessages.forEach(msg => msg.remove());
                    let hasErrors = false;
                    const email = document.getElementById('email');
                    const password = document.getElementById('password');

                    // Clear all previous errors
                    inputs.forEach(input => clearError(input));

                    console.log('Validating email:', email.value);
                    if (!email.value) {
                        showError(email, 'Email is required');
                        hasErrors = true;
                    } else if (!isValidEmail(email.value)) {
                        showError(email, 'Please enter a valid email address');
                        hasErrors = true;
                    }

                    console.log('Validating password:', '*'.repeat(8));
                    if (!password.value) {
                        showError(password, 'Password is required');
                        hasErrors = true;
                    } else if (isRegisterPage) {
                        // Additional validation only for registration
                        const firstName = document.getElementById('firstName');
                        const lastName = document.getElementById('lastName');
                        const confirmPassword = document.getElementById('confirmPassword');
                        const terms = document.getElementById('terms');

                        if (!firstName.value) {
                            showError(firstName, 'First name is required');
                            hasErrors = true;
                        }

                        if (!lastName.value) {
                            showError(lastName, 'Last name is required');
                            hasErrors = true;
                        }

                        if (!isValidPassword(password.value)) {
                            showError(password, 'Password must be at least 8 characters long and contain uppercase, lowercase, and numbers');
                            hasErrors = true;
                        }

                        if (password.value !== confirmPassword.value) {
                            showError(confirmPassword, 'Passwords do not match');
                            hasErrors = true;
                        }

                        if (!terms.checked) {
                            showError(terms, 'Please accept the terms and conditions');
                            hasErrors = true;
                        }
                    }

                    // Process form submission if no errors
                    if (!hasErrors) {
                        if (isRegisterPage) {
                            // Registration logic
                            console.log('Registration attempt:', { 
                                firstName: firstName.value, 
                                lastName: lastName.value, 
                                email: email.value 
                            });

                            const result = await api.register({
                                name: `${firstName.value} ${lastName.value}`,
                                email: email.value,
                                password: password.value
                            });

                            if (result.ok) {
                                console.log('Registration successful');
                                
                                // Show loading state
                                submitButton.disabled = true;
                                submitButton.innerHTML = 'Creating account...';

                                // Show success message
                                const successMessage = document.createElement('div');
                                successMessage.className = 'success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4';
                                successMessage.textContent = 'Registration successful! Redirecting to login page...';
                                form.insertBefore(successMessage, form.firstChild);
                                
                                // Redirect after showing success message
                                setTimeout(() => {
                                    window.location.href = 'login.html';
                                }, 2000);
                            } else {
                                // Handle specific error messages from the API
                                const errorMessage = result.data?.message || result.error || 'Registration failed. Please try again.';
                                showError(email, errorMessage);
                                submitButton.disabled = false;
                                submitButton.innerHTML = 'Create Account';
                            }
                        } else {
                            // Login logic
                            console.log('Login attempt for:', email.value);
                            const result = await api.login(email.value, password.value);

                            if (result.ok) {
                                console.log('Login successful');
                                
                                // Store the JWT token
                                if (result.data.token) {
                                    localStorage.setItem('authToken', result.data.token);
                                }

                                // Handle remember me
                                const remember = document.getElementById('remember').checked;
                                if (remember) {
                                    localStorage.setItem('rememberedEmail', email.value);
                                }

                                // Show success message
                                const successMessage = document.createElement('div');
                                successMessage.className = 'success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4';
                                successMessage.textContent = 'Login successful! Redirecting...';
                                form.insertBefore(successMessage, form.firstChild);

                                // Redirect after showing success message
                                setTimeout(() => {
                                    window.location.href = 'dashboard.html';
                                }, 1500);
                            } else {
                                // Handle specific error messages from the API
                                const errorMessage = result.data?.message || result.error || 'Invalid email or password';
                                showError(email, errorMessage);
                                submitButton.disabled = false;
                                submitButton.innerHTML = 'Sign in';
                            }
                        }
                    }
                } catch (error) {
                    console.error('Form submission error:', error);
                    const errorMessage = document.createElement('div');
                    errorMessage.className = 'error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4';
                    errorMessage.textContent = isRegisterPage ? 'Registration failed. Please try again.' : 'Login failed. Please try again.';
                    form.insertBefore(errorMessage, form.firstChild);
                } finally {
                    // Reset button state regardless of success/failure
                    submitButton.disabled = false;
                    submitButton.innerHTML = isRegisterPage ? 'Create Account' : 'Sign in';
                }
            });
        }

        // Language switching functionality
        const translations = {
            en: {
                login: {
                    title: 'Sign in to your account',
                    email: 'Email address',
                    password: 'Password',
                    remember: 'Remember me',
                    forgot: 'Forgot password?',
                    submit: 'Sign in',
                    createAccount: 'Or create a new account',
                    welcome: 'Welcome Back!',
                    welcomeText: 'Log in to access your AI-powered virtual assistant'
                },
                register: {
                    title: 'Create your account',
                    firstName: 'First Name',
                    lastName: 'Last Name',
                    email: 'Email address',
                    password: 'Password',
                    confirmPassword: 'Confirm Password',
                    terms: 'I agree to the Terms of Service and Privacy Policy',
                    submit: 'Create Account',
                    haveAccount: 'Already have an account? Sign in',
                    welcome: 'Join BotNexa Today!',
                    welcomeText: 'Create your account and start using our AI-powered virtual assistant'
                }
            },
            id: {
                login: {
                    title: 'Masuk ke akun Anda',
                    email: 'Alamat email',
                    password: 'Kata sandi',
                    remember: 'Ingat saya',
                    forgot: 'Lupa kata sandi?',
                    submit: 'Masuk',
                    createAccount: 'Atau buat akun baru',
                    welcome: 'Selamat Datang Kembali!',
                    welcomeText: 'Masuk untuk mengakses asisten virtual berbasis AI Anda'
                },
                register: {
                    title: 'Buat akun Anda',
                    firstName: 'Nama Depan',
                    lastName: 'Nama Belakang',
                    email: 'Alamat email',
                    password: 'Kata sandi',
                    confirmPassword: 'Konfirmasi Kata sandi',
                    terms: 'Saya setuju dengan Ketentuan Layanan dan Kebijakan Privasi',
                    submit: 'Buat Akun',
                    haveAccount: 'Sudah punya akun? Masuk',
                    welcome: 'Bergabung dengan BotNexa Sekarang!',
                    welcomeText: 'Buat akun Anda dan mulai menggunakan asisten virtual berbasis AI kami'
                }
            }
        };

        function updateContent(lang) {
            console.log('Updating content to:', lang);
            const t = translations[lang][isRegisterPage ? 'register' : 'login'];

            try {
                // Update page title and welcome text
                const pageTitle = document.querySelector('h2');
                const welcomeTitle = document.querySelector('.lg\\:flex h1');
                const welcomeText = document.querySelector('.lg\\:flex p');

                if (pageTitle) pageTitle.textContent = t.title;
                if (welcomeTitle) welcomeTitle.textContent = t.welcome;
                if (welcomeText) welcomeText.textContent = t.welcomeText;

                // Update form labels and placeholders
                const labels = document.querySelectorAll('label');
                labels.forEach(label => {
                    if (label.getAttribute('for') === 'email') label.textContent = t.email;
                    if (label.getAttribute('for') === 'password') label.textContent = t.password;
                    if (label.getAttribute('for') === 'remember') label.textContent = t.remember;
                    if (label.getAttribute('for') === 'firstName') label.textContent = t.firstName;
                    if (label.getAttribute('for') === 'lastName') label.textContent = t.lastName;
                    if (label.getAttribute('for') === 'confirmPassword') label.textContent = t.confirmPassword;
                    if (label.getAttribute('for') === 'terms') label.textContent = t.terms;
                });

                // Update links and buttons
                const submitButton = document.querySelector('button[type="submit"]');
                const accountLink = document.querySelector('.text-gray-600 a');
                const forgotLink = document.querySelector('a.text-primary');

                if (submitButton) submitButton.textContent = t.submit;
                if (accountLink) accountLink.textContent = isRegisterPage ? t.haveAccount : t.createAccount;
                if (forgotLink && !isRegisterPage) forgotLink.textContent = t.forgot;

                console.log('Content updated successfully');
            } catch (error) {
                console.error('Error updating content:', error);
            }
        }

        // Set up language switching
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                const newLang = e.target.value;
                updateContent(newLang);
                localStorage.setItem('language', newLang);
            });

            // Initialize with saved language or default to English
            const savedLanguage = localStorage.getItem('language') || 'en';
            languageSelect.value = savedLanguage;
            updateContent(savedLanguage);
        }

    } catch (error) {
        console.error('Error initializing auth page:', error);
    }
});
