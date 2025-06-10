# Firebase Setup Guide - Step by Step

## Prerequisites
- Google account
- Modern web browser
- Your user management website files

## Step 1: Create Firebase Project

1. **Visit Firebase Console**
   - Go to: https://console.firebase.google.com
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project" or "Create a project"
   - Project name: `user-info-manager` (or your preferred name)
   - Google Analytics: Choose based on your preference
   - Click "Create project"

## Step 2: Set Up Firestore Database

1. **Enable Firestore**
   - In your Firebase project dashboard
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"

2. **Choose Security Rules**
   - Select "Start in test mode" (for development)
   - This allows read/write access for 30 days
   - Click "Next"

3. **Select Location**
   - Choose a location closest to your users
   - Click "Done"

## Step 3: Register Web App

1. **Add Web App**
   - In Project Overview, click the web icon (`</>`)
   - App nickname: `user-manager-web`
   - Firebase Hosting: Check if you want hosting (optional)
   - Click "Register app"

2. **Copy Configuration**
   - You'll see a configuration object like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abcdef123456"
   };
   ```
   - **Copy this entire object**

## Step 4: Update Your Code

1. **Open** `firebase-config.js`
2. **Replace** the placeholder configuration with your actual config
3. **Save** the file

## Step 5: Test the Integration

1. **Open** `index.html` in your browser
2. **Check** the browser console (F12)
3. **Look for** "Firebase initialized successfully"
4. **Add a test user** to verify Firestore integration

## Step 6: Set Up Production Security Rules (Later)

When ready for production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{document} {
      allow read, write: if true; // Replace with proper auth rules
    }
  }
}
```

## Troubleshooting

### Common Issues:

1. **"Firebase not available" message**
   - Check if configuration is correct
   - Verify all API keys are properly copied
   - Check browser console for specific errors

2. **CORS errors**
   - Make sure you're serving files from a web server
   - Use Live Server extension in VS Code
   - Don't open HTML files directly in browser

3. **Firestore permission denied**
   - Check if test mode is enabled
   - Verify security rules allow read/write

### Getting Help:
- Check browser console for error messages
- Verify Firebase project settings
- Ensure Firestore is enabled in your project

## Next Steps After Setup:
1. Test adding users through the web interface
2. Verify data appears in Firebase console
3. Test editing and deleting users
4. Set up proper security rules for production
