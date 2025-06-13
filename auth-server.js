const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000; // Render will provide PORT environment variable

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory user storage (in production, use a real database)
const users = [
    {
        id: 1,
        username: 'omar',
        password: '1111', // password: 1111
        role: 'admin'
    }
];

// Session storage (in production, use Redis or database)
const sessions = new Map();

// Generate session token
function generateSessionToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// Authentication middleware
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    req.user = sessions.get(token);
    next();
}

// Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
    console.log('Login attempt:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Username and password required' 
        });
    }
    
    // Find user
    const user = users.find(u => u.username === username);
    
    if (!user) {
        console.log('User not found:', username);
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
        });
    }
      // Check password
    const isValidPassword = password === user.password; // Direct comparison for plain text
    
    if (!isValidPassword) {
        console.log('Invalid password for user:', username);
        return res.status(401).json({ 
            success: false, 
            error: 'Invalid credentials' 
        });
    }
    
    // Create session
    const token = generateSessionToken();
    sessions.set(token, {
        id: user.id,
        username: user.username,
        role: user.role,
        loginTime: new Date()
    });
    
    console.log('Login successful for:', username);
    
    res.json({
        success: true,
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    });
});

// Logout endpoint
app.post('/api/logout', requireAuth, (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    sessions.delete(token);
    
    res.json({ success: true, message: 'Logged out successfully' });
});

// Check authentication status
app.get('/api/auth/check', requireAuth, (req, res) => {
    res.json({ 
        success: true, 
        user: req.user 
    });
});

// Protected route example
app.get('/api/users', requireAuth, (req, res) => {
    // This would normally fetch from your database
    res.json({
        success: true,
        users: users.map(u => ({ id: u.id, username: u.username, role: u.role }))
    });
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle 404s
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Authentication server running on port ${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'public')}`);
    console.log(`🔐 Login credentials: omar / 1111`);
    console.log(`📊 Network payloads will be visible in browser dev tools`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
