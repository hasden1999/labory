@echo off
chcp 65001 >nul
title Labryo LIMS Pro - تشغيل نظام لابريو الطبي (النسخة المكتبية)
cd /d "%~dp0"

echo ========================================================
echo   تشغيل نظام لابريو لإدارة المختبرات الطبية (Labryo LIMS Pro)
echo ========================================================
echo.
echo جاري فتح برنامج سطح المكتب...

if exist ".\apps\desktop\dist\win-unpacked\Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe" (
    start "" ".\apps\desktop\dist\win-unpacked\Labryo LIMS - نظام لابريو لإدارة المختبرات الطبية.exe"
) else (
    npm run desktop
)

exit
