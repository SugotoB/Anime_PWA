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

    // Validate username format (no spaces, only a-zA-Z0-9_)
    isValidUsername: (username) => {
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        return usernameRegex.test(username);
    },

    // Check password strength and requirements
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

// Function to update password requirements display
function updatePasswordRequirements(password) {
    const requirements = {
        'req-length': password.length >= 8,
        'req-lowercase': /[a-z]/.test(password),
        'req-uppercase': /[A-Z]/.test(password),
        'req-number': /[0-9]/.test(password),
        'req-special': /[^A-Za-z0-9]/.test(password)
    };
    
    Object.keys(requirements).forEach(reqId => {
        const element = document.getElementById(reqId);
        const icon = element.querySelector('.requirement-icon');
        
        if (requirements[reqId]) {
            element.classList.add('met');
            icon.textContent = '√';
        } else {
            element.classList.remove('met');
            icon.textContent = '✕';
        }
    });
}

// Function to update password missing requirements display
function updatePasswordMissing(password) {
    const missing = [];
    if (password.length < 8) missing.push('at least 8 characters');
    if (!/[a-z]/.test(password)) missing.push('lowercase letter');
    if (!/[A-Z]/.test(password)) missing.push('uppercase letter');
    if (!/[0-9]/.test(password)) missing.push('number');
    if (!/[^A-Za-z0-9]/.test(password)) missing.push('special character');
    const missingDiv = document.getElementById('password-missing');
    if (missing.length > 0 && password.length > 0) {
        missingDiv.textContent = 'Missing: ' + missing.join(', ');
        missingDiv.style.display = 'block';
    } else {
        missingDiv.textContent = '';
        missingDiv.style.display = 'none';
    }
}

// Utility function to block spaces and disallowed chars
function blockDisallowedInput(e, type) {
    let allowed;
    if (type === 'username') allowed = /^[a-zA-Z0-9_]*$/;
    else if (type === 'email') allowed = /^[a-zA-Z0-9@._+-]*$/;
    else allowed = /^[^\s]*$/; // password/confirm: no spaces
    if (!allowed.test(e.key)) {
        e.preventDefault();
    }
}

// Attach input restrictions
function attachInputRestrictions() {
    const usernameFields = document.querySelectorAll('input[name="username"]');
    usernameFields.forEach(f => {
        f.addEventListener('keypress', e => blockDisallowedInput(e, 'username'));
        f.addEventListener('paste', e => {
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            if (!/^[a-zA-Z0-9_]*$/.test(paste)) e.preventDefault();
        });
    });
    const emailFields = document.querySelectorAll('input[name="email"]');
    emailFields.forEach(f => {
        f.addEventListener('keypress', e => blockDisallowedInput(e, 'email'));
        f.addEventListener('paste', e => {
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            if (!/^[a-zA-Z0-9@._+-]*$/.test(paste)) e.preventDefault();
        });
    });
    const pwFields = document.querySelectorAll('input[type="password"]');
    pwFields.forEach(f => {
        f.addEventListener('keypress', e => blockDisallowedInput(e, 'password'));
        f.addEventListener('paste', e => {
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            if (/\s/.test(paste)) e.preventDefault();
        });
    });
}

