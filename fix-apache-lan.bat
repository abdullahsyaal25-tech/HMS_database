@echo off
echo ========================================
echo WAMP Apache Restart Script (LAN Fix)
echo ========================================
echo.
echo This script will restart WAMP Apache to apply the new configuration.
echo.
echo Step 1: Restarting Apache...
echo.
echo If you see "Access is denied", right-click this file and select
echo "Run as administrator"
echo.
echo Attempting to stop Apache...
net stop wampapache64 2>nul
echo Attempting to start Apache...
net start wampapache64 2>nul
echo.
echo ========================================
echo Done!
echo ========================================
echo.
echo Now access your HMS at: http://localhost
echo Or from another computer: http://192.168.42.224
echo.
pause
