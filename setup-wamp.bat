@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: =============================================
:: WAMP Setup Script for Hospital Management System (HMS)
:: =============================================

title HMS - WAMP Setup
cls
echo.
echo ============================================
echo    Hospital Management System - WAMP Setup
echo ============================================
echo.

:: Set project path
set "PROJECT_PATH=d:\HMS_DB\HMS_database"
set "PHP_PATH=D:\WAMP\bin\php\php8.4.15\php.exe"

:: Check if PHP exists
if not exist "%PHP_PATH%" (
    echo [ERROR] PHP not found at: %PHP_PATH%
    echo Please update the PHP_PATH in this script to match your WAMP installation.
    pause
    exit /b 1
)

echo [✓] PHP found: %PHP_PATH%
echo.

:: Check for Composer dependencies
echo Checking dependencies...
echo -------------------------------------------

if not exist "%PROJECT_PATH%\vendor" (
    echo [✗] Vendor folder not found!
    echo [INFO] Please run the following command first:
    echo        composer install
    echo.
    echo If Composer is not installed, download it from:
    echo https://getcomposer.org/download/
    echo.
    set /p CONTINUE="Continue anyway? (Y/N): "
    if /I "!CONTINUE!" neq "Y" (
        echo Setup cancelled.
        pause
        exit /b 1
    )
) else (
    echo [✓] Vendor folder found (Composer dependencies installed)
)

:: Check for Node.js dependencies
if not exist "%PROJECT_PATH%\node_modules" (
    echo [!] Node_modules folder not found!
    echo [INFO] For frontend asset building, run:
    echo        npm install
    echo        npm run build
    echo.
) else (
    echo [✓] Node_modules folder found (NPM dependencies installed)
)

echo.
echo ============================================
echo    Clearing Laravel Caches
echo ============================================
echo.

:: Navigate to project directory
cd /d "%PROJECT_PATH%"

:: Clear config cache
echo [1/5] Clearing config cache...
"%PHP_PATH%" artisan config:clear
if %errorlevel% neq 0 (
    echo [WARNING] Failed to clear config cache
) else (
    echo [✓] Config cache cleared
)
echo.

:: Clear application cache
echo [2/5] Clearing application cache...
"%PHP_PATH%" artisan cache:clear
if %errorlevel% neq 0 (
    echo [WARNING] Failed to clear application cache
) else (
    echo [✓] Application cache cleared
)
echo.

:: Clear route cache
echo [3/5] Clearing route cache...
"%PHP_PATH%" artisan route:clear
if %errorlevel% neq 0 (
    echo [WARNING] Failed to clear route cache
) else (
    echo [✓] Route cache cleared
)
echo.

:: Clear view cache
echo [4/5] Clearing view cache...
"%PHP_PATH%" artisan view:clear
if %errorlevel% neq 0 (
    echo [WARNING] Failed to clear view cache
) else (
    echo [✓] View cache cleared
)
echo.

:: Clear compiled files
echo [5/5] Clearing compiled files...
"%PHP_PATH%" artisan clear-compiled 2>nul
if %errorlevel% neq 0 (
    echo [INFO] No compiled files to clear
) else (
    echo [✓] Compiled files cleared
)

echo.
echo ============================================
echo    Cache Clearing Complete
echo ============================================
echo.

:: Check for .env file
if not exist "%PROJECT_PATH%\.env" (
    echo [WARNING] .env file not found!
    echo [INFO] Please create a .env file from .env.example:
    echo        copy .env.example .env
    echo        Then update your database and app settings.
    echo.
)

:: Display summary and next steps
echo ============================================
echo    Setup Summary
echo ============================================
echo Project Path: %PROJECT_PATH%
echo PHP Path: %PHP_PATH%
echo.

:: Check if database is configured
echo [INFO] Checking database configuration...
findstr /C:"DB_DATABASE=hospital_management_system" "%PROJECT_PATH%\.env" >nul 2>&1
if %errorlevel% == 0 (
    echo [✓] Database name is set to hospital_management_system
) else (
    echo [!] Database name might not be configured correctly
)

echo.
echo ============================================
echo    Next Steps - WAMP Configuration
echo ============================================
echo.
echo 1. VIRTUAL HOST SETUP:
echo    - Copy wamp-vhost.conf to your Apache config folder:
echo      Example: D:\WAMP\bin\apache\apacheX.X.XX\conf\extra\httpd-vhosts.conf
echo.
echo 2. HOSTS FILE UPDATE:
echo    - Open C:\Windows\System32\drivers\etc\hosts as Administrator
echo    - Add this line:
echo      127.0.0.1   hms.local
echo.
echo 3. APACHE CONFIGURATION:
echo    - Open httpd.conf and uncomment this line:
echo      Include conf/extra/httpd-vhosts.conf
echo    - Ensure mod_rewrite is enabled:
echo      LoadModule rewrite_module modules/mod_rewrite.so
echo.
echo 4. DATABASE SETUP:
echo    - Create database 'hospital_management_system' in phpMyAdmin
echo    - Run migrations: php artisan migrate --seed
echo    - Or restore from backup if available
echo.
echo 5. RESTART WAMP:
echo    - Restart all WAMP services
echo    - Access the application at: http://hms.local
echo.
echo ============================================
echo    Optional Commands
echo ============================================
echo.
echo To run database migrations:
echo    %PHP_PATH% artisan migrate
echo.
echo To seed the database with sample data:
echo    %PHP_PATH% artisan db:seed
echo.
echo To start the development server (if not using WAMP):
echo    %PHP_PATH% artisan serve
echo.
echo ============================================
echo    Troubleshooting
echo ============================================
echo.
echo - If you see '500 Internal Server Error':
echo   Check storage/logs/laravel.log for details
echo.
echo - If styles are not loading:
echo   Run: npm install ^&^& npm run build
echo.
echo - If database connection fails:
echo   Verify MySQL is running and credentials in .env are correct
echo.
echo ============================================
echo.
echo Setup process completed!
echo.
pause
