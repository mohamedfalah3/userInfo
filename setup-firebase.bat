@echo off
echo ==========================================
echo   User Info Manager - Firebase Setup
echo ==========================================
echo.
echo This script will help you set up and test your Firebase project.
echo.
echo STEP 1: Firebase Project Setup
echo ------------------------------
echo 1. Go to: https://console.firebase.google.com
echo 2. Create a new project (or select existing)
echo 3. Enable Firestore Database (Start in test mode)
echo 4. Register a web app in your project
echo 5. Copy the configuration object
echo.
echo STEP 2: Update Configuration
echo ----------------------------
echo 1. Open firebase-config.js in your text editor
echo 2. Replace the placeholder values with your actual config
echo 3. Save the file
echo.
echo STEP 3: Test Your Setup
echo ----------------------
echo.
choice /C 123 /M "Choose an option: [1] Open Firebase Console [2] Open Test Page [3] Open Main App"

if errorlevel 3 goto :main_app
if errorlevel 2 goto :test_page
if errorlevel 1 goto :firebase_console

:firebase_console
echo Opening Firebase Console...
start https://console.firebase.google.com
goto :end

:test_page
echo Opening Firebase Test Page...
start test-firebase.html
goto :end

:main_app
echo Opening Main Application...
start index.html
goto :end

:end
echo.
echo Tips:
echo - Use test-firebase.html to verify your Firebase connection
echo - Check the browser console for detailed logs
echo - See FIREBASE_SETUP_DETAILED.md for complete instructions
echo.
pause
