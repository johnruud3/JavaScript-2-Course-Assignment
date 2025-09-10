function getHeader() {
    return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark py-3">
        <div class="container">
            <a class="navbar-brand fw-bold fs-1 text-info" href="/index.html">
                <i class="bi bi-journal-text me-2"></i>Feed Me
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="/index.html">
                            <i class="bi bi-house me-1"></i>Home
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/pages/posts/create-post.html">
                            <i class="bi bi-plus-circle me-1"></i>Create Post
                        </a>
                    </li>
                </ul>
                
                <ul class="navbar-nav">
                    ${localStorage.getItem('isLoggedIn') === 'true' ? `
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle me-1"></i>${localStorage.getItem('userName') || 'User'}
                        </a>
                        <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="/pages/posts/create-post.html">
                            <i class="bi bi-plus-circle me-2 "></i>Create Post</a></li>
                        <li><a class="dropdown-item" href="/pages/auth/user-profile.html">
                            <i class="bi bi-person-circle me-2 "></i>Your profile</a></li>
                            <li><a class="dropdown-item" href="#" onclick="handleLogout()">
                                <i class="bi bi-box-arrow-right me-2"></i>Logout
                            </a></li>
                        </ul>
                    </li>` : `
                    <li class="nav-item">
                        <a class="nav-link" href="/pages/auth/login.html">
                            <i class="bi bi-box-arrow-in-right me-1"></i>Login
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="/pages/auth/register.html">
                            <i class="bi bi-person-plus me-1"></i>Register
                        </a>
                    </li>`}
                </ul>
            </div>
        </div>
    </nav>
    `;
}

function getFooter() {
    return `
    <footer class="bg-dark text-light py-4 mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5 class="text-info"><i class="bi bi-journal-text me-2"></i>Feed Me</h5>
                    <p class="mb-0">Sharing thoughts, ideas, and experiences.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p class="mb-2">&copy; 2025 Feed Me. All rights reserved.</p>
                    <div>
                        <a href="#" class="text-light me-3"><i class="bi bi-twitter"></i></a>
                        <a href="#" class="text-light me-3"><i class="bi bi-facebook"></i></a>
                        <a href="#" class="text-light me-3"><i class="bi bi-instagram"></i></a>
                        <a href="#" class="text-light"><i class="bi bi-linkedin"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </footer>
    `;
}

function loadComponents() {
    document.body.classList.add('d-flex', 'flex-column', 'min-vh-100');
    
    const headerElement = document.getElementById('header');
    if (headerElement) {
        headerElement.innerHTML = getHeader();
    }
    
    const footerElement = document.getElementById('footer');
    if (footerElement) {
        footerElement.innerHTML = getFooter();
    }
    
    const mainElement = document.querySelector('main');
    if (mainElement) {
        mainElement.classList.add('flex-grow-1');
    }

    setActiveNavLink();
}

// Set active navigation link based on the current page you are on
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        // Check if current page matches the link
        if (href && (currentPath.endsWith(href) || (href === '/index.html' && currentPath === '/'))) {
            link.classList.add('active');
        }
    });
}

function setFavicon() {
    
    // The logo/icon as a favicon
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%230dcaf0' class='bi bi-journal-text' viewBox='0 0 16 16'><path d='M5 10.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5'/><path d='M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2'/><path d='M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1z'/></svg>";
    
    // Favicon inside the tab section
    document.head.appendChild(favicon);
}


export { loadComponents, setFavicon };

// Global logout function
window.handleLogout = function() {
    if (confirm('Are you sure you want to logout?')) {
       
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        
        alert('Logged out successfully!');
        
        window.location.href = '/index.html';
    }
};

document.addEventListener('DOMContentLoaded', function() {
    setFavicon();
    loadComponents();
});

console.log('Components.js loaded successfully');
