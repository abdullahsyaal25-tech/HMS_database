@echo off
REM Relaunch as admin if needed
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo This script requires administrative privileges. Relaunching as administrator...
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

set "XAMPP_DIR=C:\xampp"
set "XAMPP_SHORTCUT=C:\ProgramData\Microsoft\Windows\Start Menu\Programs\XAMPP\XAMPP Control Panel.lnk"

echo Starting XAMPP Control Panel...
if exist "%XAMPP_SHORTCUT%" (
    start "" "%XAMPP_SHORTCUT%"
) else if exist "%XAMPP_DIR%\xampp-control.exe" (
    start "" "%XAMPP_DIR%\xampp-control.exe"
) else (
    echo Could not find XAMPP Control Panel. Check XAMPP_DIR.
    pause
    exit /b 1
)

REM Give XAMPP a moment to appear
ping -n 6 127.0.0.1 > nul

echo Attempting to start MySQL (preferred: Windows service)...
REM Try to start the MySQL service if it's installed
sc query "mysql" >nul 2>&1
if not errorlevel 1 (
    echo Found Windows service "mysql" - attempting to start...
    net start "mysql"
    if %errorlevel%==0 (
        echo Service "mysql" started.
        goto done
    ) else (
        echo Failed to start service "mysql".
    )
) else (
    echo Windows service "mysql" not found.
)

REM If no service, try XAMPP's mysqld.exe directly
if exist "%XAMPP_DIR%\mysql\bin\mysqld.exe" (
    echo Starting mysqld.exe directly...
    start "" /min "%XAMPP_DIR%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP_DIR%\mysql\bin\my.ini" --standalone --console
    timeout /t 5 >nul
    goto done
) else (
    echo mysqld.exe not found at "%XAMPP_DIR%\mysql\bin\mysqld.exe"
    echo If you need UI automation of the Control Panel use the PowerShell script or AutoHotkey.
)

:done
echo.
echo Done. Please check XAMPP Control Panel to verify MySQL status.
pause
