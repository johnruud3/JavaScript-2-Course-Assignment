import { loadComponents, setFavicon } from '../components.js';
import { isLoggedIn, getCurrentUser } from './auth.js'; 

document.addEventListener('DOMContentLoaded', function() {
if (!isLoggedIn()) {
    alert('You need to be logged in to acces your profile page');
    window.href = '/pages/auth/login.html';
    return;
}

    setFavicon();
    loadComponents();
});


