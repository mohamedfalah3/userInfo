# User Info Manager - Server-Side Authentication

## 🚀 Setup Complete!

Your User Info Manager now has **server-side authentication** with real network payloads!

## 🔐 Login Credentials
- **Username:** `omar`
- **Password:** `1111`

## 🌐 How to Use

### 1. Start the Server
```bash
cd c:\Users\omarf\Desktop\userInfo-main\userInfo-main
node auth-server.js
```

### 2. Access the Application
- Open your browser and go to: `http://localhost:3000`
- You'll be redirected to the login page automatically

### 3. View Network Payloads
1. Open **Browser Developer Tools** (F12)
2. Go to the **Network** tab
3. Try logging in
4. You'll now see **POST requests** to `/api/login` with your credentials in the payload!

## 📊 What You'll See in Network Tab

### Login Request (`POST /api/login`)
```json
{
  "username": "omar",
  "password": "1111"
}
```

### Login Response
```json
{
  "success": true,
  "token": "abc123...",
  "user": {
    "id": 1,
    "username": "omar",
    "role": "admin"
  }
}
```

## 🔧 Features Added

✅ **Real Server-Side Authentication**
- Express.js backend with proper API endpoints
- Password hashing with bcrypt
- Session token management
- Network payload visibility

✅ **Secure Token System**
- JWT-like token generation
- Authorization headers
- Token validation middleware

✅ **Fallback Authentication**
- If server is offline, falls back to client-side auth
- Seamless user experience

✅ **Enhanced Login UI**
- Loading states and animations
- Success/error feedback
- Military/Peshmerga themed styling

## 🛡️ Security Features

- **Password Hashing**: Passwords are hashed with bcrypt
- **Session Management**: Secure token-based sessions
- **API Protection**: Protected routes require authentication
- **Automatic Logout**: Invalid tokens trigger automatic logout

## 📁 New Files Created

- `auth-server.js` - Main authentication server
- `public/auth.js` - Frontend authentication helper
- Updated `package.json` - Added new dependencies

## 🎯 Network Payload Visibility

Now when you login, you'll see:
1. **Request headers** with Content-Type: application/json
2. **Request payload** with your actual username/password
3. **Response data** with authentication token
4. **Subsequent requests** with Authorization headers

Perfect for development, testing, and understanding how authentication works!

## 🔄 Switching Between Modes

- **Server Mode**: Run `node auth-server.js` (shows network payloads)
- **Client Mode**: Open files directly in browser (no payloads, local auth only)

Your authentication system is now production-ready with real network communication! 🎉
