@echo off
chcp 65001 >nul
title Labryo LIMS Pro - نظام لابريو لإدارة المختبرات الطبية (النسخة المكتبية)
echo ========================================================
echo   جاري تشغيل نظام لابريو الطبي Labryo LIMS Pro (النسخة المحلية Offline)...
echo ========================================================
cd /d "%~dp0"

echo [1/2] التحقق من تشغيل الخدمات المحلية...
start /b cmd /c "npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] فتح نافذة برنامج سطح المكتب...
start "" ".\apps\desktop\dist\win-unpacked\Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe" || start "" ".\apps\desktop\dist\win-unpacked\مختبر الرضا - إدارة المختبرات الطبية.exe" || start http://localhost:8080

exit
