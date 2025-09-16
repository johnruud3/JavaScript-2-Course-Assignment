import { loadComponents, setFavicon } from '../components.js';
import { login, isLoggedIn, getCurrentUser } from './auth.js';

console.log('Login.js module loaded successfully');

document.addEventListener('DOMContentLoaded', function() {
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

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!loginForm) {
        console.error('Login form not found!');
        return;
    }
    
    loginForm.addEventListener('submit', async function(e) {
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
    
    // Testing email validation
    emailInput.addEventListener('blur', function() {
        const email = this.value.trim();
        if (email && !isValidEmail(email)) {
            showFieldError(this, 'Please enter a valid email address');
        } else {
            clearFieldError(this);
        }
    });
    
    // Clearing the errors when user starts typing (LOOK OVER THIS!!!)
    emailInput.addEventListener('input', function() {
        clearFieldError(this);
    });
    
    passwordInput.addEventListener('input', function() {
        clearFieldError(this);
    });
}

// Alert boxes for invalid or succsessfull login
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
    
    // Message card, automaticly removes itself after 4 seconds
    const cardBody = document.querySelector('.card-body');
    cardBody.insertBefore(messageDiv, cardBody.firstChild);
    
    if (type === 'success') {
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 4000);
    }
}

function clearMessages() {
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => alert.remove());
}

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

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('is-invalid');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'invalid-feedback';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('is-invalid');
    const errorDiv = field.parentNode.querySelector('.invalid-feedback');
    if (errorDiv) {
        errorDiv.remove();
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}