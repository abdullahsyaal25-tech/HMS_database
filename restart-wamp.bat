@echo off
echo ========================================
echo Restarting WAMP Services
echo ========================================
echo.
echo Stopping Apache...
net stop wampapache64
echo.
echo Stopping MySQL...
net stop wampmysqld64
echo.
echo Starting MySQL...
net start wampmysqld64
echo.
echo Starting Apache...
net start wampapache64
echo.
echo ========================================
echo WAMP Services Restarted!
echo ========================================
echo.
echo You can now access your HMS application at:
echo   http://192.168.42.224
echo.
pause
