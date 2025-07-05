@echo off
echo.
echo ========================================
echo   Asterisk Auto-Configuration Tool
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if script exists
if not exist "scripts\configure-asterisk.js" (
    echo ERROR: Configuration script not found
    echo Make sure you're running this from the project root directory
    pause
    exit /b 1
)

REM Run the configuration
echo Running Asterisk auto-configuration...
echo.
node scripts\configure-asterisk.js configure

echo.
echo ========================================
echo Configuration complete!
echo.
echo Next steps:
echo 1. Restart your backend server
echo 2. Restart your frontend server (npm start)
echo 3. Test connection in admin dashboard
echo.
echo SSH to Asterisk server:
echo   ssh kali@172.20.10.5
echo   Password: kali
echo ========================================
echo.
pause
