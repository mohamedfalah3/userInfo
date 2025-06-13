@echo off
cd /d "c:\Users\omarf\Desktop\userInfo-main\userInfo-main"
echo Starting User Info Manager Authentication Server...
echo.
echo Server will be available at: http://localhost:3000
echo Login credentials: omar / 1111
echo.
echo Press Ctrl+C to stop the server
echo.
node auth-server.js
pause
