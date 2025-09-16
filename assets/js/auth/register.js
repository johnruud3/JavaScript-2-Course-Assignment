import { loadComponents, setFavicon} from '../components.js';
import { register, isLoggedIn, getCurrentUser} from './auth.js';

document.addEventListener('DOMContentLoaded', function() {
    setFavicon();
    loadComponents();
     checkIfAlreadyLoggedIn();
    
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', handleRegister);
});

async function handleRegister(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    const result = await register(
        emailInput.value.trim(),
        passwordInput.value,
        confirmPasswordInput.value,
        nameInput.value.trim()
    );
    
    if (result.success) {
        alert(result.message);
        window.location.href = 'login.html';
    } else {
        alert(result.message);
    }
}

// Safety check incase user is already logged in
async function checkIfAlreadyLoggedIn() {
    if (isLoggedIn()) { 
        const user = getCurrentUser();
        console.log('User already logged in:', user.email);
        
        alert('You are already logged in! Redirecting...');
        
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 2000);
        return true;
    }
    return false;
}