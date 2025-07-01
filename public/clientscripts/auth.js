// Authentication JavaScript with security features

// Utility functions
const utils = {
    // Sanitize input to prevent XSS
    sanitizeInput: (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
    },

    // Validate email format
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Validate username format
    isValidUsername: (username) => {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    },

    // Check password strength
    checkPasswordStrength: (password) => {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score += 1;
        else feedback.push('At least 8 characters');

        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Lowercase letter');

        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Uppercase letter');

        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('Number');

        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        else feedback.push('Special character');

        const strength = {
            0: 'weak',
            1: 'weak',
            2: 'fair',
            3: 'good',
            4: 'strong',
            5: 'strong'
        };

        return {
            score: score,
            strength: strength[score] || 'weak',
            feedback: feedback
        };
    },

    // Show error message
    showError: (elementId, message) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.style.display = 'block';
        }
    },

    // Clear error message
    clearError: (elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = '';
            element.style.display = 'none';
        }
    },

    // Show general error
    showGeneralError: (message) => {
        const container = document.getElementById('error-container');
        const messageElement = document.getElementById('error-message');
        if (container && messageElement) {
            messageElement.textContent = message;
            container.style.display = 'block';
        }
    },

    // Hide general error
    hideGeneralError: () => {
        const container = document.getElementById('error-container');
        if (container) {
            container.style.display = 'none';
        }
    },

    // Set loading state
    setLoading: (buttonId, isLoading) => {
        const button = document.getElementById(buttonId);
        if (button) {
            const buttonText = button.querySelector('.button-text');
            const spinner = button.querySelector('.loading-spinner');
            
            if (isLoading) {
                button.disabled = true;
                button.classList.add('loading');
                if (buttonText) buttonText.style.display = 'none';
                if (spinner) spinner.style.display = 'inline-block';
            } else {
                button.disabled = false;
                button.classList.remove('loading');
                if (buttonText) buttonText.style.display = 'inline';
                if (spinner) spinner.style.display = 'none';
            }
        }
    }
};

// Password visibility toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.toggle-password .eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

function toggleConfirmPassword() {
    const passwordInput = document.getElementById('confirmPassword');
    const eyeIcon = document.querySelector('.toggle-password .eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// Password strength indicator
function updatePasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    if (!strengthFill || !strengthText) return;
    
    const result = utils.checkPasswordStrength(password);
    
    strengthFill.className = 'strength-fill ' + result.strength;
    strengthText.textContent = `Password strength: ${result.strength}`;
}

// Form validation
function validateLoginForm() {
    let isValid = true;
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Clear previous errors
    utils.clearError('username-error');
    utils.clearError('password-error');
    utils.hideGeneralError();
    
    // Validate username
    if (!username) {
        utils.showError('username-error', 'Username is required');
        isValid = false;
    } else if (!utils.isValidUsername(username)) {
        utils.showError('username-error', 'Username must be 3-20 characters, letters, numbers, and underscores only');
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        utils.showError('password-error', 'Password is required');
        isValid = false;
    } else if (password.length < 8) {
        utils.showError('password-error', 'Password must be at least 8 characters long');
        isValid = false;
    }
    
    return isValid;
}

function validateSignupForm() {
    let isValid = true;
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Clear previous errors
    utils.clearError('username-error');
    utils.clearError('email-error');
    utils.clearError('password-error');
    utils.clearError('confirmPassword-error');
    utils.hideGeneralError();
    
    // Validate username
    if (!username) {
        utils.showError('username-error', 'Username is required');
        isValid = false;
    } else if (!utils.isValidUsername(username)) {
        utils.showError('username-error', 'Username must be 3-20 characters, letters, numbers, and underscores only');
        isValid = false;
    }
    
    // Validate email
    if (!email) {
        utils.showError('email-error', 'Email is required');
        isValid = false;
    } else if (!utils.isValidEmail(email)) {
        utils.showError('email-error', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate password
    if (!password) {
        utils.showError('password-error', 'Password is required');
        isValid = false;
    } else if (password.length < 8) {
        utils.showError('password-error', 'Password must be at least 8 characters long');
        isValid = false;
    }
    
    // Validate confirm password
    if (!confirmPassword) {
        utils.showError('confirmPassword-error', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        utils.showError('confirmPassword-error', 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

// API calls
async function loginUser(username, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: utils.sanitizeInput(username),
                password: password
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

async function signupUser(username, email, password) {
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: utils.sanitizeInput(username),
                email: utils.sanitizeInput(email),
                password: password
            }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// Event handlers
function handleLogin(event) {
    event.preventDefault();
    
    if (!validateLoginForm()) {
        return;
    }
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    utils.setLoading('loginBtn', true);
    
    loginUser(username, password)
        .then(data => {
            // Success - redirect to main page
            window.location.href = '/';
        })
        .catch(error => {
            utils.showGeneralError(error.message);
        })
        .finally(() => {
            utils.setLoading('loginBtn', false);
        });
}

function handleSignup(event) {
    event.preventDefault();
    
    if (!validateSignupForm()) {
        return;
    }
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    utils.setLoading('signupBtn', true);
    
    signupUser(username, email, password)
        .then(data => {
            // Success - redirect to main page
            window.location.href = '/';
        })
        .catch(error => {
            utils.showGeneralError(error.message);
        })
        .finally(() => {
            utils.setLoading('signupBtn', false);
        });
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        
        // Password strength indicator
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', updatePasswordStrength);
        }
    }
    
    // Real-time validation
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.id === 'username') {
                const username = this.value.trim();
                if (username && !utils.isValidUsername(username)) {
                    utils.showError('username-error', 'Username must be 3-20 characters, letters, numbers, and underscores only');
                } else {
                    utils.clearError('username-error');
                }
            }
            
            if (this.id === 'email') {
                const email = this.value.trim();
                if (email && !utils.isValidEmail(email)) {
                    utils.showError('email-error', 'Please enter a valid email address');
                } else {
                    utils.clearError('email-error');
                }
            }
            
            if (this.id === 'confirmPassword') {
                const password = document.getElementById('password').value;
                const confirmPassword = this.value;
                if (confirmPassword && password !== confirmPassword) {
                    utils.showError('confirmPassword-error', 'Passwords do not match');
                } else {
                    utils.clearError('confirmPassword-error');
                }
            }
        });
        
        input.addEventListener('input', function() {
            // Clear error when user starts typing
            const errorId = this.id + '-error';
            utils.clearError(errorId);
            utils.hideGeneralError();
        });
    });
    
    // Rate limiting for form submissions
    let submitTimeout;
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (submitTimeout) {
                e.preventDefault();
                return;
            }
            
            submitTimeout = setTimeout(() => {
                submitTimeout = null;
            }, 2000); // 2 second cooldown
        });
    });
});

// Security: Prevent form resubmission on page refresh
if (window.history.replaceState) {
    window.history.replaceState(null, null, window.location.href);
}

// Security: Clear sensitive data from memory
window.addEventListener('beforeunload', function() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        input.value = '';
    });
}); 