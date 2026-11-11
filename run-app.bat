@echo off
setlocal
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0check-env.ps1"
if errorlevel 1 (
    echo.
    echo Environment check failed. Fix the issues above and try again.
    pause
    exit /b 1
)

if "%GMAIL_USERNAME%"=="" set /p GMAIL_USERNAME=Gmail address for password-reset mail: 
if "%GMAIL_APP_PASSWORD%"=="" set /p GMAIL_APP_PASSWORD=Gmail app password: 
start "Aralytics Backend" /d "%~dp0backend" cmd /k ".\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev,seed"
start "Aralytics Frontend" /d "%~dp0frontend" cmd /k "npm run dev"

echo.
echo Backend starting on port 8080... Frontend starting on port 3000... Close the newly opened windows to stop the app.
echo.
pause
endlocal
