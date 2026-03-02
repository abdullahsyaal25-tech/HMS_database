@echo off
echo ========================================
echo WAMP LAN Access Firewall Configuration
echo ========================================
echo.

echo This script will configure Windows Firewall to allow WAMP services
echo to accept connections from other computers on your LAN.
echo.

echo Step 1: Allowing Apache HTTP (Port 80)...
netsh advfirewall firewall add rule name="WAMP Apache HTTP" dir=in action=allow protocol=tcp localport=80

echo Step 2: Allowing Apache HTTPS (Port 443)...
netsh advfirewall firewall add rule name="WAMP Apache HTTPS" dir=in action=allow protocol=tcp localport=443

echo Step 3: Allowing MySQL (Port 3306)...
netsh advfirewall firewall add rule name="WAMP MySQL" dir=in action=allow protocol=tcp localport=3306

echo.
echo ========================================
echo Firewall rules added successfully!
echo ========================================
echo.
echo To verify the rules, run:
echo   netsh advfirewall firewall show rule name=all
echo.
echo Now you need to:
echo 1. Restart WAMP services
echo 2. Find your computer's IP address (run: ipconfig)
echo 3. Access your HMS from another computer using: http://YOUR_IP_ADDRESS
echo.
pause
