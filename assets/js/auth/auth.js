// Authentication Hub

export function login(email, password) {

    if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
    }
    
    if (!isValidEmail(email)) {
        return { success: false, message: 'Please enter a valid email address' };
    }
    
    // Check if user are a registered users first
    const registeredUsers = getRegisteredUsers();
    const user = registeredUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
        // User found in registered users
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', user.name || email.split('@')[0]);
        return { success: true, message: 'Login successful!' };
    }
    
    // Test user (for development)
    if (email === 'test@test.com' && password === 'password') {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', 'Test User');
        return { success: true, message: 'Login successful!' };
    }
    
    return { success: false, message: 'Invalid email or password' };
}

export function register(email, password, confirmPassword, name = '') {
    
    if (!email || !password || !confirmPassword) {
        return { success: false, message: 'All fields are required' };
    }
    
    if (!isValidEmail(email)) {
        return { success: false, message: 'Please enter a valid email address' };
    }
    
    if (password !== confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long' };
    }
    
    // Check if user already exists
    const registeredUsers = getRegisteredUsers();
    if (registeredUsers.find(u => u.email === email)) {
        return { success: false, message: 'An account with this email already exists' };
    }
    
    // Add new user
    const newUser = {
        email,
        password,
        name: name || email.split('@')[0],
        registeredAt: new Date().toISOString()
    };
    
    registeredUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
    
    return { success: true, message: 'Registration successful! You can now log in.' };
}

export function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    return { success: true, message: 'Logged out successfully' };
}

// Check if the user is logged in
export function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

export function getCurrentUser() {
    if (!isLoggedIn()) {
        return null;
    }
    
    return {
        email: localStorage.getItem('userEmail'),
        name: localStorage.getItem('userName'),
        isLoggedIn: true
    };
}

// Helper functions (Checks if it is a valid email)
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Fetches the registered users from local storage
function getRegisteredUsers() {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
}

console.log('Auth module loaded successfully');