let rateLimitInterval = null;
function showRateLimitError(retryAfter) {
    // Clear any previous interval
    if (rateLimitInterval) clearInterval(rateLimitInterval);
    let seconds = parseInt(retryAfter, 10);
    if (isNaN(seconds) || seconds <= 0) seconds = 60; // fallback
    const container = document.getElementById('error-container');
    const messageElement = document.getElementById('error-message');
    let btn = document.getElementById('loginBtn') || document.getElementById('signupBtn');
    if (btn) btn.disabled = true;
    function updateMsg() {
        if (messageElement) {
            messageElement.textContent = `Locked out for ${seconds}s`;
        }
        if (container) container.style.display = 'block';
    }
    updateMsg();
    rateLimitInterval = setInterval(() => {
        seconds--;
        if (seconds > 0) {
            updateMsg();
        } else {
            clearInterval(rateLimitInterval);
            if (container) container.style.display = 'none';
            if (btn) btn.disabled = false;
        }
    }, 1000);
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
        utils.showError('username-error', 'Username must be 3-20 characters, only letters, numbers, and underscores, no spaces.');
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
        utils.showError('username-error', 'Username must be 3-20 characters, only letters, numbers, and underscores, no spaces.');
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
    const pwStrength = utils.checkPasswordStrength(password);
    if (!password) {
        utils.showError('password-error', 'Password is required');
        isValid = false;
    } else if (pwStrength.score < 4) {
        utils.showError('password-error', 'Password must be at least 8 characters, include uppercase, lowercase, number, and special character.');
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

// Remove password visibility toggle event listeners and DOM elements if present
function removePasswordToggles() {
    const toggles = document.querySelectorAll('.toggle-password');
    toggles.forEach(t => t.remove());
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
        if (response.status === 429) {
            const retry = response.headers.get('Retry-After');
            showRateLimitError(retry);
            throw new Error('Rate limited');
        }
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
        if (response.status === 429) {
            const retry = response.headers.get('Retry-After');
            showRateLimitError(retry);
            throw new Error('Rate limited');
        }
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
    removePasswordToggles();
    attachInputRestrictions();
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Signup form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Real-time validation
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.id === 'username') {
                const username = this.value.trim();
                if (username && !utils.isValidUsername(username)) {
                    utils.showError('username-error', 'Username must be 3-20 characters, only letters, numbers, and underscores, no spaces.');
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
    
    // Password strength indicator and requirements
    const passwordInput = document.getElementById('password');
    const passwordStrength = document.getElementById('password-strength');
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    const passwordMissing = document.getElementById('password-missing');
    
    if (passwordInput && passwordStrength && strengthFill && strengthText && passwordMissing) {
        passwordInput.addEventListener('focus', function() {
            passwordStrength.style.display = 'block';
            passwordMissing.style.display = 'block';
        });
        
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            if (password.length > 0) {
                passwordStrength.style.display = 'block';
                passwordMissing.style.display = 'block';
                const strength = utils.checkPasswordStrength(password);
                
                // Update strength bar
                strengthFill.className = 'strength-fill ' + strength.strength;
                
                // Update strength text
                strengthText.textContent = 'Password strength: ' + strength.strength.charAt(0).toUpperCase() + strength.strength.slice(1);
                
                // Update text color based on strength
                if (strength.strength === 'weak') {
                    strengthText.style.color = '#e74c3c';
                } else if (strength.strength === 'fair') {
                    strengthText.style.color = '#f39c12';
                } else if (strength.strength === 'good') {
                    strengthText.style.color = '#f1c40f';
                } else {
                    strengthText.style.color = '#27ae60';
                }
                
                // Update password missing requirements
                updatePasswordMissing(password);
            } else {
                passwordStrength.style.display = 'none';
                passwordMissing.style.display = 'none';
            }
        });
        
        passwordInput.addEventListener('blur', function() {
            // Keep indicators visible if there's content
            if (this.value.length === 0) {
                passwordStrength.style.display = 'none';
                passwordMissing.style.display = 'none';
            }
        });
    }
    
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

    // Add this after DOMContentLoaded and before other input event listeners
    const allInputs = document.querySelectorAll('input');
    allInputs.forEach(input => {
        input.addEventListener('blur', function() {
            this.classList.add('touched');
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

// Remove double warning for delete account
async function handleDeleteAccount() {
    const confirmation = confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your anime data.');
    if (!confirmation) return;
    try {
        const response = await fetch('/api/auth/delete-account', {
            method: 'DELETE',
            credentials: 'include'
        });
        if (response.ok) {
            alert('Account deleted successfully');
            window.location.href = '/signup.html';
        } else {
            const data = await response.json();
            alert('Failed to delete account: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Delete account error:', error);
        alert('Failed to delete account. Please try again.');
    }
} 