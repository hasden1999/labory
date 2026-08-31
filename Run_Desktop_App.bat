@echo off
title Lab Manager LIS - Desktop Edition
cd /d "%~dp0"
start /b cmd /c "npm run dev"
timeout /t 3 /nobreak >nul
start "" ".\apps\desktop\dist\win-unpacked\مختبر الرضا - إدارة المختبرات الطبية.exe" || start http://localhost:8080
exit
