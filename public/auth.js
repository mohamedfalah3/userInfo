// Frontend Authentication Helper
class AuthManager {
    static getToken() {
        return localStorage.getItem('authToken');
    }
    
    static getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    static isAuthenticated() {
        const token = this.getToken();
        const sessionFlag = sessionStorage.getItem('isLoggedIn');
        return !!(token && sessionFlag === 'true');
    }
    
    static async checkServerAuth() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const response = await fetch('/api/auth/check', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.log('Server auth check failed, using local auth');
            return this.isAuthenticated();
        }
    }
    
    static logout() {
        const token = this.getToken();
        
        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        sessionStorage.removeItem('isLoggedIn');
        
        // Notify server if possible
        if (token) {
            fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).catch(() => {
                console.log('Server logout failed (offline)');
            });
        }
        
        // Redirect to login
        window.location.href = 'login.html';
    }
    
    static async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        
        if (!token) {
            throw new Error('No authentication token');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            this.logout();
            throw new Error('Authentication expired');
        }
        
        return response;
    }
}

// Enhanced authentication check for all pages
function checkAuthentication() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Skip auth check for login page
    if (currentPage === 'login.html') {
        return;
    }
    
    // Check if user is authenticated
    if (!AuthManager.isAuthenticated()) {
        console.log('User not authenticated, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    // Optional: Check with server periodically
    AuthManager.checkServerAuth().then(isValid => {
        if (!isValid) {
            console.log('Server authentication invalid');
            AuthManager.logout();
        }
    }).catch(error => {
        console.log('Auth check error:', error.message);
    });
}

// Add logout functionality to existing logout buttons
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication on page load
    checkAuthentication();
    
    // Add logout functionality to any logout buttons
    const logoutButtons = document.querySelectorAll('[data-logout], .logout-btn');
    logoutButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            AuthManager.logout();
        });
    });
    
    // Display user info if available
    const user = AuthManager.getUser();
    if (user) {
        const userDisplays = document.querySelectorAll('.user-display');
        userDisplays.forEach(display => {
            display.textContent = `Welcome, ${user.username}`;
        });
    }
});

// Make AuthManager globally available
window.AuthManager = AuthManager;
