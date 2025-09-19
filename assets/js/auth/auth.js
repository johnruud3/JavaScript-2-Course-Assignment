// Authentication Hub

export async function login(email, password) {
    if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
    }
    
    if (!isValidEmail(email)) {
        return { success: false, message: 'Please enter a valid email address' };
    }
    
    try {
        const response = await fetch('https://v2.api.noroff.dev/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('accessToken', result.data.accessToken);
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userName', result.data.name);
            return { success: true, message: 'Login successful!' };
        } else {
            let errorMessage = 'Login failed';
            if (result.errors && result.errors.length > 0) {
                errorMessage = result.errors[0].message;
            }
            return { success: false, message: errorMessage };
        }
    } catch (error) {
        return { success: false, message: 'Network error' };
    }
}

export function getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    const apiKey = '63c75ef6-8dce-41bb-99ce-34f4730e150e';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Noroff-API-Key': apiKey,
    };
  }

export async function register(email, password, confirmPassword, name = '') {
    console.log('Register function called with email:', email); 
    
    if (!email || !password || !confirmPassword) {
        return { success: false, message: 'All fields are required' };
    }
    
    if (!isValidEmail(email)) {
        return { success: false, message: 'Please enter a valid email address' };
    }
    
    if (!email.endsWith('@stud.noroff.no')) {
        return { success: false, message: 'Only @stud.noroff.no email addresses are allowed' };
    }

    if (password !== confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters long' };
    }
    
    try {
        const response = await fetch('https://v2.api.noroff.dev/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name || email.split('@')[0],
                email: email,
                password: password
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            return { success: true, message: 'Registration successful! You can now log in.' };
        } else {
            let errorMessage = 'Registration failed';
        if (result.errors && result.errors.length > 0) {
            errorMessage = result.errors[0].message;
        }
        return { success: false, message: errorMessage };
        }
    } catch (error) {
        return { success: false, message: 'Network error' };
    }
}

export function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('accessToken');
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

console.log('Auth module loaded successfully');