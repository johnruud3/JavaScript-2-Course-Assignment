import { loadComponents, setFavicon } from '../components.js';
import { login, isLoggedIn, getCurrentUser } from './auth.js';

console.log('Login.js module loaded successfully');

document.addEventListener('DOMContentLoaded', () => {
    setFavicon();
    loadComponents();
    
    // Check if user is logged in. If true redirect to homepage
    if (isLoggedIn()) {
        const user = getCurrentUser();
        console.log('User already logged in:', user.email);
        
        showMessage(`Welcome back! Redirecting to homepage...`, 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }
    
    setupLoginForm();
});

/**
 * Setup the login form: handle submission and input validation.
 */
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!loginForm) {
        console.error('Login form not found!');
        return;
    }
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        clearMessages();
        setLoadingState(true);
        
        try {
            const result = await login(email, password);
            
            setLoadingState(false);
            
            if (result.success) {
                showMessage(result.message, 'success');
                
                setTimeout(() => {
                    window.location.href = '../../index.html';
                }, 1500);
                
            } else {
                showMessage(result.message, 'error');
                passwordInput.value = '';
                passwordInput.focus();
            }
        } catch (error) {
            setLoadingState(false);
            showMessage('Network error - please try again');
        }
    });
    
    emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        if (email && !isValidEmail(email)) {
            showFieldError(emailInput, 'Please enter a valid email address');
        } else {
            clearFieldError(emailInput);
        }
    });
    
    emailInput.addEventListener('input', () => clearFieldError(emailInput));
    passwordInput.addEventListener('input', () => clearFieldError(passwordInput));
}

/**
 * Show an alert message above the login form.
 *
 * @param {string} message - The message to display.
 * @param {string} [type='info'] - Message type: 'success', 'error', or 'info'.
 */
function showMessage(message, type = 'info') {
    clearMessages();
    
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 'alert-info';
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `alert ${alertClass} alert-dismissible fade show`;
    messageDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const cardBody = document.querySelector('.card-body');
    cardBody.insertBefore(messageDiv, cardBody.firstChild);
    
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) messageDiv.remove();
        }, 4000);
    }
}

/** Clear all alert messages from the page */
function clearMessages() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => alert.remove());
}

/**
 * Toggle loading state for the login form submit button.
 *
 * @param {boolean} loading - True to show loading, false to reset.
 */
function setLoadingState(loading) {
    const submitBtn = document.querySelector('button[type="submit"]');
    const form = document.getElementById('loginForm');
    
    if (loading) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';
        form.classList.add('opacity-75');
    } else {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Login';
        form.classList.remove('opacity-75');
    }
}

/**
 * Show a field-specific error below the input element.
 *
 * @param {HTMLElement} field - The input element.
 * @param {string} message - Error message to display.
 */
function showFieldError(field, message) {
    clearFieldError(field);
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

/** Clear field-specific error messages */
function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('is-invalid');
    const parent = field.parentNode;
    if (!parent) return;
    const errorDiv = parent.querySelector('.invalid-feedback');
    if (errorDiv) errorDiv.remove();
}

/**
 * Validate an email address format.
 *
 * @param {string} email - Email string to validate.
 * @returns {boolean} True if email format is valid, false otherwise.
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
