# ...existing code...
$xamppShortcut = "C:\ProgramData\Microsoft\Windows\Start Menu\Programs\XAMPP\XAMPP Control Panel.lnk"
$xamppControlExe = "C:\xampp\xampp-control.exe"
$mysqlExe = "C:\xampp\mysql\bin\mysqld.exe"
$mysqlIni = "C:\xampp\mysql\bin\my.ini"

if (Test-Path $xamppShortcut) {
    Start-Process -FilePath $xamppShortcut
} elseif (Test-Path $xamppControlExe) {
    Start-Process -FilePath $xamppControlExe
} else {
    Write-Host "XAMPP Control Panel not found."
}

Write-Host "Waiting for XAMPP Control Panel to load..."
Start-Sleep -Seconds 4

# Preferred approach: start the MySQL Windows service (if installed)
try {
    $svc = Get-Service -Name "mysql" -ErrorAction Stop
    if ($svc.Status -ne 'Running') {
        Write-Host "Starting MySQL service..."
        Start-Service -Name "mysql" -ErrorAction Stop
        Write-Host "MySQL service started."
        return
    } else {
        Write-Host "MySQL service already running."
        return
    }
} catch {
    Write-Host "MySQL service not installed or cannot be controlled: $($_.Exception.Message)"
}

# Fallback: start mysqld.exe directly
if (Test-Path $mysqlExe) {
    if (Test-Path $mysqlIni) {
        Write-Host "Starting mysqld.exe directly..."
        Start-Process -FilePath $mysqlExe -ArgumentList "--defaults-file=`"$mysqlIni`" --standalone --console" -WindowStyle Hidden
        Start-Sleep -Seconds 3
        Write-Host "Started mysqld.exe (check XAMPP panel or logs)."
        return
    } else {
        Write-Host "my.ini not found at $mysqlIni"
    }
} else {
    Write-Host "mysqld.exe not found at $mysqlExe"
}

# Last-resort: attempt UI automation (fragile). Recommend using AutoHotkey for reliable clicks.
Write-Host "UI automation fallback: This is unreliable for the XAMPP Control Panel. Consider using AutoHotkey or installing MySQL as a service."
